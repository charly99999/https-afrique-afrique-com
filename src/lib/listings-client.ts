// Helper client-side pour récupérer les annonces depuis Supabase.
// Utilise la vue `public_profiles` (sans téléphone/whatsapp) pour les jointures publiques.
// Téléphone/whatsapp uniquement via RPC `get_listing_contact` (réservé aux utilisateurs connectés).
import { supabase } from "@/integrations/supabase/client";
import type { CountryCode, SellerBadge } from "@/data/catalog";
import { resolveListingImage, resolveListingImages } from "@/lib/listing-images";
import type { Database } from "@/integrations/supabase/types";

export type DbListing = {
  id: string;
  title: string;
  price: number;
  category: string;
  subCategory?: string;
  country: CountryCode;
  city: string;
  image: string;
  boosted?: boolean;
  badge?: SellerBadge;
  seller: string;
  postedAt: string;
  description: string;
  ownerId?: string;
  sellerPhone?: string;
  sellerWhatsapp?: string;
  verified?: boolean;
  isFavorite?: boolean;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

const TIER_RANK: Record<SellerBadge, number> = { business: 0, pro: 1, gratuit: 2 };

export function sortListingsByPriority(items: DbListing[]): DbListing[] {
  return [...items].sort((a, b) => {
    const ta = TIER_RANK[a.badge ?? "gratuit"];
    const tb = TIER_RANK[b.badge ?? "gratuit"];
    if (ta !== tb) return ta - tb;
    if (!!b.boosted !== !!a.boosted) return b.boosted ? 1 : -1;
    return 0;
  });
}

type PubProfile = Database["public"]["Views"]["public_profiles"]["Row"];

export type SellerStats = {
  active_listings: number;
  member_since: string;
  verified: boolean;
  verified_at: string | null;
  trust_score: number;
};

export async function fetchSellerStats(sellerId: string): Promise<SellerStats | null> {
  const [{ count }, { data: profile }] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", sellerId)
      .eq("status", "active"),
    supabase
      .from("public_profiles")
      .select("created_at, verified, verified_at")
      .eq("id", sellerId)
      .maybeSingle<Pick<PubProfile, "created_at" | "verified" | "verified_at">>(),
  ]);

  if (!profile?.created_at) return null;
  const active = count ?? 0;
  const months = Math.max(0, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 2_592_000_000));
  return {
    active_listings: active,
    member_since: profile.created_at,
    verified: !!profile.verified,
    verified_at: profile.verified_at ?? null,
    trust_score: (profile.verified ? 30 : 0) + Math.min(active, 30) + Math.min(months, 40),
  };
}

export async function fetchSellerRating(sellerId: string): Promise<{ avg: number; total: number }> {
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("seller_id", sellerId)
    .limit(500);

  const ratings = (data ?? []).map((row) => Number(row.rating)).filter(Number.isFinite);
  if (ratings.length === 0) return { avg: 0, total: 0 };
  const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  return { avg: Math.round(avg * 100) / 100, total: ratings.length };
}

export async function fetchListingContact(listingId: string): Promise<{ phone?: string; whatsapp?: string }> {
  const { data: listing } = await supabase
    .from("listings")
    .select("owner_id, status")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing?.owner_id || listing.status !== "active") return {};

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return {};

  const isOwner = userId === listing.owner_id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, whatsapp")
    .eq("id", listing.owner_id)
    .maybeSingle();

  if (!isOwner && !profile) return {};
  return {
    phone: profile?.phone ?? undefined,
    whatsapp: profile?.whatsapp ?? profile?.phone ?? undefined,
  };
}

async function fetchPublicProfiles(ids: string[]): Promise<Map<string, PubProfile>> {
  const map = new Map<string, PubProfile>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .in("id", ids);
  (data as PubProfile[] | null)?.forEach((p) => {
    if (p.id) map.set(p.id, p);
  });
  return map;
}

