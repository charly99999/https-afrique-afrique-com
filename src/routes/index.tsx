import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Menu, Bell, Zap } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { LISTINGS, formatFcfa, type CountryCode } from "@/data/catalog";
import { fetchListings, type DbListing } from "@/lib/listings-client";
import africaMap from "@/assets/africa-map.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Afrique Business — Trouvez tout en un seul clic" },
      { name: "description", content: "Marketplace n°1 d'Afrique francophone : immobilier, véhicules, téléphones, emploi, services. 11 pays couverts." },
      { property: "og:title", content: "Afrique Business" },
      { property: "og:description", content: "Trouvez tout en un seul clic. Partout en Afrique." },
    ],
  }),
  component: HomePage,
});

const NAVY = "#0D1B3E";

type Tile = { label: string; emoji: string; bg: string; to: string; cat?: string; free?: boolean };
const TILES: Tile[] = [
  { label: "Immobilier", emoji: "🏡", bg: "from-emerald-50 to-emerald-100", to: "/explorer", cat: "immobilier" },
  { label: "Véhicules", emoji: "🚗", bg: "from-red-50 to-orange-100", to: "/explorer", cat: "vehicules" },
  { label: "Téléphones", emoji: "📱", bg: "from-slate-100 to-slate-200", to: "/explorer", cat: "electronique" },
  { label: "Électronique", emoji: "🖥️", bg: "from-indigo-50 to-blue-100", to: "/explorer", cat: "electronique" },
  { label: "Maison", emoji: "🛋️", bg: "from-sky-50 to-sky-100", to: "/explorer", cat: "maison" },
  { label: "Mode", emoji: "🧥", bg: "from-rose-50 to-rose-100", to: "/explorer", cat: "mode" },
  { label: "Emploi", emoji: "💼", bg: "from-amber-50 to-yellow-100", to: "/explorer", cat: "services", free: true },
  { label: "Services", emoji: "🛠️", bg: "from-lime-50 to-green-100", to: "/explorer", cat: "services", free: true },
];

function HomePage() {
  const [country] = useState<CountryCode>("CI");
  const [query, setQuery] = useState("");
  const [dbListings, setDbListings] = useState<DbListing[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchListings(country).then((d) => { if (!cancelled) setDbListings(d); });
    return () => { cancelled = true; };
  }, [country]);

  const offers = useMemo(() => {
    const src = (dbListings && dbListings.length > 0)
      ? dbListings
      : (LISTINGS.filter((l) => l.country === country) as unknown as DbListing[]);
    return src.slice(0, 8);
  }, [dbListings, country]);

  return (
    <MobileShell>
      {/* HEADER NAVY */}
      <div className="relative" style={{ backgroundColor: NAVY }}>
        <header className="px-5 pb-5 pt-6">
          <div className="mb-4 flex items-center justify-between text-white">
            <button aria-label="Menu" className="grid size-9 place-items-center">
              <Menu className="size-6" />
            </button>
            <h1 className="text-lg font-extrabold tracking-tight">Afrique Business</h1>
            <Link to="/messages" aria-label="Notifications" className="relative grid size-9 place-items-center">
              <Bell className="size-6" />
              <span className="absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2" style={{ ['--tw-ring-color' as string]: NAVY }}>12</span>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une annonce..."
              className="w-full rounded-full bg-white py-3 pl-11 pr-12 text-sm text-slate-800 shadow-md outline-none placeholder:text-slate-400"
            />
            <button aria-label="Rechercher" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-500">
              <Search className="size-4" />
            </button>
          </div>
        </header>

        {/* HERO BANNER */}
        <section className="px-5 pb-6">
          <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #1a2d5c 60%, #0D1B3E 100%)" }}>
            <div className="relative z-10 max-w-[58%]">
              <h2 className="text-3xl font-extrabold leading-none text-white">Trouvez tout</h2>
              <p className="mt-1 text-base font-medium text-white/90">en un seul clic</p>
              <Link
                to="/explorer"
                className="mt-4 inline-block rounded-full bg-[#FFD700] px-4 py-2 text-xs font-extrabold text-[#0D1B3E] shadow-md active:scale-95"
              >
                Partout en Afrique
              </Link>
            </div>
            <img
              src={africaMap}
              alt="Carte de l'Afrique"
              className="pointer-events-none absolute -right-4 -top-2 h-[160%] w-auto opacity-95"
            />
          </div>
        </section>
      </div>

      {/* CATEGORIES GRID */}
      <section className="bg-white px-4 pt-5">
        <div className="grid grid-cols-4 gap-3">
          {TILES.map((t) => (
            <Link
              key={t.label + t.emoji}
              to={t.to}
              className="group flex flex-col items-center"
            >
              <div className={`relative grid aspect-square w-full place-items-center rounded-2xl bg-gradient-to-br ${t.bg} shadow-sm ring-1 ring-black/5 transition active:scale-95`}>
                <span className="text-4xl">{t.emoji}</span>
                {t.free && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-[#00A651] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-white shadow">
                    Gratuit
                  </span>
                )}
              </div>
              <span className="mt-1.5 text-[11px] font-semibold text-slate-800">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* OFFRES SPÉCIALES */}
      <section className="bg-white px-4 py-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-[#FFD700]/20">
              <Zap className="size-4 fill-[#FFD700] text-[#FFD700]" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900">Offres spéciales</h3>
          </div>
          <Link to="/explorer" className="text-xs font-semibold text-sky-600">Voir tout</Link>
        </div>

        <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {offers.map((l) => (
            <Link
              key={l.id}
              to="/annonces/$id"
              params={{ id: l.id }}
              className="w-[140px] shrink-0"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/5">
                {l.cover_url || (l as unknown as { image?: string }).image ? (
                  <img
                    src={(l as unknown as { image?: string }).image ?? l.cover_url ?? ""}
                    alt={l.title}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <p className="mt-2 line-clamp-1 text-[12px] font-semibold text-slate-900">{l.title}</p>
              <p className="text-[12px] font-bold text-slate-900">
                {formatFcfa(Number((l as unknown as { price?: number; price_fcfa?: number }).price ?? (l as unknown as { price_fcfa?: number }).price_fcfa ?? 0))}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* PRO/BUSINESS CTA */}
      <section className="px-4 pb-8">
        <Link
          to="/abonnements"
          className="block rounded-2xl p-5 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #1a2d5c 100%)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">Boostez vos ventes</p>
          <h4 className="mt-1 text-lg font-extrabold">Passez Pro ou Business</h4>
          <p className="mt-1 text-xs text-white/80">Visibilité prioritaire, boutique perso, statistiques avancées.</p>
          <span className="mt-3 inline-block rounded-full bg-[#FFD700] px-4 py-1.5 text-xs font-extrabold text-[#0D1B3E]">Voir les offres</span>
        </Link>
      </section>
    </MobileShell>
  );
}
