// Publication automatique sur la Page Facebook d'Afrique-business via Meta Graph API.
// Server-only : utilise FACEBOOK_PAGE_ID + FACEBOOK_PAGE_ACCESS_TOKEN.
// Le token doit être un "Page Access Token" longue durée avec la permission pages_manage_posts.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GRAPH_VERSION = "v21.0";
const SITE_URL = "https://afrique-afrique.com";

function formatFcfa(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n).replaceAll(",", ".") + " FCFA";
}

async function resolvePublicImageUrl(coverUrl: string | null): Promise<string | null> {
  if (!coverUrl) return null;
  if (coverUrl.startsWith("http")) return coverUrl;
  // chemin storage privé -> signer une URL temporaire (7 jours)
  const { data } = await supabaseAdmin.storage.from("listings").createSignedUrl(coverUrl, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export async function postBoostedListingToFacebook(listingId: string): Promise<{ ok: boolean; error?: string; postId?: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) {
    return { ok: false, error: "Facebook non configuré (FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN manquants)" };
  }

  const { data: listing, error } = await supabaseAdmin
    .from("listings")
    .select("id, title, price_fcfa, cover_url, city, country")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !listing) return { ok: false, error: "Annonce introuvable" };

  const link = `${SITE_URL}/annonces/${listing.id}`;
  const message = `🚀 NOUVELLE ANNONCE BOOSTÉE\n\n${listing.title}\n💰 ${formatFcfa(Number(listing.price_fcfa))}\n📍 ${listing.city}, ${listing.country}\n\n👉 ${link}`;

  const imageUrl = await resolvePublicImageUrl(listing.cover_url);

  try {
    // Si on a une image publique : /photos avec url + caption (post photo + lien dans la légende)
    // Sinon : /feed avec message + link
    let endpoint: string;
    let body: Record<string, string>;
    if (imageUrl) {
      endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`;
      body = { url: imageUrl, caption: message, access_token: token };
    } else {
      endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`;
      body = { message, link, access_token: token };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    });
    const json = (await res.json()) as { id?: string; post_id?: string; error?: { message?: string } };
    if (!res.ok || json.error) {
      return { ok: false, error: json.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, postId: json.post_id ?? json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
