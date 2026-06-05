import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { ListingCard } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { resolveListingImages } from "@/lib/listing-images";
import type { DbListing } from "@/lib/listings-client";
import type { CountryCode, SellerBadge } from "@/data/catalog";
import { VerifiedBadge, TrustChip, memberSinceLabel, type SellerStats } from "@/components/TrustBadge";
import { SellerReviews } from "@/components/SellerReviews";
import { getBoutiqueSeo, type BoutiqueSeo } from "@/lib/seo.functions";

const SITE = "https://afrique-afrique.com";

function truncate(s: string, n: number) {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length <= n ? clean : clean.slice(0, n - 1).trimEnd() + "…";
}

export const Route = createFileRoute("/boutique/$ownerId")({
  loader: async ({ params }): Promise<BoutiqueSeo | null> => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(params.ownerId);
    if (!isUuid) return null;
    try {
      return await getBoutiqueSeo({ data: { id: params.ownerId } });
    } catch {
      return null;
    }
  },
  head: ({ params, loaderData }) => {
    const seo = loaderData as BoutiqueSeo | null | undefined;
    const url = `${SITE}/boutique/${params.ownerId}`;
    const name = seo?.displayName ?? "Boutique";
    const where = [seo?.city, seo?.country].filter(Boolean).join(", ");
    const title = seo
      ? `${name}${where ? ` · ${where}` : ""} — Afrique-business`
      : "Boutique du vendeur — Afrique-business";
    const description = seo
      ? truncate(
          `${name} propose ${seo.listingsCount} annonce${seo.listingsCount > 1 ? "s" : ""} sur Afrique-business${where ? ` à ${where}` : ""}. ${seo.bio ?? ""}`,
          155,
        )
      : "Découvrez toutes les annonces de ce vendeur sur Afrique-business.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: ({ error, reset }) => (
    <MobileShell>
      <div className="px-6 py-20 text-center">
        <h1 className="font-display text-2xl italic">Erreur</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded-xl bg-brand-green px-5 py-2 text-sm font-bold text-primary-foreground">Réessayer</button>
      </div>
    </MobileShell>
  ),
  component: BoutiquePage,
});

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

