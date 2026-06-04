import { supabase } from "@/integrations/supabase/client";

const LISTINGS_BUCKET = "listings";
const SIGNED_URL_TTL = 60 * 60;

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
        if (index >= 0) {
          return decodeURIComponent(url.pathname.slice(index + marker.length));
        }
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

export async function resolveListingImage(reference: string | null | undefined): Promise<string | null> {
  if (!reference) return null;

  const path = getBucketPath(reference);
  if (!path) return reference;

  const { data, error } = await supabase.storage.from(LISTINGS_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return error ? reference : data.signedUrl;
}

export async function resolveListingImages(references: Array<string | null | undefined>): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const entries = references
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ original: value, path: getBucketPath(value) }));

  const uniquePaths = Array.from(new Set(entries.map((entry) => entry.path).filter((path): path is string => Boolean(path))));

  if (uniquePaths.length > 0) {
    const { data, error } = await supabase.storage.from(LISTINGS_BUCKET).createSignedUrls(uniquePaths, SIGNED_URL_TTL);

    if (!error && data) {
      const byPath = new Map<string, string>();
      data.forEach((row, index) => {
        const path = uniquePaths[index];
        if (path && row?.signedUrl) byPath.set(path, row.signedUrl);
      });

      entries.forEach(({ original, path }) => {
        if (path && byPath.has(path)) {
          resolved.set(original, byPath.get(path)!);
        }
      });
    }
  }

  entries.forEach(({ original }) => {
    if (!resolved.has(original)) resolved.set(original, original);
  });

  return resolved;
}