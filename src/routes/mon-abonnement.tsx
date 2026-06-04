import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { formatFcfa } from "@/data/catalog";

export const Route = createFileRoute("/mon-abonnement")({
  head: () => ({ meta: [{ title: "Mon abonnement — Afrique-business" }] }),
  component: SubscriptionPage,
});

type Sub = {
  id: string;
  plan: string;
  amount_fcfa: number;
  starts_at: string;
  expires_at: string;
  active: boolean;
};

function SubscriptionPage() {
  const { user, loading } = useAuth();
  const [sub, setSub] = useState<Sub | null | undefined>(undefined);
  const [profile, setProfile] = useState<{ account_type: string | null; account_expires_at: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: subs }, { data: prof }] = await Promise.all([
        supabase.from("subscriptions").select("id, plan, amount_fcfa, starts_at, expires_at, active")
          .eq("user_id", user.id).order("expires_at", { ascending: false }).limit(1),
        supabase.from("profiles").select("account_type, account_expires_at").eq("id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setSub(((subs ?? [])[0] as Sub | undefined) ?? null);
      setProfile(prof as { account_type: string | null; account_expires_at: string | null } | null);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <MobileShell><div className="p-10 text-center text-sm text-muted-foreground">…</div></MobileShell>;
  if (!user) {
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Connexion requise</h1>
          <Link to="/auth" className="mt-6 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">Se connecter</Link>
        </div>
      </MobileShell>
    );
  }

  const tier: string = profile?.account_type ?? "gratuit";
  const expiresAt = profile?.account_expires_at;
  const isActive = expiresAt ? new Date(expiresAt) > new Date() : false;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <MobileShell>
      <header className="border-b border-border px-5 pb-5 pt-6">
        <Link to="/profil" className="text-xs font-bold uppercase tracking-widest text-brand-green">← Profil</Link>
        <h1 className="mt-3 font-display text-3xl italic">Mon abonnement</h1>
      </header>

      <div className="px-5 py-6">
        <article className={`overflow-hidden rounded-3xl border-2 p-5 ${
          tier === "business" ? "border-brand-gold bg-foreground text-primary-foreground" :
          tier === "pro" ? "border-brand-green bg-card" :
          "border-border bg-muted"
        }`}>
          <div className="flex items-center gap-3">
            <span className={`grid size-12 place-items-center rounded-xl ${
              tier === "business" ? "bg-brand-gold text-foreground" :
              tier === "pro" ? "bg-brand-green/10 text-brand-green" :
              "bg-background text-muted-foreground"
            }`}>
              {tier === "business" ? <Crown className="size-6" /> : <Sparkles className="size-6" />}
            </span>
            <div>
              <p className={`text-[10px] font-extrabold uppercase tracking-widest ${tier === "business" ? "text-brand-gold" : "text-muted-foreground"}`}>Plan actuel</p>
              <h2 className="font-display text-2xl italic capitalize">{tier}</h2>
            </div>
          </div>

          {tier === "gratuit" ? (
            <p className={`mt-4 text-sm ${tier === "business" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              Vous utilisez la formule gratuite. Passez Pro ou Business pour débloquer plus de fonctionnalités.
            </p>
          ) : (
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {isActive
                  ? <CheckCircle2 className={`size-4 ${tier === "business" ? "text-brand-gold" : "text-brand-green"}`} />
                  : <AlertCircle className="size-4 text-destructive" />}
                <span>{isActive ? "Abonnement actif" : "Abonnement expiré"}</span>
              </div>
              {expiresAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 opacity-70" />
                  <span>
                    {isActive
                      ? `Expire le ${new Date(expiresAt).toLocaleDateString("fr-FR")} (${daysLeft} j restants)`
                      : `Expiré le ${new Date(expiresAt).toLocaleDateString("fr-FR")}`}
                  </span>
                </div>
              )}
              {sub && (
                <p className={`text-xs ${tier === "business" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  Dernier paiement: {formatFcfa(Number(sub.amount_fcfa))} · {sub.plan}
                </p>
              )}
            </div>
          )}
        </article>

        <Link to="/abonnements"
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-brand-green py-3 text-sm font-bold text-primary-foreground">
          {tier === "gratuit" ? "Voir les formules" : isActive ? "Changer de formule" : "Renouveler"}
        </Link>

        {sub === null && tier === "gratuit" && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Aucun paiement enregistré pour l'instant.
          </p>
        )}
      </div>
    </MobileShell>
  );
}
