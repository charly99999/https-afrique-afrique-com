import { supabase } from "@/integrations/supabase/client";

const LISTINGS_BUCKET = "listings";
// 7 jours : URLs signées longue durée + cache mémoire = ~1 signature/photo/session
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

// Cache mémoire global (path -> { url, expiresAt })
const urlCache = new Map<string, { url: string; expiresAt: number }>();

function getBucketPath(reference: string): string | null {
  const value = reference.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const markers = [
        `/storage/v1/object/public/${LISTINGS_BUCKET}/`,
        `/storage/v1/object/sign/${LISTINGS_BUCKET}/`,
        `/storage/v1/object/authenticated/${LISTINGS_BUCKET}/`,
      ];
      for (const marker of markers) {
        const index = url.pathname.indexOf(marker);
        if (index >= 0) return decodeURIComponent(url.pathname.slice(index + marker.length));
      }
      return null;
    } catch {
      return null;
    }
  }

  return value.startsWith(`${LISTINGS_BUCKET}/`)
    ? value.slice(LISTINGS_BUCKET.length + 1)
    : value;
}

function getCached(path: string): string | null {
  const hit = urlCache.get(path);
  if (hit && hit.expiresAt > Date.now()) return hit.url;
  if (hit) urlCache.delete(path);
  return null;
}

function setCached(path: string, url: string) {
  // Expire 1h avant le TTL réel pour éviter les URLs juste expirées
  urlCache.set(path, { url, expiresAt: Date.now() + (SIGNED_URL_TTL - 3600) * 1000 });
}

export async function resolveListingImage(reference: string | null | undefined): Promise<string | null> {
  if (!reference) return null;
  const path = getBucketPath(reference);
  if (!path) return reference;

  const cached = getCached(path);
  if (cached) return cached;

  const { data, error } = await supabase.storage.from(LISTINGS_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return reference;
  setCached(path, data.signedUrl);
  return data.signedUrl;
}

export async function resolveListingImages(references: Array<string | null | undefined>): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const entries = references
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ original: value, path: getBucketPath(value) }));

  // Sépare les paths déjà cachés des paths à signer
  const toSign: string[] = [];
  const pathToUrl = new Map<string, string>();
  for (const { path } of entries) {
    if (!path || pathToUrl.has(path)) continue;
    const cached = getCached(path);
    if (cached) pathToUrl.set(path, cached);
    else if (!toSign.includes(path)) toSign.push(path);
  }

  if (toSign.length > 0) {
    const { data, error } = await supabase.storage.from(LISTINGS_BUCKET).createSignedUrls(toSign, SIGNED_URL_TTL);
    if (!error && data) {
      data.forEach((row, index) => {
        const path = toSign[index];
        if (path && row?.signedUrl) {
          pathToUrl.set(path, row.signedUrl);
          setCached(path, row.signedUrl);
        }
      });
    }
  }

  entries.forEach(({ original, path }) => {
    if (path && pathToUrl.has(path)) resolved.set(original, pathToUrl.get(path)!);
    else resolved.set(original, original);
  });

  return resolved;
}

/** Supprime tous les fichiers d'une annonce dans le bucket Storage (best-effort). */
export async function deleteListingStorage(ownerId: string, listingId: string): Promise<void> {
  try {
    const folder = `${ownerId}/${listingId}`;
    const { data } = await supabase.storage.from(LISTINGS_BUCKET).list(folder);
    if (!data?.length) return;
    const paths = data.map((f) => `${folder}/${f.name}`);
    await supabase.storage.from(LISTINGS_BUCKET).remove(paths);
    // Vider le cache pour ces paths
    paths.forEach((p) => urlCache.delete(p));
  } catch (err) {
    console.warn("[deleteListingStorage] cleanup failed", err);
  }
}