export async function fetchListings(country: CountryCode | "ALL", userId?: string, category?: string): Promise<DbListing[]> {
  let q = supabase
    .from("listings")
    .select(`id, title, description, price_fcfa, category_slug, subcategory_slug,
             country, city, cover_url, boosted_until, published_at, created_at, owner_id`)
    .eq("status", "active");
  if (country !== "ALL") q = q.eq("country", country);
  if (category) q = q.eq("category_slug", category);
  
  const { data, error } = await q
    .order("boosted_until", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(120);
  
  if (error || !data) return [];

  const profiles = await fetchPublicProfiles(
    Array.from(new Set(data.map((r) => r.owner_id).filter(Boolean) as string[]))
  );
  const resolvedImages = await resolveListingImages(data.map((r) => r.cover_url));

  let favoriteIds = new Set<string>();
  if (userId) {
    const { data: favs } = await supabase.from("favorites").select("listing_id").eq("user_id", userId);
    if (favs) favoriteIds = new Set(favs.map(f => f.listing_id));
  }

  const items = data.map((r) => {
    const prof = r.owner_id ? profiles.get(r.owner_id) : undefined;
    const tier = prof?.account_type as SellerBadge | undefined;
    return {
      id: r.id,
      title: r.title,
      price: Number(r.price_fcfa),
      category: r.category_slug,
      subCategory: r.subcategory_slug ?? undefined,
      country: r.country as CountryCode,
      city: r.city,
      image: r.cover_url ? (resolvedImages.get(r.cover_url) ?? r.cover_url) : "/placeholder.svg",
      boosted: r.boosted_until ? new Date(r.boosted_until) > new Date() : false,
      badge: (tier === "pro" || tier === "business" ? tier : "gratuit") as SellerBadge,
      seller: prof?.display_name ?? "Vendeur",
      postedAt: timeAgo(r.published_at ?? r.created_at),
      description: r.description,
      verified: !!prof?.verified,
      isFavorite: favoriteIds.has(r.id),
    } satisfies DbListing;
  });
  return sortListingsByPriority(items);
}

export async function fetchListing(id: string, userId?: string): Promise<DbListing | null> {
  const { data, error } = await supabase
    .from("listings")
    .select(`id, title, description, price_fcfa, category_slug, subcategory_slug,
             country, city, cover_url, boosted_until, published_at, created_at, owner_id`)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  let prof: PubProfile | undefined;
  if (data.owner_id) {
    const m = await fetchPublicProfiles([data.owner_id]);
    prof = m.get(data.owner_id);
  }
  const tier = prof?.account_type as SellerBadge | undefined;

  const { phone, whatsapp } = await fetchListingContact(id);

  const image = await resolveListingImage(data.cover_url);

  let isFav = false;
  if (userId) {
    const { data: f } = await supabase.from("favorites").select("listing_id").eq("user_id", userId).eq("listing_id", id).maybeSingle();
    isFav = !!f;
  }

  return {
    id: data.id,
    title: data.title,
    price: Number(data.price_fcfa),
    category: data.category_slug,
    subCategory: data.subcategory_slug ?? undefined,
    country: data.country as CountryCode,
    city: data.city,
    image: image ?? "/placeholder.svg",
    boosted: data.boosted_until ? new Date(data.boosted_until) > new Date() : false,
    badge: tier === "pro" || tier === "business" ? tier : "gratuit",
    seller: prof?.display_name ?? "Vendeur",
    postedAt: timeAgo(data.published_at ?? data.created_at),
    description: data.description,
    ownerId: data.owner_id ?? undefined,
    sellerPhone: phone,
    sellerWhatsapp: whatsapp,
    verified: !!prof?.verified,
    isFavorite: isFav,
  };
}

export async function fetchPhotos(listingId: string): Promise<string[]> {
  const { data } = await supabase.from("listing_photos")
    .select("url, position").eq("listing_id", listingId).order("position");
  if (!data?.length) return [];
  const resolved = await resolveListingImages(data.map((p) => p.url));
  return data.map((p) => resolved.get(p.url) ?? p.url);
}

export async function fetchSimilarListings(listing: DbListing, limit = 4, userId?: string): Promise<DbListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(`id, title, description, price_fcfa, category_slug, subcategory_slug,
             country, city, cover_url, boosted_until, published_at, created_at, owner_id`)
    .eq("status", "active")
    .eq("category_slug", listing.category)
    .neq("id", listing.id)
    .limit(limit);

  if (error || !data) return [];

  const profiles = await fetchPublicProfiles(
    Array.from(new Set(data.map((r) => r.owner_id).filter(Boolean) as string[]))
  );
  const resolvedImages = await resolveListingImages(data.map((r) => r.cover_url));

  let favoriteIds = new Set<string>();
  if (userId) {
    const { data: favs } = await supabase.from("favorites").select("listing_id").eq("user_id", userId);
    if (favs) favoriteIds = new Set(favs.map(f => f.listing_id));
  }

  const items = data.map((r) => {
    const prof = r.owner_id ? profiles.get(r.owner_id) : undefined;
    const tier = prof?.account_type as SellerBadge | undefined;
    return {
      id: r.id,
      title: r.title,
      price: Number(r.price_fcfa),
      category: r.category_slug,
      subCategory: r.subcategory_slug ?? undefined,
      country: r.country as CountryCode,
      city: r.city,
      image: r.cover_url ? (resolvedImages.get(r.cover_url) ?? r.cover_url) : "/placeholder.svg",
      boosted: r.boosted_until ? new Date(r.boosted_until) > new Date() : false,
      badge: (tier === "pro" || tier === "business" ? tier : "gratuit") as SellerBadge,
      seller: prof?.display_name ?? "Vendeur",
      postedAt: timeAgo(r.published_at ?? r.created_at),
      description: r.description,
      verified: !!prof?.verified,
      isFavorite: favoriteIds.has(r.id),
    } satisfies DbListing;
  });
  return sortListingsByPriority(items);
}
