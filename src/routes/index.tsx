import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Bell, Car, Home, Smartphone, Refrigerator, Shirt, Baby,
  Briefcase, Sofa, Tractor, Apple, Dog, Package, ShieldCheck, Wallet, Globe2,
  type LucideIcon,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { ListingCard } from "@/components/ListingCard";
import { ShareAppButton } from "@/components/ShareAppButton";
import { PromoBanner } from "@/components/PromoBanner";
import { IndependenceBanner } from "@/components/IndependenceBanner";
import { ListingGridSkeleton } from "@/components/ListingSkeleton";
import { toast } from "sonner";
import { type CountryCode } from "@/data/catalog";
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

type Tile = { label: string; Icon: LucideIcon; cat: string; free?: boolean; color: string; tint: string };
const TILES: Tile[] = [
  { label: "Véhicules", Icon: Car, cat: "vehicules", color: "#1B6E3C", tint: "#E9F6EE" },
  { label: "Immobilier", Icon: Home, cat: "immobilier", color: "#0F5C86", tint: "#E8F3F9" },
  { label: "Électronique", Icon: Smartphone, cat: "electronique", color: "#4A2B86", tint: "#F0EBFA" },
  { label: "Électroménager", Icon: Refrigerator, cat: "electromenager", color: "#166A6A", tint: "#E7F5F4" },
  { label: "Mode & Beauté", Icon: Shirt, cat: "mode", color: "#A02455", tint: "#FBEBF1" },
  { label: "Pour l'Enfant", Icon: Baby, cat: "enfant", color: "#B4651A", tint: "#FDF2E4" },
  { label: "Emploi & Services", Icon: Briefcase, cat: "services", free: true, color: "#B07A00", tint: "#FDF6E7" },
  { label: "Maison & Loisirs", Icon: Sofa, cat: "maison", color: "#5C4630", tint: "#F5EFE8" },
  { label: "Agricole", Icon: Tractor, cat: "pro-agricole", color: "#3F6B12", tint: "#F0F6E4" },
  { label: "Alimentation", Icon: Apple, cat: "alimentation", color: "#9B1C25", tint: "#FBEBEA" },
  { label: "Animaux", Icon: Dog, cat: "animaux", color: "#8A5A11", tint: "#FBF2E0" },
  { label: "Autres", Icon: Package, cat: "autres", color: "#3C4653", tint: "#EEF1F4" },
];

const TRUST: { Icon: LucideIcon; label: string }[] = [
  { Icon: ShieldCheck, label: "Vendeurs vérifiés" },
  { Icon: Wallet, label: "Mobile Money" },
  { Icon: Globe2, label: "11 pays" },
];

function HomePage() {
  const { user } = useAuth();
  const [country] = useState<CountryCode>("CI");
  const [query, setQuery] = useState("");
  const [dbListings, setDbListings] = useState<DbListing[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadingFeed(true);
    (async () => {
      try {
        const d = await fetchListings(country);
        if (!cancelled) setDbListings(d ?? []);
      } catch (err) {
        if (!cancelled) {
          setDbListings([]);
          toast.error(
            err instanceof Error && /fetch|network/i.test(err.message)
              ? "Connexion instable : impossible de charger les annonces."
              : "Impossible de charger les annonces pour le moment.",
          );
        }
      } finally {
        if (!cancelled) setLoadingFeed(false);
      }
    })();
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

  const feed = useMemo(() => dbListings, [dbListings]);


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
        <section className="px-5 pb-5">
          <div className="relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg, #14532D 0%, #1B6E3C 60%, #2E9B57 100%)", boxShadow: "0 10px 30px -14px rgba(0,0,0,0.55)" }}>
            <img
              src={africaMap}
              alt=""
              aria-hidden
              width={768}
              height={768}
              className="pointer-events-none absolute -right-8 top-1/2 h-[150%] w-auto -translate-y-1/2 opacity-60"
            />
            <div className="relative z-10 max-w-[60%] p-5">
              <h2 className="text-[26px] font-extrabold leading-tight text-white">100% Gratuit</h2>
              <p className="mt-0.5 text-sm font-medium text-white/85">Aucune commission sur vos ventes</p>
              <Link
                to="/explorer"
                className="mt-4 inline-block rounded-full px-4 py-2 text-xs font-extrabold text-[#14532D] shadow-md active:scale-95"
                style={{ backgroundColor: GOLD }}
              >
                Voir les annonces
              </Link>
            </div>
          </div>
        </section>

        {/* BANDEAU DE CONFIANCE */}
        <div className="border-t border-white/10 px-5 py-2.5" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
          <ul className="flex items-center justify-between gap-2">
            {TRUST.map(({ Icon, label }) => (
              <li key={label} className="flex min-w-0 items-center gap-1.5 text-white/85">
                <Icon className="size-3.5 shrink-0" style={{ color: GOLD }} />
                <span className="truncate text-[11px] font-semibold">{label}</span>
              </li>
            ))}
          </ul>
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
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {TILES.map(({ label, Icon, cat, free, color, tint }, i) => (
            <Link
              key={cat + label}
              to="/explorer"
              search={{ category: cat } as never}
              className="group flex animate-tile-pop flex-col items-center"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div
                className={`tile-3d gloss-3d relative grid aspect-square w-full place-items-center rounded-2xl border group-hover:-translate-y-1 ${free ? "border-2" : "border-black/5"}`}
                style={{
                  background: `linear-gradient(160deg, #ffffff 0%, ${tint} 45%, color-mix(in oklab, ${tint} 78%, #000000) 100%)`,
                  borderColor: free ? GOLD : undefined,
                }}
              >
                <Icon className="relative z-10 size-6 transition duration-300 group-hover:scale-110" style={{ color, filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.18))" }} strokeWidth={1.9} />
              </div>

              <span className="mt-1.5 line-clamp-2 text-center text-[10px] font-semibold leading-tight text-foreground">{label}</span>
              {free && (
                <span className="mt-1 rounded-full px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-tight text-white" style={{ backgroundColor: DARK_GREEN }}>
                  100% Gratuit
                </span>
              )}
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

        {loadingFeed ? (
          <ListingGridSkeleton count={6} />
        ) : feed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-sm font-semibold text-foreground">Aucune annonce pour l'instant</p>
            <p className="mt-1 text-xs text-muted-foreground">Soyez le premier à publier dans votre ville.</p>
            <Link to="/publier" className="mt-4 inline-block rounded-full bg-brand-green px-5 py-2 text-xs font-extrabold text-primary-foreground">
              Publier une annonce
            </Link>
          </div>
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
