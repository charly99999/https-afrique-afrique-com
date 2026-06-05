import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Clock } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES, COUNTRIES, formatFcfa, type CountryCode } from "@/data/catalog";
import { fetchListings, type DbListing } from "@/lib/listings-client";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchHistory } from "@/hooks/use-search-history";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Explorer toutes les annonces — Afrique-business" },
      { name: "description", content: "Parcourez des milliers d'annonces vérifiées en Afrique francophone : véhicules, immobilier, emploi, services, mode et plus. Filtres par pays, ville et catégorie." },
      { property: "og:title", content: "Explorer — Afrique-business" },
      { property: "og:description", content: "Toutes les annonces de l'Afrique francophone, filtrées par pays et catégorie." },
      { property: "og:url", content: "https://afrique-afrique.com/explorer" },
    ],
    links: [{ rel: "canonical", href: "https://afrique-afrique.com/explorer" }],
  }),

  component: Explorer,
});

const DEFAULT_COUNTRY: CountryCode = "CI";
type CountryFilter = CountryCode | "ALL";
type SortKey = "recent" | "price_asc" | "price_desc";

function Explorer() {
  const [country, setCountry] = useState<CountryFilter>(DEFAULT_COUNTRY);
  const [items, setItems] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("ab_country")) as CountryFilter | null;
    if (saved) setCountry(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchListings(country).then((data) => { if (!cancelled) { setItems(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, [country]);

  const cities = useMemo(
    () => country === "ALL" ? [] : (COUNTRIES.find((c) => c.code === country)?.cities ?? []),
    [country],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;
    const arr = items.filter((l) => {
      if (needle && !`${l.title} ${l.description}`.toLowerCase().includes(needle)) return false;
      if (city && l.city !== city) return false;
      if (category && l.category !== category) return false;
      if (l.price < min || l.price > max) return false;
      return true;
    });
    // Boostées toujours en tête, puis tri choisi
    arr.sort((a, b) => {
      if (!!b.boosted !== !!a.boosted) return b.boosted ? 1 : -1;
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return 0; // recent (déjà ordonné par le fetch)
    });
    return arr;
  }, [items, q, city, category, minPrice, maxPrice, sort]);

  const activeFilters = [city, category, minPrice, maxPrice].filter(Boolean).length;

  function reset() { setCity(""); setCategory(""); setMinPrice(""); setMaxPrice(""); }

  return (
    <MobileShell>
      <header className="px-5 pb-3 pt-8">
        <h1 className="font-display text-3xl italic">Explorer</h1>
        <p className="mt-1 text-xs text-muted-foreground">Trouvez ce qu'il vous faut, où vous le voulez.</p>
      </header>

      <div className="sticky top-0 z-30 bg-background/95 px-5 py-3 backdrop-blur">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une annonce…"
              className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-3 text-sm focus:border-brand-green focus:outline-none"
            />
          </div>
          <button onClick={() => setFiltersOpen(true)}
            className="relative grid size-12 place-items-center rounded-2xl border border-border bg-background">
            <SlidersHorizontal className="size-5" />
            {activeFilters > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-green text-[10px] font-bold text-primary-foreground">{activeFilters}</span>
            )}
          </button>
        </div>

        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
          <button onClick={() => { setCountry("ALL"); localStorage.setItem("ab_country", "ALL"); }}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              country === "ALL" ? "border-brand-green bg-brand-green text-primary-foreground" : "border-border bg-background text-muted-foreground"
            }`}>
            🌍 Tous
          </button>
          {COUNTRIES.map((c) => (
            <button key={c.code} onClick={() => { setCountry(c.code); localStorage.setItem("ab_country", c.code); }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                country === c.code ? "border-brand-green bg-brand-green text-primary-foreground" : "border-border bg-background text-muted-foreground"
              }`}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Aucune annonce ne correspond.</p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</p>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold">
                <option value="recent">Plus récentes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </>
        )}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)}>
          <div className="w-full max-w-[440px] rounded-t-3xl bg-background p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl italic">Filtres</h2>
              <button onClick={() => setFiltersOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-accent/40">
                <X className="size-5" />
              </button>
            </div>

            <Field label="Ville">
              <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                <option value="">Toutes les villes</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Catégorie">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                <option value="">Toutes catégories</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
              </select>
            </Field>

            <Field label="Prix (FCFA)">
              <div className="flex gap-2">
                <input type="number" inputMode="numeric" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                <input type="number" inputMode="numeric" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              </div>
              {(minPrice || maxPrice) && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {minPrice ? `de ${formatFcfa(Number(minPrice))}` : ""} {maxPrice ? `à ${formatFcfa(Number(maxPrice))}` : ""}
                </p>
              )}
            </Field>

            <div className="mt-6 flex gap-2">
              <button onClick={reset} className="flex-1 rounded-xl border border-border py-3 text-sm font-bold">Réinitialiser</button>
              <button onClick={() => setFiltersOpen(false)} className="flex-1 rounded-xl bg-brand-green py-3 text-sm font-bold text-primary-foreground">Voir {filtered.length} résultats</button>
            </div>
          </div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-6 px-5">
          <Link to="/publier" className="block rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Soyez le premier à publier dans ce pays →
          </Link>
        </div>
      )}
    </MobileShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

// Compat: l'ancien export utilisé par d'autres routes.
export function StubPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <MobileShell>
      <div className="px-6 pb-10 pt-10 text-center">
        <h1 className="font-display text-3xl italic">{title}</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">{subtitle}</p>
        <Link to="/" className="mt-8 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">
          ← Retour à l'accueil
        </Link>
      </div>
    </MobileShell>
  );
}
