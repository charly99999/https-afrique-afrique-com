// Webhook IPN payDunya — appelé après chaque paiement.
// Vérifie le hash SHA512 de la clé master puis confirme la transaction.
import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { finalizePaydunyaPayment } from "@/lib/paydunya-activation.server";

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

        const result = await finalizePaydunyaPayment({
          paymentId,
          providerToken: token || null,
          status,
          raw: data,
        });

        if (result.status !== "completed") {
          return new Response("ok", { status: 200 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
