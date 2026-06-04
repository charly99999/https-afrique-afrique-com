// Webhook IPN payDunya — appelé après chaque paiement.
// Vérifie le hash SHA512 de la clé master puis confirme la transaction.
import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/paydunya-ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const masterKey = process.env.PAYDUNYA_MASTER_KEY;
        if (!masterKey) return new Response("Not configured", { status: 500 });

        let body: Record<string, unknown> = {};
        const ct = request.headers.get("content-type") ?? "";
        try {
          if (ct.includes("application/json")) {
            body = await request.json();
          } else {
            const fd = await request.formData();
            for (const [k, v] of fd.entries()) body[k] = typeof v === "string" ? v : v.name;
          }
        } catch {
          return new Response("Invalid body", { status: 400 });
        }

        // payDunya envoie l'objet sous "data"
        const data = (body.data ?? body) as Record<string, unknown>;
        const receivedHash = String((data as { hash?: string }).hash ?? "");
        const expectedHash = createHash("sha512").update(masterKey).digest("hex");
        // Comparaison à temps constant (anti timing-attack)
        const recBuf = Buffer.from(receivedHash, "hex");
        const expBuf = Buffer.from(expectedHash, "hex");
        if (recBuf.length !== expBuf.length || !timingSafeEqual(recBuf, expBuf)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const status = String((data as { status?: string }).status ?? "").toLowerCase();
        const invoice = (data as { invoice?: Record<string, unknown> }).invoice ?? {};
        const token = String((invoice as { token?: string }).token ?? "");
        const custom = ((data as { custom_data?: Record<string, unknown> }).custom_data ?? {}) as Record<string, unknown>;
        const paymentId = String(custom.payment_id ?? "");

        if (!paymentId) return new Response("Missing payment_id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const newStatus = status === "completed" ? "completed" : status === "cancelled" ? "cancelled" : "failed";
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .update({
            status: newStatus,
            provider_token: token || null,
            provider_response: data as object as never,
            completed_at: newStatus === "completed" ? new Date().toISOString() : null,
          })
          .eq("id", paymentId)
          .select("*")
          .single();

        if (!payment || newStatus !== "completed") {
          return new Response("ok", { status: 200 });
        }

        // Activer l'effet selon le type
        if (payment.kind === "subscription" && payment.related_plan) {
          const { SUB_PRICES } = await import("@/data/pricing");
          const plan = SUB_PRICES[payment.related_plan as keyof typeof SUB_PRICES];
          if (plan) {
            const expires = new Date(Date.now() + plan.days * 86400 * 1000).toISOString();
            await supabaseAdmin.from("subscriptions").insert({
              user_id: payment.user_id,
              plan: payment.related_plan,
              amount_fcfa: payment.amount_fcfa,
              expires_at: expires,
              payment_id: payment.id,
              active: true,
            });
            // Met à jour le type de compte du profil
            await supabaseAdmin.from("profiles")
              .update({ account_type: plan.tier, account_expires_at: expires })
              .eq("id", payment.user_id);
          }
        } else if (payment.kind === "boost" && payment.related_listing_id && payment.boost_days) {
          const expires = new Date(Date.now() + payment.boost_days * 86400 * 1000).toISOString();
          await supabaseAdmin.from("boosts").insert({
            user_id: payment.user_id,
            listing_id: payment.related_listing_id,
            days: payment.boost_days,
            amount_fcfa: payment.amount_fcfa,
            expires_at: expires,
            payment_id: payment.id,
          });
          await supabaseAdmin.from("listings")
            .update({ boosted_until: expires })
            .eq("id", payment.related_listing_id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
