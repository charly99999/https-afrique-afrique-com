import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { CountrySelector } from "@/components/CountrySelector";
import { ListingCard, BoostedCard } from "@/components/ListingCard";
import { CATEGORIES, LISTINGS, type CountryCode } from "@/data/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Afrique-business — Petites annonces en Afrique francophone" },
      {
        name: "description",
        content:
          "Achetez et vendez en FCFA partout en Afrique francophone : voitures, immobilier, électronique, mode, services. 11 pays couverts.",
      },
      { property: "og:title", content: "Afrique-business — Petites annonces" },
      {
        property: "og:description",
        content: "La marketplace n°1 d'Afrique francophone. Vendez vite, achetez en confiance.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [country, setCountry] = useState<CountryCode>("CI");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      LISTINGS.filter(
        (l) =>
          l.country === country &&
          (activeCat === "all" || l.category === activeCat) &&
          (query === "" || l.title.toLowerCase().includes(query.toLowerCase())),
      ),
    [country, activeCat, query],
  );

  const boosted = filtered.filter((l) => l.boosted);
  const recent = filtered.filter((l) => !l.boosted);

  return (
    <MobileShell>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-5 pb-3 pt-4 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold uppercase tracking-tighter text-brand-green">
            Afrique-business
          </Link>
          <CountrySelector value={country} onChange={setCountry} />
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher une voiture, une villa..."
            className="w-full rounded-xl border-none bg-muted py-3.5 pl-11 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-green/30"
          />
        </div>

        <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <CategoryChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
            Tous
          </CategoryChip>
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.slug}
              active={activeCat === cat.slug}
              onClick={() => setActiveCat(cat.slug)}
            >
              <span className="mr-1">{cat.emoji}</span>
              {cat.name}
            </CategoryChip>
          ))}
        </div>
      </header>

      {/* Boosted */}
      {boosted.length > 0 && (
        <section className="animate-fade-up mt-8 px-5">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-gold">
                Sélection Premium
              </span>
              <h2 className="-mt-1 font-display text-3xl italic">Annonces Boostées</h2>
            </div>
            <Link
              to="/explorer"
              className="border-b-2 border-brand-green/20 pb-1 text-xs font-bold text-brand-green"
            >
              Voir tout
            </Link>
          </div>
          <div className="hide-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5">
            {boosted.map((l) => (
              <BoostedCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {/* Promo Pro */}
      <section className="mt-10 px-5">
        <div className="relative overflow-hidden rounded-3xl bg-brand-green p-6">
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-brand-gold/20 blur-2xl" />
          <Sparkles className="absolute right-5 top-5 size-5 text-brand-gold" />
          <div className="relative z-10">
            <h3 className="mb-2 text-2xl font-extrabold leading-tight text-primary-foreground">
              Vendez 10× plus vite
            </h3>
            <p className="mb-4 max-w-[230px] text-sm text-primary-foreground/80">
              Passez au compte Pro ou Business et profitez de la visibilité prioritaire.
            </p>
            <Link
              to="/abonnements"
              className="inline-block rounded-xl bg-brand-gold px-6 py-3 text-xs font-bold text-foreground transition active:scale-95"
            >
              Devenir Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Recent */}
      <section className="mb-10 mt-10 px-5">
        <h2 className="mb-6 flex items-center gap-3 text-lg font-extrabold uppercase tracking-tight">
          <span className="h-[2px] w-8 bg-brand-green" />
          Annonces Récentes
        </h2>

        {recent.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {recent.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">
            Aucune annonce pour cette sélection.
          </p>
        )}
      </section>
    </MobileShell>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-xs font-bold transition ${
        active
          ? "bg-brand-green text-primary-foreground ring-2 ring-brand-green ring-offset-2 ring-offset-background"
          : "bg-muted text-muted-foreground hover:bg-accent/40"
      }`}
    >
      {children}
    </button>
  );
}
