// Webhook IPN payDunya — appelé après chaque paiement.
// Vérifie le hash SHA512 de la clé master puis confirme la transaction.
// Journalise chaque appel dans paydunya_ipn_logs pour diagnostic.
import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { finalizePaydunyaPayment } from "@/lib/paydunya-activation.server";

async function logIpn(entry: {
  http_status: number;
  signature_valid: boolean;
  paydunya_status?: string | null;
  invoice_token?: string | null;
  payment_id?: string | null;
  error?: string | null;
  payload?: unknown;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("paydunya_ipn_logs").insert({
      http_status: entry.http_status,
      signature_valid: entry.signature_valid,
      paydunya_status: entry.paydunya_status ?? null,
      invoice_token: entry.invoice_token ?? null,
      payment_id: entry.payment_id ?? null,
      error: entry.error ?? null,
      payload: (entry.payload ?? null) as never,
    });
  } catch {
    // ne jamais faire échouer le webhook à cause du log
  }
}

export const Route = createFileRoute("/api/public/paydunya-ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const masterKey = process.env.PAYDUNYA_MASTER_KEY;
        if (!masterKey) {
          await logIpn({ http_status: 500, signature_valid: false, error: "PAYDUNYA_MASTER_KEY missing" });
          return new Response("Not configured", { status: 500 });
        }

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
          await logIpn({ http_status: 400, signature_valid: false, error: "Invalid body" });
          return new Response("Invalid body", { status: 400 });
        }

        const data = (body.data ?? body) as Record<string, unknown>;
        const receivedHash = String((data as { hash?: string }).hash ?? "");
        const expectedHash = createHash("sha512").update(masterKey).digest("hex");
        const recBuf = Buffer.from(receivedHash, "hex");
        const expBuf = Buffer.from(expectedHash, "hex");
        const sigValid =
          recBuf.length === expBuf.length && timingSafeEqual(recBuf, expBuf);

        const status = String((data as { status?: string }).status ?? "").toLowerCase();
        const invoice = (data as { invoice?: Record<string, unknown> }).invoice ?? {};
        const token = String((invoice as { token?: string }).token ?? "") || null;
        const custom = ((data as { custom_data?: Record<string, unknown> }).custom_data ?? {}) as Record<string, unknown>;
        const paymentId = String(custom.payment_id ?? "") || null;

        if (!sigValid) {
          await logIpn({
            http_status: 401, signature_valid: false,
            paydunya_status: status, invoice_token: token, payment_id: paymentId,
            error: "Invalid signature", payload: data,
          });
          return new Response("Unauthorized", { status: 401 });
        }

        if (!paymentId) {
          await logIpn({
            http_status: 400, signature_valid: true,
            paydunya_status: status, invoice_token: token,
            error: "Missing payment_id", payload: data,
          });
          return new Response("Missing payment_id", { status: 400 });
        }

        try {
          const result = await finalizePaydunyaPayment({
            paymentId,
            providerToken: token,
            status,
            raw: data,
          });
          await logIpn({
            http_status: 200, signature_valid: true,
            paydunya_status: status, invoice_token: token, payment_id: paymentId,
            error: result.status === "completed" ? null : `finalize:${result.status}`,
            payload: data,
          });
          return new Response("ok", { status: 200 });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "finalize_error";
          await logIpn({
            http_status: 200, signature_valid: true,
            paydunya_status: status, invoice_token: token, payment_id: paymentId,
            error: msg, payload: data,
          });
          // On répond 200 pour éviter que PayDunya ne rejoue indéfiniment ;
          // l'erreur est tracée pour diagnostic admin.
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
