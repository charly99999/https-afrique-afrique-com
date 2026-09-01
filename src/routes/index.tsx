import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Bell, Car, Home, Smartphone, Refrigerator, Shirt, Baby,
  Briefcase, Sofa, Tractor, Apple, Dog, Package, ShieldCheck, Wallet, Globe2,
  MapPin, ArrowRight, Sparkles,
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
import { ElephantAfrica3D, ElephantMark } from "@/components/ElephantAfrica3D";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Afrique-Afrique — Vendez, achetez, développez" },
      { name: "description", content: "Marketplace premium d'Afrique francophone : immobilier, véhicules, téléphones, emploi, services. Inscription gratuite, 11 pays couverts." },
      { property: "og:title", content: "Afrique-Afrique — Marketplace panafricaine" },
      { property: "og:description", content: "Inscription gratuite. Vendez • Achetez • Développez, partout en Afrique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type Tile = { label: string; Icon: LucideIcon; cat: string; free?: boolean };
const TILES: Tile[] = [
  { label: "Immobilier", Icon: Home, cat: "immobilier" },
  { label: "Véhicules", Icon: Car, cat: "vehicules" },
  { label: "Électronique", Icon: Smartphone, cat: "electronique" },
  { label: "Électroménager", Icon: Refrigerator, cat: "electromenager" },
  { label: "Mode & Beauté", Icon: Shirt, cat: "mode" },
  { label: "Pour l'Enfant", Icon: Baby, cat: "enfant" },
  { label: "Emploi & Services", Icon: Briefcase, cat: "services", free: true },
  { label: "Maison & Loisirs", Icon: Sofa, cat: "maison" },
  { label: "Agricole", Icon: Tractor, cat: "pro-agricole" },
  { label: "Alimentation", Icon: Apple, cat: "alimentation" },
  { label: "Animaux", Icon: Dog, cat: "animaux" },
  { label: "Autres", Icon: Package, cat: "autres" },
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
      {/* ── HEADER COMPACT ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <ElephantMark className="size-9" />

            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block truncate font-display text-sm text-brand-gold">AFRIQUE-AFRIQUE</span>
              <span className="block truncate text-[10px] text-muted-foreground">Vendez • Achetez • Développez</span>
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-6 text-xs font-bold text-muted-foreground md:flex">
            <Link to="/" className="text-foreground">Accueil</Link>
            <a href="#categories" className="transition hover:text-foreground">Catégories</a>
            <Link to="/explorer" className="transition hover:text-foreground">Explorer</Link>
            <Link to="/abonnements" className="transition hover:text-foreground">Abonnements</Link>
          </nav>
          <span className="md:hidden" />

          <div className="flex shrink-0 items-center gap-1.5">
            <ShareAppButton />
            <Link to="/messages" aria-label="Notifications" className="relative grid size-9 place-items-center rounded-full bg-secondary ring-1 ring-border">
              <Bell className="size-4 text-foreground" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <Link
              to="/publier"
              className="hidden rounded-full bg-brand-green px-4 py-2 text-xs font-extrabold text-primary-foreground shadow-soft transition hover:brightness-110 sm:inline-block"
            >
              Publier une annonce
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO PREMIUM ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/70">
        <img
          src={africaMap}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.18]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_75%_0%,color-mix(in_oklab,var(--brand-gold)_22%,transparent),transparent_60%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full border border-brand-gold/25" />
        <div aria-hidden className="pointer-events-none absolute -left-20 bottom-0 size-64 rounded-full border border-brand-gold/15" />

        {/* Scène 3D : éléphant d'or sur la carte d'Afrique (desktop) */}
        <ElephantAfrica3D className="absolute right-4 top-1/2 hidden w-[42%] max-w-[560px] -translate-y-1/2 lg:block" />

        <div className="relative z-10 px-5 py-10 md:px-10 md:py-16 lg:max-w-[58%] lg:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/12 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-gold ring-1 ring-brand-gold/30">
            <Sparkles className="size-3" /> Inscription gratuite
          </span>
          <h1 className="mt-4 font-display text-3xl leading-[1.05] text-foreground sm:text-4xl lg:text-6xl">
            AFRIQUE-AFRIQUE
          </h1>
          <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.22em] text-brand-gold sm:text-base">
            Vendez • Achetez • Développez
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Présentez vos produits, biens, services et opportunités à des milliers d'acheteurs
            et de visiteurs qui cherchent exactement ce que vous proposez, partout en Afrique.
          </p>

          {/* Scène 3D (mobile / tablette) */}
          <ElephantAfrica3D className="mx-auto mt-6 w-[86%] max-w-[380px] lg:hidden" />


          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-brand-green px-6 py-3 text-xs font-extrabold uppercase tracking-wide text-primary-foreground shadow-luxury transition hover:brightness-110 active:scale-95"
            >
              Inscription gratuite
            </Link>
            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 px-6 py-3 text-xs font-extrabold uppercase tracking-wide text-brand-gold transition hover:bg-brand-gold/10 active:scale-95"
            >
              Explorer les annonces <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* ── BARRE DE RECHERCHE ─────────────────────────────────────── */}
          <div className="mt-8 rounded-3xl border border-border bg-card/80 p-2 shadow-luxury backdrop-blur-xl">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Que recherchez-vous ?"
                  className="w-full rounded-2xl bg-secondary py-3.5 pl-11 pr-4 text-sm text-foreground outline-none ring-1 ring-transparent transition placeholder:text-muted-foreground focus:ring-brand-gold/50"
                />
              </div>
              <Link
                to="/explorer"
                className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3.5 text-xs font-bold text-muted-foreground ring-1 ring-border transition hover:text-foreground lg:w-44"
              >
                <MapPin className="size-4 text-brand-gold" /> Toute l'Afrique
              </Link>
              <Link
                to="/explorer"
                search={{ q: query } as never}
                className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-primary-foreground transition hover:brightness-110 active:scale-95"
              >
                <Search className="size-4" /> Rechercher
              </Link>
            </div>
          </div>

          {/* Confiance */}
          <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {TRUST.map(({ Icon, label }) => (
              <li key={label} className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Icon className="size-3.5 shrink-0 text-brand-gold" />
                <span className="truncate text-[11px] font-semibold">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <IndependenceBanner />
      <PromoBanner />

      {/* ── CATÉGORIES ─────────────────────────────────────────────────── */}
      <section id="categories" className="px-4 pt-8 md:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg text-foreground sm:text-xl">Explorer par catégorie</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">12 univers, des milliers d'opportunités</p>
          </div>
          <Link to="/explorer" className="shrink-0 text-xs font-bold text-brand-gold">Voir tout</Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {TILES.map(({ label, Icon, cat, free }, i) => (
            <Link
              key={cat}
              to="/explorer"
              search={{ category: cat } as never}
              className="group animate-tile-pop relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-gold/45"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_100%_0%,color-mix(in_oklab,var(--brand-gold)_14%,transparent),transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100" />
              <span className="relative grid size-10 place-items-center rounded-xl bg-secondary ring-1 ring-border transition group-hover:ring-brand-gold/40">
                <Icon className="size-5 text-brand-gold" strokeWidth={1.9} />
              </span>
              <span className="relative mt-3 block truncate text-[13px] font-bold text-foreground">{label}</span>
              {free ? (
                <span className="relative mt-1 inline-block rounded-full bg-brand-green/15 px-2 py-0.5 text-[9px] font-extrabold uppercase text-brand-green">
                  100% gratuit
                </span>
              ) : (
                <span className="relative mt-1 block text-[10px] text-muted-foreground">Voir les annonces</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* ── DERNIÈRES OPPORTUNITÉS ─────────────────────────────────────── */}
      <section className="px-4 py-10 md:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg text-foreground sm:text-xl">Les dernières opportunités</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">Annonces récemment publiées près de chez vous</p>
          </div>
          <Link to="/explorer" className="shrink-0 text-xs font-bold text-brand-gold">Voir tout</Link>
        </div>

        {loadingFeed ? (
          <ListingGridSkeleton count={8} />
        ) : feed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-14 text-center">
            <p className="text-sm font-bold text-foreground">Aucune annonce pour l'instant</p>
            <p className="mt-1 text-xs text-muted-foreground">Soyez le premier à publier dans votre ville.</p>
            <Link to="/publier" className="mt-5 inline-block rounded-full bg-brand-green px-5 py-2.5 text-xs font-extrabold text-primary-foreground">
              Publier une annonce
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {feed.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA PRO / BUSINESS ─────────────────────────────────────────── */}
      <section className="px-4 pb-10 md:px-8">
        <Link
          to="/abonnements"
          className="relative block overflow-hidden rounded-3xl border border-brand-gold/25 bg-card p-6 shadow-luxury"
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,color-mix(in_oklab,var(--brand-gold)_18%,transparent),transparent_60%)]" />
          <span aria-hidden className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-foreground/5 blur-md" />
          <p className="relative text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-gold">Boostez vos ventes</p>
          <h3 className="relative mt-2 font-display text-xl text-foreground">Passez Pro ou Business</h3>
          <p className="relative mt-1 max-w-md text-xs text-muted-foreground">
            Visibilité prioritaire, boutique personnalisée et statistiques avancées.
          </p>
          <span className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-brand-gold px-5 py-2 text-xs font-extrabold text-primary-foreground">
            Voir les offres <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </section>
    </MobileShell>
  );
}