function BoutiquePage() {
  const { ownerId } = useParams({ from: "/boutique/$ownerId" });
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; account_type: string | null; city: string | null; country: string | null; avatar_url?: string | null; verified?: boolean } | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [listings, setListings] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(ownerId);
        if (!isUuid) { setNotFound(true); setLoading(false); return; }

        const [{ data: prof }, { data: statsRow }] = await Promise.all([
          supabase.from("public_profiles")
            .select("id, display_name, account_type, city, country, verified")
            .eq("id", ownerId)
            .maybeSingle(),
          supabase.rpc("get_seller_stats", { _seller_id: ownerId }).maybeSingle(),
        ]);

        if (cancelled) return;
        if (!prof) { setNotFound(true); setLoading(false); return; }
        setProfile(prof as any);
        if (statsRow) setStats(statsRow as SellerStats);

        const { data: rows } = await supabase
          .from("listings")
          .select("id, title, description, price_fcfa, category_slug, subcategory_slug, country, city, cover_url, boosted_until, published_at, created_at, owner_id")
          .eq("owner_id", ownerId)
          .eq("status", "active")
          .order("boosted_until", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (cancelled) return;
        const data = rows ?? [];
        const resolved = await resolveListingImages(data.map((r) => r.cover_url));

        let favoriteIds = new Set<string>();
        if (user) {
          const { data: favs } = await supabase.from("favorites").select("listing_id").eq("user_id", user.id);
          if (favs) favoriteIds = new Set(favs.map((f) => f.listing_id));
        }

        const tier = (prof as any).account_type as SellerBadge | undefined;
        const mapped: DbListing[] = data.map((r) => ({
          id: r.id,
          title: r.title,
          price: Number(r.price_fcfa),
          category: r.category_slug,
          subCategory: r.subcategory_slug ?? undefined,
          country: r.country as CountryCode,
          city: r.city,
          image: r.cover_url ? (resolved.get(r.cover_url) ?? r.cover_url) : "/placeholder.svg",
          boosted: r.boosted_until ? new Date(r.boosted_until) > new Date() : false,
          badge: tier === "pro" || tier === "business" ? tier : "gratuit",
          seller: (prof as any).display_name ?? "Vendeur",
          postedAt: timeAgo(r.published_at ?? r.created_at),
          description: r.description,
          isFavorite: favoriteIds.has(r.id),
        }));

        if (!cancelled) { setListings(mapped); setLoading(false); }
      } catch (err) {
        console.error("Erreur boutique:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ownerId, user?.id]);

  if (loading) {
    return <MobileShell><div className="p-10 text-center text-sm text-muted-foreground">Chargement…</div></MobileShell>;
  }
  if (notFound || !profile) {
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Boutique introuvable</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-brand-green">← Retour</Link>
        </div>
      </MobileShell>
    );
  }

  const tier = profile.account_type as SellerBadge | undefined;
  const name = profile.display_name ?? "Vendeur";

  return (
    <MobileShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name,
            url: `https://afrique-afrique.com/boutique/${ownerId}`,
            address: profile.city || profile.country
              ? {
                  "@type": "PostalAddress",
                  addressLocality: profile.city ?? undefined,
                  addressCountry: profile.country ?? undefined,
                }
              : undefined,
            makesOffer: listings.slice(0, 50).map((l) => {
              const absImg = /^https?:\/\//i.test(l.image)
                ? l.image
                : `https://afrique-afrique.com${l.image.startsWith("/") ? l.image : `/${l.image}`}`;
              return {
                "@type": "Offer",
                url: `https://afrique-afrique.com/annonces/${l.id}`,
                price: l.price,
                priceCurrency: "XOF",
                itemOffered: { "@type": "Product", name: l.title, image: absImg },
              };
            }),
            aggregateRating: stats && stats.trust_score
              ? { "@type": "AggregateRating", ratingValue: Math.min(5, stats.trust_score / 20).toFixed(1), bestRating: 5, ratingCount: stats.active_listings || 1 }
              : undefined,
          }),
        }}
      />
      <div className="flex items-center gap-3 px-5 py-4">
        <Link to="/" aria-label="Retour" className="grid size-10 place-items-center rounded-full bg-card shadow-soft">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl italic">Boutique</h1>
      </div>

      <div className="mx-5 flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-green/10 font-display text-2xl italic text-brand-green">
          {name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold">{name}</p>
            {profile.verified && <VerifiedBadge />}
          </div>
          {(profile.city || profile.country) && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3" /> {profile.city ?? ""} {profile.country ? `• ${profile.country}` : ""}
            </p>
          )}
          {stats && (
            <p className="mt-1 text-[11px] text-muted-foreground">{memberSinceLabel(stats.member_since)}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {tier === "business" && <span className="rounded bg-foreground px-2 py-0.5 text-[9px] font-extrabold text-brand-gold">👑 Business</span>}
            {tier === "pro" && <span className="rounded bg-brand-green px-2 py-0.5 text-[9px] font-extrabold text-primary-foreground">PRO</span>}
            <span className="rounded bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">{listings.length} annonce{listings.length > 1 ? "s" : ""}</span>
            {stats && <TrustChip stats={stats} />}
          </div>
        </div>
      </div>

      <section className="mt-6 px-5 pb-10">
        <h2 className="mb-4 flex items-center gap-3 text-sm font-extrabold uppercase tracking-tight">
          <span className="h-[2px] w-6 bg-brand-green" /> Annonces du vendeur
        </h2>
        {listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Ce vendeur n'a aucune annonce active pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {listings.map((l) => <ListingCard key={l.id} listing={l as any} />)}
          </div>
        )}
      </section>

      <SellerReviews sellerId={ownerId} />
    </MobileShell>
  );
}
