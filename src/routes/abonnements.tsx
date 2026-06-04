import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Check, Sparkles, Crown } from "lucide-react";

export const Route = createFileRoute("/abonnements")({
  head: () => ({
    meta: [
      { title: "Abonnements Pro & Business — Afrique-business" },
      { name: "description", content: "Choisissez votre formule : Pro à 5 000 FCFA/mois, Business à 10 000 FCFA/mois. Visibilité maximale, boutique avancée, boosts offerts." },
    ],
  }),
  component: PlansPage,
});

type Plan = {
  name: string;
  tagline: string;
  icon: React.ReactNode;
  highlight: boolean;
  prices: { label: string; price: string; period: string }[];
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Pro",
    tagline: "Pour les vendeurs réguliers",
    icon: <Sparkles className="size-5" />,
    highlight: false,
    prices: [
      { label: "Mensuel", price: "5 000", period: "mois" },
      { label: "Trimestriel", price: "12 000", period: "3 mois" },
      { label: "Annuel", price: "40 000", period: "an" },
    ],
    features: [
      "Publication illimitée",
      "Badge Pro visible",
      "Boutique personnalisée",
      "Statistiques de vues",
      "1 boost gratuit / mois",
    ],
  },
  {
    name: "Business",
    tagline: "Pour les professionnels",
    icon: <Crown className="size-5" />,
    highlight: true,
    prices: [
      { label: "Mensuel", price: "10 000", period: "mois" },
      { label: "Trimestriel", price: "25 000", period: "3 mois" },
      { label: "Annuel", price: "80 000", period: "an" },
    ],
    features: [
      "Tous les avantages Pro",
      "Boutique avancée + catalogue",
      "Mise en avant prioritaire",
      "Statistiques avancées",
      "Support client dédié",
      "3 boosts gratuits / mois",
    ],
  },
];

function PlansPage() {
  return (
    <MobileShell>
      <header className="border-b border-border px-5 pb-5 pt-6">
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-brand-green">
          ← Retour
        </Link>
        <h1 className="mt-3 font-display text-3xl italic leading-tight">
          Choisissez votre formule
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paiement sécurisé par payDunya. Orange Money, MTN, Wave, Visa.
        </p>
      </header>

      <div className="space-y-5 px-5 py-6">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`overflow-hidden rounded-3xl border-2 p-5 ${
              plan.highlight ? "border-brand-gold bg-foreground text-primary-foreground" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid size-10 place-items-center rounded-xl ${
                  plan.highlight ? "bg-brand-gold text-foreground" : "bg-brand-green/10 text-brand-green"
                }`}
              >
                {plan.icon}
              </span>
              <div>
                <h2 className="font-display text-2xl italic">{plan.name}</h2>
                <p className={`text-xs ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>
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
              {plan.prices.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`rounded-xl px-2 py-3 text-center transition ${
                    plan.highlight
                      ? "bg-primary-foreground/10 hover:bg-brand-gold hover:text-foreground"
                      : "bg-muted hover:bg-brand-green hover:text-primary-foreground"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase opacity-70">{p.label}</p>
                  <p className="mt-1 font-mono text-base font-bold">{p.price}</p>
                  <p className="text-[10px] opacity-70">FCFA / {p.period}</p>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </MobileShell>
  );
}
