import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { CountrySelector } from "@/components/CountrySelector";
import { ListingCard, BoostedCard } from "@/components/ListingCard";
import { CATEGORIES, LISTINGS, type CountryCode } from "@/data/catalog";
import { fetchListings, type DbListing } from "@/lib/listings-client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Afrique-business — Petites annonces en Afrique francophone" },
      { name: "description", content: "Achetez et vendez en FCFA partout en Afrique francophone : voitures, immobilier, électronique, mode, services. 11 pays couverts." },
      { property: "og:title", content: "Afrique-business — Petites annonces" },
      { property: "og:description", content: "La marketplace n°1 d'Afrique francophone. Vendez vite, achetez en confiance." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [country, setCountry] = useState<CountryCode>("CI");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [dbListings, setDbListings] = useState<DbListing[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchListings(country).then((d) => { if (!cancelled) setDbListings(d); });
    return () => { cancelled = true; };
  }, [country]);

  const source: DbListing[] = useMemo(() => {
    if (dbListings && dbListings.length > 0) return dbListings;
    // Fallback démo si la DB est vide pour ce pays
    return LISTINGS.filter((l) => l.country === country) as unknown as DbListing[];
  }, [dbListings, country]);

  const filtered = useMemo(
    () => source.filter((l) =>
      (activeCat === "all" || l.category === activeCat) &&
      (query === "" || l.title.toLowerCase().includes(query.toLowerCase())),
    ),
    [source, activeCat, query],
  );

  const boosted = filtered.filter((l) => l.boosted);
  const recent = filtered.filter((l) => !l.boosted);

  return (
    <MobileShell>
      <header className="sticky top-0 z-40 bg-background/90 px-6 pb-4 pt-7 backdrop-blur-md">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-2xl uppercase tracking-[0.06em] text-brand-green"
          >
            Afrique<span className="text-brand-gold">.</span>Business
          </Link>
          <CountrySelector value={country} onChange={setCountry} />
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher une villa, une voiture…"
            className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm font-medium shadow-sm outline-none placeholder:text-muted-foreground/70 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
          />
        </div>

        <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          <CategoryChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>Tous</CategoryChip>
          {CATEGORIES.map((cat) => (
            <CategoryChip key={cat.slug} active={activeCat === cat.slug} onClick={() => setActiveCat(cat.slug)}>
              <span className="mr-1">{cat.emoji}</span>{cat.name}
            </CategoryChip>
          ))}
        </div>
      </header>

      {boosted.length > 0 && (
        <section className="animate-fade-up mt-8 px-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-gold">
                Sélection Premium
              </p>
              <h2 className="font-display text-3xl italic leading-none text-brand-green">
                Annonces Boostées
              </h2>
            </div>
            <Link
              to="/explorer"
              className="border-b border-brand-green/30 pb-0.5 text-xs font-semibold text-brand-green"
            >
              Voir tout
            </Link>
          </div>
          <div className="hide-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6">
            {boosted.map((l) => <BoostedCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      <section className="mt-10 px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-green p-8 text-primary-foreground shadow-luxury">
          <div className="absolute -right-16 -top-16 size-40 rounded-full bg-white/5 blur-3xl" />
          <Sparkles className="absolute right-6 top-6 size-5 text-brand-gold/60" />
          <div className="relative z-10">
            <h3 className="mb-2 text-2xl font-bold leading-tight">Vendez 10× plus vite</h3>
            <p className="mb-6 max-w-[230px] text-sm leading-relaxed text-primary-foreground/80">
              Passez au compte Pro ou Business et profitez d'une visibilité prioritaire immédiate.
            </p>
            <Link
              to="/abonnements"
              className="inline-block rounded-xl bg-brand-gold px-6 py-3 text-sm font-bold text-foreground shadow-xl shadow-black/20 transition active:scale-95"
            >
              Devenir Pro
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-10 mt-12 px-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Annonces Récentes
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        {recent.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {recent.map((l) => <ListingCard key={l.id} listing={l} />)}
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

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-semibold transition ${
        active
          ? "bg-brand-green text-primary-foreground shadow-lg shadow-brand-green/20"
          : "border border-border bg-card text-muted-foreground hover:border-brand-green/30 hover:text-brand-green"
      }`}
    >
      {children}
    </button>
  );
}
