import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Bell } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { ListingCard } from "@/components/ListingCard";
import { ShareAppButton } from "@/components/ShareAppButton";
import { PromoBanner } from "@/components/PromoBanner";
import { LISTINGS, type CountryCode } from "@/data/catalog";
import { fetchListings, type DbListing } from "@/lib/listings-client";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import africaMap from "@/assets/africa-map-green.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Afrique-Business — Trouvez tout en un seul clic" },
      { name: "description", content: "Marketplace n°1 d'Afrique francophone : immobilier, véhicules, téléphones, emploi, services. 11 pays couverts." },
      { property: "og:title", content: "Afrique-Business — Afrique-business" },
      { property: "og:description", content: "Trouvez tout en un seul clic. Partout en Afrique." },
    ],
  }),
  component: HomePage,
});

const DARK_GREEN = "#0B3D2E";
const GOLD = "#D4AF37";

type Tile = { label: string; emoji: string; cat: string; free?: boolean };
const TILES: Tile[] = [
  { label: "Véhicules", emoji: "🚗", cat: "vehicules" },
  { label: "Immobilier", emoji: "🏠", cat: "immobilier" },
  { label: "Électronique", emoji: "📱", cat: "electronique" },
  { label: "Électroménager", emoji: "🧊", cat: "electromenager" },
  { label: "Mode & Beauté", emoji: "👗", cat: "mode" },
  { label: "Pour l'Enfant", emoji: "🧸", cat: "enfant" },
  { label: "Emploi & Services", emoji: "💼", cat: "services", free: true },
  { label: "Maison & Loisirs", emoji: "🛋️", cat: "maison" },
  { label: "Agricole", emoji: "🚜", cat: "pro-agricole" },
  { label: "Alimentation", emoji: "🍎", cat: "alimentation" },
  { label: "Animaux", emoji: "🐕", cat: "animaux" },
  { label: "Autres", emoji: "📦", cat: "autres" },
];

function HomePage() {
  const { user } = useAuth();
  const [country] = useState<CountryCode>("CI");
  const [query, setQuery] = useState("");
  const [dbListings, setDbListings] = useState<DbListing[] | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchListings(country).then((d) => { if (!cancelled) setDbListings(d); });
    return () => { cancelled = true; };
  }, [country]);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null);
      if (!cancelled) setUnread(count ?? 0);
    };
    load();
    const channel = supabase
      .channel(`unread-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  const feed = useMemo(() => {
    const src = (dbListings && dbListings.length > 0)
      ? dbListings
      : (LISTINGS.filter((l) => l.country === country) as unknown as DbListing[]);
    return src;
  }, [dbListings, country]);

  return (
    <MobileShell>
      {/* HEADER VERT FONCÉ */}
      <div className="relative" style={{ backgroundColor: DARK_GREEN }}>
        <header className="px-5 pb-5 pt-6">
          <div className="mb-4 flex items-center justify-between gap-2 text-white">
            <ShareAppButton />
            <div className="flex flex-1 items-center justify-center gap-2 px-2">
              <span className="grid size-9 place-items-center rounded-full" style={{ backgroundColor: "rgba(212,175,55,0.15)" }}>
                <span className="text-base">🌍</span>
              </span>
              <div className="leading-tight">
                <h1 className="text-lg font-extrabold tracking-tight" style={{ color: GOLD }}>Afrique-Business</h1>
                <p className="text-[10px] font-medium text-white/70">Afrique-business / Ivoire-business</p>
              </div>
            </div>
            <Link to="/messages" aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full bg-white/10">
              <Bell className="size-5 text-white" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2" style={{ ['--tw-ring-color' as string]: DARK_GREEN }}>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une villa, une voiture..."
              className="w-full rounded-full bg-white py-3 pl-11 pr-12 text-sm text-slate-800 shadow-md outline-none placeholder:text-slate-400"
            />
            <Link to="/explorer" search={{ q: query } as never} aria-label="Rechercher" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full" style={{ backgroundColor: GOLD }}>
              <Search className="size-4 text-white" />
            </Link>
          </div>
        </header>

        {/* HERO BANNER */}
        <section className="px-5 pb-6">
          <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #155e44 60%, #0B3D2E 100%)", boxShadow: "0 8px 28px -10px rgba(0,0,0,0.5)" }}>
            <div className="relative z-10 max-w-[58%]">
              <h2 className="text-3xl font-extrabold leading-none text-white">Trouvez tout</h2>
              <p className="mt-1 text-base font-medium text-white/90">en un seul clic</p>
              <Link
                to="/explorer"
                className="mt-4 inline-block rounded-full px-4 py-2 text-xs font-extrabold text-[#0B3D2E] shadow-md active:scale-95"
                style={{ backgroundColor: GOLD }}
              >
                Partout en Afrique
              </Link>
            </div>
            <img
              src={africaMap}
              alt="Carte de l'Afrique"
              width={768}
              height={768}
              className="pointer-events-none absolute -right-6 top-1/2 h-[170%] w-auto -translate-y-1/2 opacity-95"
            />
          </div>
        </section>
      </div>

      {/* PROMO BANNER */}
      <PromoBanner />

      {/* CATEGORIES GRID */}
      <section className="bg-white px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Catégories</h3>
          <Link to="/explorer" className="text-xs font-semibold" style={{ color: DARK_GREEN }}>Voir tout</Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {TILES.map((t) => (
            <Link
              key={t.cat + t.label}
              to="/explorer"
              search={{ category: t.cat } as never}
              className="group flex flex-col items-center"
            >
              <div
                className={`relative grid aspect-square w-full place-items-center rounded-2xl shadow-sm ring-1 transition active:scale-95 ${t.free ? "ring-2" : "ring-black/5"}`}
                style={t.free ? { backgroundColor: "#F0FDF4", borderColor: DARK_GREEN, ['--tw-ring-color' as string]: DARK_GREEN } : { backgroundColor: "#F8FAFC" }}
              >
                <span className="text-3xl">{t.emoji}</span>
                {t.free && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-tight text-white shadow whitespace-nowrap" style={{ backgroundColor: DARK_GREEN }}>
                    100% GRATUIT
                  </span>
                )}
              </div>
              <span className="mt-1.5 text-center text-[10px] font-semibold leading-tight text-slate-800">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ANNONCES — GRILLE MASONRY VERTICALE */}
      <section className="bg-white px-4 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Annonces récentes</h3>
          <Link to="/explorer" className="text-xs font-semibold" style={{ color: DARK_GREEN }}>Voir tout</Link>
        </div>

        {feed.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Aucune annonce pour l'instant.</p>
        ) : (
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4 xl:columns-5">
            {feed.map((l) => (
              <ListingCard key={l.id} listing={l} masonry />
            ))}
          </div>
        )}
      </section>

      {/* PRO/BUSINESS CTA */}
      <section className="px-4 pb-8">
        <Link
          to="/abonnements"
          className="block rounded-2xl p-5 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #155e44 100%)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Boostez vos ventes</p>
          <h4 className="mt-1 text-lg font-extrabold">Passez Pro ou Business</h4>
          <p className="mt-1 text-xs text-white/80">Visibilité prioritaire, boutique perso, statistiques avancées.</p>
          <span className="mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-extrabold text-[#0B3D2E]" style={{ backgroundColor: GOLD }}>Voir les offres</span>
        </Link>
      </section>
    </MobileShell>
  );
}
