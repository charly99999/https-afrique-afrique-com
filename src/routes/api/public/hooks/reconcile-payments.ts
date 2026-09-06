import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron : réconciliation des paiements PayDunya restés « pending ».
 *
 * Filet de sécurité si l'IPN n'arrive pas (réseau, indisponibilité, retard) :
 * pour chaque paiement en attente de plus de 15 minutes possédant un jeton
 * PayDunya, on interroge l'API officielle et on finalise UNIQUEMENT si
 * PayDunya confirme le paiement. L'activation reste idempotente
 * (finalizePaydunyaPayment ignore les paiements déjà « completed »).
 *
 * Les paiements en attente depuis plus de 48 h sans jeton sont annulés.
 *
 * Auth : en-tête `Authorization: Bearer <CRON_SECRET>` ou `x-cron-secret`.
 */
export const Route = createFileRoute("/api/public/hooks/reconcile-payments")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const allowed = [process.env.CRON_SECRET, process.env.CRON_SECRET_INTERNAL].filter(Boolean);
        const auth = request.headers.get("authorization") ?? "";
        const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
        const got = bearer || request.headers.get("x-cron-secret") || "";
        if (!got || !allowed.includes(got)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { confirmPaydunyaInvoice } = await import("@/lib/paydunya.server");
        const { finalizePaydunyaPayment } = await import("@/lib/paydunya-activation.server");

        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

        const { data: pending, error } = await supabaseAdmin
          .from("payments")
          .select("id, provider_token, created_at")
          .eq("status", "pending")
          .lte("created_at", fifteenMinAgo)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        let checked = 0;
        let activated = 0;
        let cancelled = 0;

        for (const p of pending ?? []) {
          if (!p.provider_token) {
            if (p.created_at <= twoDaysAgo) {
              await supabaseAdmin
                .from("payments")
                .update({ status: "cancelled" })
                .eq("id", p.id)
                .eq("status", "pending");
              cancelled += 1;
            }
            continue;
          }

          checked += 1;
          const res = await confirmPaydunyaInvoice(p.provider_token);
          const status = String(res.status ?? "").toLowerCase();

          if (!res.ok || !status) {
            if (p.created_at <= twoDaysAgo) {
              await supabaseAdmin
                .from("payments")
                .update({ status: "cancelled" })
                .eq("id", p.id)
                .eq("status", "pending");
              cancelled += 1;
            }
            continue;
          }

          const outcome = await finalizePaydunyaPayment({
            paymentId: p.id,
            providerToken: p.provider_token,
            status,
            raw: (res.raw ?? {}) as Record<string, unknown>,
          });

          if (outcome.activated) activated += 1;
          else if (outcome.status === "cancelled" || outcome.status === "failed") cancelled += 1;
        }

        return Response.json({ ok: true, pending: pending?.length ?? 0, checked, activated, cancelled });
      },
    },
  },
});
