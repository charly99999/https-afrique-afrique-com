import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/paiement/succes")({
  head: () => ({ meta: [{ title: "Paiement reçu — Afrique-business" }] }),
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ confirmPaydunyaInvoice }, { finalizePaydunyaPayment }] = await Promise.all([
          import("@/lib/paydunya.server"),
          import("@/lib/paydunya-activation.server"),
        ]);
        const body = await request.json().catch(() => null) as { paymentId?: string } | null;
        const paymentId = body?.paymentId;
        if (!paymentId) return Response.json({ ok: false, error: "paymentId manquant" }, { status: 400 });

        // Require authenticated caller and verify ownership
        const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
        if (!authHeader?.toLowerCase().startsWith("bearer ")) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice(7).trim();
        const { createClient } = await import("@supabase/supabase-js");
        const supaUser = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } },
        );
        const { data: userData, error: userErr } = await supaUser.auth.getUser(token);
        if (userErr || !userData?.user) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }
        const callerId = userData.user.id;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id, status, provider_token, user_id")
          .eq("id", paymentId)
          .maybeSingle();

        if (!payment) return Response.json({ ok: false, error: "Paiement introuvable" }, { status: 404 });
        if (payment.user_id !== callerId) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

        if (!payment) return Response.json({ ok: false, error: "Paiement introuvable" }, { status: 404 });
        if (payment.status === "completed") return Response.json({ ok: true, status: "completed" });
        if (!payment.provider_token) return Response.json({ ok: true, status: payment.status });

        const confirmation = await confirmPaydunyaInvoice(payment.provider_token);
        if (!confirmation.ok || !confirmation.status) {
          return Response.json({ ok: true, status: payment.status });
        }

        const result = await finalizePaydunyaPayment({
          paymentId,
          providerToken: payment.provider_token,
          status: confirmation.status,
          raw: (confirmation.raw as Record<string, unknown> | null) ?? {},
        });

        return Response.json({ ok: true, status: result.status });
      },
    },
  },
  component: SuccessPage,
});

function SuccessPage() {
  const [status, setStatus] = useState<"pending" | "completed" | "failed">("pending");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) { setStatus("failed"); return; }
      let tries = 0;
      intervalId = setInterval(async () => {
        if (cancelled) return;
        tries++;
        const { data } = await supabase
          .from("payments")
          .select("status")
          .eq("id", id)
          .eq("user_id", uid)
          .maybeSingle();
        let nextStatus = data?.status ?? "pending";
        if (nextStatus === "pending" && tries >= 2) {
          const response = await fetch("/paiement/succes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: id }),
          });
          const payload = await response.json().catch(() => null) as { status?: "pending" | "completed" | "failed" | "cancelled" } | null;
          nextStatus = payload?.status ?? nextStatus;
        }

        if (nextStatus === "completed") { setStatus("completed"); clearInterval(intervalId); }
        else if (nextStatus === "failed" || nextStatus === "cancelled") { setStatus("failed"); clearInterval(intervalId); }
        else if (tries > 20) clearInterval(intervalId);
      }, 1500);
    })();
    return () => { cancelled = true; if (intervalId) clearInterval(intervalId); };
  }, []);

  return (
    <MobileShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        {status === "pending" && (
          <>
            <Loader2 className="size-12 animate-spin text-brand-green" />
            <h1 className="mt-6 font-display text-2xl italic">Confirmation en cours…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Nous vérifions votre paiement payDunya.</p>
          </>
        )}
        {status === "completed" && (
          <>
            <CheckCircle2 className="size-16 text-brand-green" />
            <h1 className="mt-6 font-display text-3xl italic">Paiement reçu !</h1>
            <p className="mt-2 text-sm text-muted-foreground">Votre commande est activée. Merci !</p>
            <Link to="/profil" className="mt-6 rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">
              Aller à mon profil
            </Link>
          </>
        )}
        {status === "failed" && (
          <>
            <h1 className="font-display text-2xl italic">Paiement non confirmé</h1>
            <p className="mt-2 text-sm text-muted-foreground">Si le débit a eu lieu, il sera automatiquement enregistré sous 5 minutes.</p>
            <Link to="/" className="mt-6 rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-primary-foreground">
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </MobileShell>
  );
}
