import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { getListing } from "@/data/catalog";
import { Rocket, Check } from "lucide-react";

export const Route = createFileRoute("/boost/$id")({
  loader: ({ params }) => {
    const listing = getListing(params.id);
    if (!listing) throw notFound();
    return { listing };
  },
  head: () => ({ meta: [{ title: "Booster mon annonce — Afrique-business" }] }),
  notFoundComponent: () => (
    <MobileShell>
      <div className="px-6 py-20 text-center">
        <h1 className="font-display text-2xl italic">Annonce introuvable</h1>
      </div>
    </MobileShell>
  ),
  errorComponent: ({ error, reset }) => (
    <MobileShell>
      <div className="px-6 py-20 text-center">
        <h1 className="font-display text-2xl italic">Erreur</h1>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded-xl bg-brand-green px-5 py-2 text-sm font-bold text-primary-foreground">Réessayer</button>
      </div>
    </MobileShell>
  ),
  component: BoostPage,
});

const PACKS = [
  { days: 1, price: 500 },
  { days: 3, price: 1_200 },
  { days: 7, price: 2_500 },
  { days: 30, price: 8_000 },
];

function BoostPage() {
  const { listing } = Route.useLoaderData();
  return (
    <MobileShell>
      <header className="border-b border-border px-5 pb-5 pt-6">
        <Link to="/annonces/$id" params={{ id: listing.id }} className="text-xs font-bold uppercase tracking-widest text-brand-green">
          ← Retour à l'annonce
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <Rocket className="size-6 text-brand-gold" />
          <h1 className="font-display text-2xl italic">Booster cette annonce</h1>
        </div>
      </header>

      <section className="px-5 py-6">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <img src={listing.image} alt="" className="size-14 rounded-xl object-cover" />
          <div className="flex-1">
            <p className="line-clamp-1 text-sm font-bold">{listing.title}</p>
            <p className="text-xs text-muted-foreground">{listing.city}</p>
          </div>
        </div>

        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Choisissez votre formule boost
        </h2>

        <div className="space-y-3">
          {PACKS.map((p) => (
            <button
              key={p.days}
              type="button"
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 text-left transition hover:border-brand-green"
            >
              <div className="grid size-12 place-items-center rounded-xl bg-brand-gold/10 font-mono text-lg font-bold text-brand-gold">
                {p.days}j
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {p.days} {p.days > 1 ? "jours" : "jour"} en tête de liste
                </p>
                <p className="text-xs text-muted-foreground">Badge Boosté, priorité dans les recherches</p>
              </div>
              <p className="font-mono text-base font-bold">
                {new Intl.NumberFormat("fr-FR").format(p.price).replaceAll(",", ".")}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">FCFA</span>
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-accent/30 p-4 text-xs text-muted-foreground">
          <p className="mb-2 font-bold text-foreground">Inclus dans chaque boost</p>
          <ul className="space-y-1">
            <li className="flex gap-2"><Check className="size-3.5 text-brand-green" /> Remontée en tête de liste</li>
            <li className="flex gap-2"><Check className="size-3.5 text-brand-green" /> Badge "Boosté" visible</li>
            <li className="flex gap-2"><Check className="size-3.5 text-brand-green" /> Fin automatique à expiration</li>
          </ul>
        </div>
      </section>
    </MobileShell>
  );
}
