import { useState, useCallback } from "react";
import { COUNTRIES } from "@/lib/currency";

export type GeoResult = {
  country: string | null;   // ISO code (SN, CI, CM…)
  city: string | null;
  lat: number;
  lng: number;
};

/** Distance Haversine en km */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Trouve la ville la plus proche du dataset COUNTRIES (approximation par nom). */
function matchCityFromCountry(countryCode: string, hintCity: string | null): string | null {
  if (!hintCity) return null;
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return null;
  const normalized = hintCity.toLowerCase();
  const exact = country.cities.find((c) => c.toLowerCase() === normalized);
  if (exact) return exact;
  const partial = country.cities.find((c) =>
    normalized.includes(c.toLowerCase()) || c.toLowerCase().includes(normalized),
  );
  return partial ?? hintCity;
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeoResult | null>(null);

  const detect = useCallback(async (): Promise<GeoResult | null> => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Géolocalisation non disponible");
      return null;
    }
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60_000,
        });
      });
      const { latitude: lat, longitude: lng } = pos.coords;

      // Reverse geocode via Nominatim (gratuit, sans clé)
      let country: string | null = null;
      let city: string | null = null;
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fr`,
          { headers: { "Accept": "application/json" } },
        );
        if (r.ok) {
          const j = await r.json();
          country = (j?.address?.country_code as string | undefined)?.toUpperCase() ?? null;
          city =
            j?.address?.city ??
            j?.address?.town ??
            j?.address?.village ??
            j?.address?.municipality ??
            j?.address?.county ??
            null;
        }
      } catch {
        // ignore — on retourne au moins lat/lng
      }

      const matchedCity = country ? matchCityFromCountry(country, city) : city;
      const out: GeoResult = { country, city: matchedCity, lat, lng };
      setResult(out);
      return out;
    } catch (e: unknown) {
      const msg = e instanceof GeolocationPositionError
        ? (e.code === 1 ? "Autorisez la géolocalisation" : "Position indisponible")
        : (e instanceof Error ? e.message : "Erreur");
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { detect, loading, error, result };
}
