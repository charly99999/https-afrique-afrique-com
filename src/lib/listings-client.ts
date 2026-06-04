// Helper client-side pour récupérer les annonces depuis Supabase.
// Utilise la vue `public_profiles` (sans téléphone/whatsapp) pour les jointures publiques.
// Téléphone/whatsapp uniquement via RPC `get_listing_contact` (réservé aux utilisateurs connectés).
import { supabase } from "@/integrations/supabase/client";
import type { CountryCode, SellerBadge } from "@/data/catalog";

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

type PubProfile = { id: string; display_name: string | null; account_type: string | null };

async function fetchPublicProfiles(ids: string[]): Promise<Map<string, PubProfile>> {
  const map = new Map<string, PubProfile>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from("public_profiles" as never)
    .select("id, display_name, account_type")
    .in("id", ids);
  (data as PubProfile[] | null)?.forEach((p) => map.set(p.id, p));
  return map;
}

export async function fetchListings(country: CountryCode): Promise<DbListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(`id, title, description, price_fcfa, category_slug, subcategory_slug,
             country, city, cover_url, boosted_until, published_at, created_at, owner_id`)
    .eq("country", country)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error || !data) return [];

  const profiles = await fetchPublicProfiles(
    Array.from(new Set(data.map((r) => r.owner_id).filter(Boolean) as string[]))
  );

  return data.map((r) => {
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
      image: r.cover_url ?? "/placeholder.svg",
      boosted: r.boosted_until ? new Date(r.boosted_until) > new Date() : false,
      badge: tier === "pro" || tier === "business" ? tier : "gratuit",
      seller: prof?.display_name ?? "Vendeur",
      postedAt: timeAgo(r.published_at ?? r.created_at),
      description: r.description,
    };
  });
}

export async function fetchListing(id: string): Promise<DbListing | null> {
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

  // Contact uniquement pour les utilisateurs connectés (RPC SECURITY DEFINER)
  let phone: string | undefined;
  let whatsapp: string | undefined;
  const { data: sess } = await supabase.auth.getSession();
  if (sess.session) {
    const { data: c } = await supabase.rpc("get_listing_contact" as never, { _listing_id: id } as never);
    const row = Array.isArray(c) ? (c[0] as { phone?: string; whatsapp?: string } | undefined) : undefined;
    phone = row?.phone ?? undefined;
    whatsapp = row?.whatsapp ?? row?.phone ?? undefined;
  }

  return {
    id: data.id,
    title: data.title,
    price: Number(data.price_fcfa),
    category: data.category_slug,
    subCategory: data.subcategory_slug ?? undefined,
    country: data.country as CountryCode,
    city: data.city,
    image: data.cover_url ?? "/placeholder.svg",
    boosted: data.boosted_until ? new Date(data.boosted_until) > new Date() : false,
    badge: tier === "pro" || tier === "business" ? tier : "gratuit",
    seller: prof?.display_name ?? "Vendeur",
    postedAt: timeAgo(data.published_at ?? data.created_at),
    description: data.description,
    ownerId: data.owner_id ?? undefined,
    sellerPhone: phone,
    sellerWhatsapp: whatsapp,
  };
}

export async function fetchPhotos(listingId: string): Promise<string[]> {
  const { data } = await supabase.from("listing_photos")
    .select("url, position").eq("listing_id", listingId).order("position");
  return data?.map((p) => p.url) ?? [];
}
