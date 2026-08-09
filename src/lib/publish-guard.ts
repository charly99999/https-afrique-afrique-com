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

/** Détecte les erreurs réseau transitoires (coupure 3G/4G, timeout, CDN). */
export function isNetworkError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err ?? "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("load failed") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("connection") ||
    msg.includes("aborted") ||
    msg.includes("fetch event") ||
    msg.includes("503") ||
    msg.includes("504")
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Exécute une écriture Supabase de façon résiliente :
 * - erreur d'authentification → rafraîchit la session puis retente
 * - erreur réseau transitoire → retente avec backoff exponentiel (jusqu'à 4 essais)
 * Fonctionne à l'échelle : aucun état serveur, uniquement des reprises côté client.
 */
export async function withAuthRetry<T>(run: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await run();
    } catch (err) {
      lastErr = err;
      if (isAuthError(err)) {
        const refreshed = await supabase.auth.refreshSession();
        if (refreshed.error || !refreshed.data.session) throw err;
        continue;
      }
      if (!isNetworkError(err) || i === attempts - 1) throw err;
      // Attente progressive : 0,8s → 1,6s → 3,2s (laisse le réseau mobile revenir)
      await sleep(800 * 2 ** i);
    }
  }
  throw lastErr;
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
