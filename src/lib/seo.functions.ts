// Server functions publiques pour SEO SSR (loaders de routes publiques).
// Utilise supabaseAdmin côté serveur uniquement — pas de bearer requis.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uuid = z.string().uuid();

export type ListingSeo = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subCategory: string | null;
  country: string;
  city: string;
  cover: string | null;
  ownerId: string | null;
  sellerName: string | null;
  sellerVerified: boolean;
  sellerType: string | null;
  publishedAt: string | null;
};

export type BoutiqueSeo = {
  id: string;
  displayName: string;
  city: string | null;
  country: string | null;
  bio: string | null;
  avatar: string | null;
  verified: boolean;
  accountType: string | null;
  listingsCount: number;
};

function resolveCoverUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  // path relatif au bucket "listings"
  const base = process.env.SUPABASE_URL ?? "";
  if (!base) return null;
  return `${base}/storage/v1/object/public/listings/${raw.replace(/^\/+/, "")}`;
}

export const getListingSeo = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: uuid.parse(d.id) }))
  .handler(async ({ data }): Promise<ListingSeo | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("listings")
      .select(`id, title, description, price_fcfa, category_slug, subcategory_slug,
               country, city, cover_url, owner_id, published_at, status`)
      .eq("id", data.id)
      .eq("status", "active")
      .maybeSingle();
    if (error || !row) return null;

    let sellerName: string | null = null;
    let sellerVerified = false;
    let sellerType: string | null = null;
    if (row.owner_id) {
      const { data: prof } = await supabaseAdmin
        .from("public_profiles")
        .select("display_name, verified, account_type")
        .eq("id", row.owner_id)
        .maybeSingle();
      if (prof) {
        sellerName = prof.display_name ?? null;
        sellerVerified = !!prof.verified;
        sellerType = prof.account_type ?? null;
      }
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      price: Number(row.price_fcfa),
      category: row.category_slug,
      subCategory: row.subcategory_slug ?? null,
      country: row.country,
      city: row.city,
      cover: resolveCoverUrl(row.cover_url ?? null),
      ownerId: row.owner_id ?? null,
      sellerName,
      sellerVerified,
      sellerType,
      publishedAt: row.published_at ?? null,
    };
  });

export const getBoutiqueSeo = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: uuid.parse(d.id) }))
  .handler(async ({ data }): Promise<BoutiqueSeo | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: prof }, { count }] = await Promise.all([
      supabaseAdmin
        .from("public_profiles")
        .select("id, display_name, city, country, bio, avatar_url, verified, account_type")
        .eq("id", data.id)
        .maybeSingle(),
      supabaseAdmin
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", data.id)
        .eq("status", "active"),
    ]);
    if (!prof || !prof.id) return null;

    return {
      id: prof.id,
      displayName: prof.display_name ?? "Vendeur",
      city: prof.city ?? null,
      country: prof.country ?? null,
      bio: prof.bio ?? null,
      avatar: prof.avatar_url ?? null,
      verified: !!prof.verified,
      accountType: prof.account_type ?? null,
      listingsCount: count ?? 0,
    };
  });
