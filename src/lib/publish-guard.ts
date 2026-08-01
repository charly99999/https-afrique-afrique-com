import { supabase } from "@/integrations/supabase/client";

/**
 * Cause racine des "publications qui ne passent plus" :
 * le jeton d'accès stocké côté navigateur expire (ou son rafraîchissement échoue
 * silencieusement). L'utilisateur reste visuellement connecté, mais l'insertion
 * est rejetée par les règles de sécurité de la base (401 / RLS).
 *
 * ensureFreshSession() garantit un jeton valide AVANT toute écriture,
 * et rafraîchit de force s'il expire dans moins de 2 minutes.
 */
export async function ensureFreshSession(): Promise<{ ok: true; userId: string } | { ok: false; reason: string }> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { ok: false, reason: "Session illisible. Reconnectez-vous." };

    let session = data.session;
    const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
    const needsRefresh = !session || expiresAt - Date.now() < 120_000;

    if (needsRefresh) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session) {
        return { ok: false, reason: "Votre session a expiré. Reconnectez-vous pour publier." };
      }
      session = refreshed.data.session;
    }

    if (!session?.user?.id) return { ok: false, reason: "Vous n'êtes plus connecté." };
    return { ok: true, userId: session.user.id };
  } catch {
    return { ok: false, reason: "Connexion au serveur impossible. Réessayez." };
  }
}

/** Détecte les erreurs liées à un jeton expiré / invalide. */
export function isAuthError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err ?? "").toLowerCase();
  const code = String((err as { code?: string })?.code ?? "");
  return (
    code === "PGRST301" ||
    code === "42501" ||
    msg.includes("jwt") ||
    msg.includes("token") ||
    msg.includes("row-level security") ||
    msg.includes("unauthorized")
  );
}

/**
 * Exécute une écriture Supabase, et en cas d'erreur d'authentification,
 * rafraîchit la session puis retente une seule fois.
 */
export async function withAuthRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!isAuthError(err)) throw err;
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) throw err;
    return await run();
  }
}

/** Journalise un échec de publication (best effort, jamais bloquant). */
export async function logPublishError(params: {
  userId?: string | null;
  listingId?: string | null;
  step: string;
  error: unknown;
  context?: Record<string, unknown>;
}) {
  try {
    const e = params.error as { message?: string; code?: string } | undefined;
    await supabase.from("publish_errors").insert({
      user_id: params.userId ?? null,
      listing_id: params.listingId ?? null,
      step: params.step,
      error_code: e?.code ?? null,
      message: String(e?.message ?? params.error ?? "erreur inconnue").slice(0, 1000),
      context: (params.context ?? {}) as never,
    });
  } catch {
    /* la journalisation ne doit jamais casser la publication */
  }
  // Trace console pour le monitoring temps réel
  console.error(`[publication:${params.step}]`, params.error);
}
