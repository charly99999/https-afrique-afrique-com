import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell } from "@/components/MobileShell";
import { Check, Sparkles, Crown, Loader2 } from "lucide-react";
import { SUB_PRICES, PROMO_PRICES, PROMO_ACTIVE, type SubPlan } from "@/data/pricing";
import { startSubscriptionPayment } from "@/lib/paydunya.functions";
import { redirectToCheckout } from "@/lib/redirect-checkout";
import { useAuth } from "@/hooks/use-auth";
import { MobileMoneyBadges } from "@/components/MobileMoneyBadges";
import { getStoredCountry } from "@/lib/currency";

export const Route = createFileRoute("/abonnements")({
  head: () => ({
    meta: [
      { title: "Abonnements Pro & Business — Afrique-business" },
      { name: "description", content: "Promo : Pro à 2 500 FCFA/mois, Business à 5 000 FCFA/mois pendant 2 mois. Paiement payDunya." },
    ],
  }),
  component: PlansPage,
});

type Plan = {
  name: string;
  tagline: string;
  icon: React.ReactNode;
  highlight: boolean;
  prices: { plan: SubPlan; label: string; period: string }[];
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Pro", tagline: "Pour les vendeurs réguliers", icon: <Sparkles className="size-5" />, highlight: false,
    prices: [
      { plan: "pro_monthly", label: "Mensuel", period: "mois" },
      { plan: "pro_quarterly", label: "Trimestriel", period: "3 mois" },
      { plan: "pro_yearly", label: "Annuel", period: "an" },
    ],
    features: [
      "Publication illimitée",
      "Badge Pro visible",
      "Boutique personnalisée",
      "Statistiques de vues",
      "1 boost permanent pendant toute la durée de l'abonnement",
    ],
  },
  {
    name: "Business", tagline: "Pour les professionnels", icon: <Crown className="size-5" />, highlight: true,
    prices: [
      { plan: "business_monthly", label: "Mensuel", period: "mois" },
      { plan: "business_quarterly", label: "Trimestriel", period: "3 mois" },
      { plan: "business_yearly", label: "Annuel", period: "an" },
    ],
    features: [
      "Tous les avantages Pro",
      "Boutique avancée + catalogue",
      "Mise en avant prioritaire",
      "Statistiques avancées",
      "Support client dédié",
      "Boosts permanents illimités pendant toute la durée de l'abonnement",
    ],
  },
];

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n).replaceAll(",", ".");
}

function PlansPage() {
  const { user } = useAuth();
  const startPayment = useServerFn(startSubscriptionPayment);
  const [loadingPlan, setLoadingPlan] = useState<SubPlan | null>(null);

  async function handleSubscribe(plan: SubPlan) {
    if (!user) {
      toast.error("Connectez-vous d'abord");
      return;
    }
    setLoadingPlan(plan);
    try {
      const res = await startPayment({ data: { plan, origin: window.location.origin } });
      console.log("[paydunya] startSubscriptionPayment:", res);
      if (!res?.ok || !res.invoiceUrl) throw new Error(res?.error ?? "Erreur paiement");
      redirectToCheckout(res.invoiceUrl);
    } catch (err) {
      console.error("[paydunya] erreur:", err);
      toast.error(err instanceof Error ? err.message : "Erreur paiement");
      setLoadingPlan(null);
    }
  }

  return (
    <MobileShell>
      <header className="border-b border-border px-5 pb-5 pt-6">
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-brand-green">← Retour</Link>
        <h1 className="mt-3 font-display text-3xl italic leading-tight">Choisissez votre formule</h1>
        <p className="mt-2 text-sm text-muted-foreground">Paiement sécurisé par payDunya. Orange Money, MTN, Wave, Moov, Djamo, Visa.</p>
        {PROMO_ACTIVE && (
          <div className="mt-3 rounded-xl border-2 border-red-500 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">
            🔥 OFFRE PROMO — 50% de réduction sur les abonnements mensuels pendant 2 mois.
          </div>
        )}
      </header>

      <div className="space-y-5 px-5 py-6">
        {PLANS.map((plan) => (
          <article key={plan.name}
            className={`relative overflow-hidden rounded-3xl border-2 p-5 ${plan.highlight ? "border-brand-gold bg-foreground text-primary-foreground" : "border-border bg-card"}`}>
            <div className="flex items-center gap-3">
              <span className={`grid size-10 place-items-center rounded-xl ${plan.highlight ? "bg-brand-gold text-foreground" : "bg-brand-green/10 text-brand-green"}`}>
                {plan.icon}
              </span>
              <div>
                <h2 className="font-display text-2xl italic">{plan.name}</h2>
                <p className={`text-xs ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.tagline}</p>
              </div>
            </div>

            <ul className="mt-5 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className={`mt-0.5 size-4 shrink-0 ${plan.highlight ? "text-brand-gold" : "text-brand-green"}`} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {plan.prices.map((p) => {
                const isLoading = loadingPlan === p.plan;
                const promo = PROMO_ACTIVE ? PROMO_PRICES[p.plan] : undefined;
                const fullAmount = SUB_PRICES[p.plan].amount;
                const amount = promo?.amount ?? fullAmount;
                return (
                  <button key={p.plan} type="button" disabled={loadingPlan !== null}
                    onClick={() => handleSubscribe(p.plan)}
                    className={`relative rounded-xl px-2 py-3 text-center transition disabled:opacity-60 ${
                      plan.highlight ? "bg-primary-foreground/10 hover:bg-brand-gold hover:text-foreground"
                                     : "bg-muted hover:bg-brand-green hover:text-primary-foreground"
                    }`}>
                    {promo && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white shadow">
                        PROMO
                      </span>
                    )}
                    <p className="text-[10px] font-bold uppercase opacity-70">{p.label}</p>
                    {isLoading ? (
                      <Loader2 className="mx-auto mt-1 size-4 animate-spin" />
                    ) : (
                      <>
                        {promo && (
                          <p className="mt-1 text-[10px] line-through opacity-60">{fmt(fullAmount)}</p>
                        )}
                        <p className={`font-mono text-base font-bold ${promo ? "text-red-500" : ""}`}>{fmt(amount)}</p>
                      </>
                    )}
                    <p className="text-[10px] opacity-70">FCFA / {p.period}</p>
                    {promo && (
                      <p className="mt-1 text-[8px] font-bold uppercase opacity-70">2 mois</p>
                    )}
                  </button>
                );
              })}
            </div>
          </article>
        ))}

        <MobileMoneyBadges countryCode={getStoredCountry()} className="mt-2" />
      </div>
    </MobileShell>
  );
}
