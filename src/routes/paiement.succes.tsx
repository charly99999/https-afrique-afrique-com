import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/paiement/succes")({
  head: () => ({ meta: [{ title: "Paiement reçu — Afrique-business" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const [status, setStatus] = useState<"pending" | "completed" | "failed">("pending");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;
    let tries = 0;
    const i = setInterval(async () => {
      tries++;
      const { data } = await supabase.from("payments").select("status").eq("id", id).maybeSingle();
      if (data?.status === "completed") { setStatus("completed"); clearInterval(i); }
      else if (data?.status === "failed" || data?.status === "cancelled") { setStatus("failed"); clearInterval(i); }
      else if (tries > 20) clearInterval(i);
    }, 1500);
    return () => clearInterval(i);
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
