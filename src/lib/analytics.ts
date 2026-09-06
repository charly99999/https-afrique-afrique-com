import { supabase } from "@/integrations/supabase/client";

export type ListingEventKind =
  | "view"
  | "click_phone"
  | "click_whatsapp"
  | "click_message"
  | "favorite"
  | "share";

const STORAGE_KEY = "ab_visitor_key";

/**
 * Identifiant anonyme et stable, stocké uniquement dans le navigateur.
 * Il sert à ne compter qu'une vue par visiteur et par jour — aucune donnée
 * personnelle n'est envoyée au serveur.
 */
export function getVisitorKey(): string {
  if (typeof window === "undefined") return "";
  try {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key || key.length < 8) {
      key = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  } catch {
    return "";
  }
}

/** Enregistre un événement d'annonce (best effort, jamais bloquant). */
export async function trackListingEvent(listingId: string, kind: ListingEventKind): Promise<void> {
  const visitorKey = getVisitorKey();
  if (!listingId || !visitorKey) return;
  try {
    await supabase.rpc("record_listing_event", {
      _listing_id: listingId,
      _kind: kind,
      _visitor_key: visitorKey,
    });
  } catch {
    /* les statistiques ne doivent jamais casser la navigation */
  }
}
