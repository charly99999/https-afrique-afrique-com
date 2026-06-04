// Helper client-side pour récupérer les annonces depuis Supabase.
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

export async function fetchListings(country: CountryCode): Promise<DbListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, title, description, price_fcfa, category_slug, subcategory_slug,
      country, city, cover_url, boosted_until, published_at, created_at,
      profiles:owner_id ( display_name, account_type )
    `)
    .eq("country", country)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error || !data) return [];
  return data.map((r) => {
    const tier = (r.profiles as { account_type?: string } | null)?.account_type as SellerBadge | undefined;
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
      seller: (r.profiles as { display_name?: string } | null)?.display_name ?? "Vendeur",
      postedAt: timeAgo(r.published_at ?? r.created_at),
      description: r.description,
    };
  });
}

export async function fetchListing(id: string): Promise<DbListing | null> {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, title, description, price_fcfa, category_slug, subcategory_slug,
      country, city, cover_url, boosted_until, published_at, created_at,
      profiles:owner_id ( display_name, account_type )
    `)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const tier = (data.profiles as { account_type?: string } | null)?.account_type as SellerBadge | undefined;
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
    seller: (data.profiles as { display_name?: string } | null)?.display_name ?? "Vendeur",
    postedAt: timeAgo(data.published_at ?? data.created_at),
    description: data.description,
  };
}

export async function fetchPhotos(listingId: string): Promise<string[]> {
  const { data } = await supabase.from("listing_photos")
    .select("url, position").eq("listing_id", listingId).order("position");
  return data?.map((p) => p.url) ?? [];
}
