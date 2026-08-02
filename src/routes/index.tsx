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

const DARK_GREEN = "#1B6E3C";
const GOLD = "#E8A02C";

type Tile = { label: string; emoji: string; cat: string; free?: boolean; grad: string; tint: string };
const TILES: Tile[] = [
  { label: "Véhicules", emoji: "🚗", cat: "vehicules", grad: "linear-gradient(140deg,#1B6E3C,#2E9B57)", tint: "#E9F6EE" },
  { label: "Immobilier", emoji: "🏠", cat: "immobilier", grad: "linear-gradient(140deg,#0F5C86,#2E9BC4)", tint: "#E8F3F9" },
  { label: "Électronique", emoji: "📱", cat: "electronique", grad: "linear-gradient(140deg,#4A2B86,#7B54C9)", tint: "#F0EBFA" },
  { label: "Électroménager", emoji: "🧊", cat: "electromenager", grad: "linear-gradient(140deg,#166A6A,#2FA8A0)", tint: "#E7F5F4" },
  { label: "Mode & Beauté", emoji: "👗", cat: "mode", grad: "linear-gradient(140deg,#A02455,#DB5A8C)", tint: "#FBEBF1" },
  { label: "Pour l'Enfant", emoji: "🧸", cat: "enfant", grad: "linear-gradient(140deg,#B4651A,#EFA044)", tint: "#FDF2E4" },
  { label: "Emploi & Services", emoji: "💼", cat: "services", free: true, grad: "linear-gradient(140deg,#1B6E3C,#E8A02C)", tint: "#FDF6E7" },
  { label: "Maison & Loisirs", emoji: "🛋️", cat: "maison", grad: "linear-gradient(140deg,#5C4630,#997352)", tint: "#F5EFE8" },
  { label: "Agricole", emoji: "🚜", cat: "pro-agricole", grad: "linear-gradient(140deg,#3F6B12,#7CA82C)", tint: "#F0F6E4" },
  { label: "Alimentation", emoji: "🍎", cat: "alimentation", grad: "linear-gradient(140deg,#9B1C25,#DD5A48)", tint: "#FBEBEA" },
  { label: "Animaux", emoji: "🐕", cat: "animaux", grad: "linear-gradient(140deg,#8A5A11,#D2952C)", tint: "#FBF2E0" },
  { label: "Autres", emoji: "📦", cat: "autres", grad: "linear-gradient(140deg,#3C4653,#6C7A8C)", tint: "#EEF1F4" },
];

const TRUST = [
  "🏠 100% Gratuit",
  "✅ Aucune commission",
  "🔒 Vendeurs vérifiés",
  "📱 Mobile Money accepté",
  "🌍 11 pays d'Afrique",
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
              <span className="grid size-9 place-items-center rounded-full" style={{ backgroundColor: "rgba(232,160,44,0.18)" }}>
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
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une villa, une voiture..."
              className="w-full rounded-full bg-white py-3 pl-11 pr-12 text-sm text-foreground shadow-md outline-none placeholder:text-muted-foreground"
            />
            <Link to="/explorer" search={{ q: query } as never} aria-label="Rechercher" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full" style={{ backgroundColor: GOLD }}>
              <Search className="size-4 text-white" />
            </Link>
          </div>
        </header>

        {/* HERO BANNER */}
        <section className="px-5 pb-6">
          <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #14532D 0%, #1B6E3C 55%, #2E9B57 100%)", boxShadow: "0 8px 28px -10px rgba(0,0,0,0.5)" }}>
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sheen bg-white/15 blur-md" />
            <div className="relative z-10 max-w-[58%]">
              <h2 className="text-3xl font-extrabold leading-none text-white">100% Gratuit</h2>
              <p className="mt-1 text-base font-medium text-white/90">Aucune commission</p>
              <Link
                to="/explorer"
                className="mt-4 inline-block rounded-full px-4 py-2 text-xs font-extrabold text-[#14532D] shadow-md active:scale-95"
                style={{ backgroundColor: GOLD }}
              >
                Voir les annonces
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

        {/* BANDEAU DE CONFIANCE DÉFILANT */}
        <div className="overflow-hidden border-y border-white/10" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex w-max animate-marquee gap-8 py-2">
            {[...TRUST, ...TRUST].map((t, i) => (
              <span key={`${t}-${i}`} className="whitespace-nowrap text-[11px] font-bold text-white/90">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* PROMO BANNER */}
      <PromoBanner />

      {/* CATEGORIES GRID */}
      <section className="bg-card px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-foreground">Catégories</h3>
          <Link to="/explorer" className="text-xs font-semibold" style={{ color: DARK_GREEN }}>Voir tout</Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {TILES.map((t, i) => (
            <Link
              key={t.cat + t.label}
              to="/explorer"
              search={{ category: t.cat } as never}
              className="group flex animate-tile-pop flex-col items-center"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div
                className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl shadow-sm ring-1 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg active:scale-95 ${t.free ? "ring-2" : "ring-black/5"}`}
                style={t.free
                  ? { backgroundColor: t.tint, ['--tw-ring-color' as string]: DARK_GREEN }
                  : { backgroundColor: t.tint }}
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 opacity-90" style={{ background: t.grad, clipPath: "ellipse(120% 100% at 50% 0%)" }} />
                <span aria-hidden className="absolute -right-3 -top-3 size-10 rounded-full bg-white/25" />
                <span className="relative z-10 text-3xl drop-shadow-sm transition duration-300 group-hover:scale-110">{t.emoji}</span>
                {t.free && (
                  <span className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-tight text-white shadow whitespace-nowrap" style={{ backgroundColor: DARK_GREEN }}>
                    100% GRATUIT
                  </span>
                )}
              </div>
              <span className="mt-1.5 text-center text-[10px] font-semibold leading-tight text-foreground">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>


      {/* ANNONCES — GRILLE MASONRY VERTICALE */}
      <section className="bg-card px-4 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-foreground">Annonces récentes</h3>
          <Link to="/explorer" className="text-xs font-semibold" style={{ color: DARK_GREEN }}>Voir tout</Link>
        </div>

        {feed.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucune annonce pour l'instant.</p>
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
          className="relative block overflow-hidden rounded-2xl p-5 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #14532D 0%, #1B6E3C 60%, #2E9B57 100%)" }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-sheen bg-white/15 blur-md" />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Boostez vos ventes</p>
          <h4 className="mt-1 text-lg font-extrabold">Passez Pro ou Business</h4>
          <p className="mt-1 text-xs text-white/80">Visibilité prioritaire, boutique perso, statistiques avancées.</p>
          <span className="mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-extrabold text-[#14532D]" style={{ backgroundColor: GOLD }}>Voir les offres</span>
        </Link>
      </section>
    </MobileShell>
  );
}
