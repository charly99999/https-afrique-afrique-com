import { createFileRoute } from "@tanstack/react-router";
import { sendEmptyPush } from "@/lib/web-push.server";

// Cron endpoint: runs every hour. Sends a single boost-nudge push per user/listing
// per 24h, for listings that match the boost-relance heuristics.
export const Route = createFileRoute("/api/public/hooks/push-boost-nudge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Light auth — apikey header must match Supabase anon key
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const got = request.headers.get("apikey");
        if (!expected || got !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Candidates: active listings, not currently boosted, not already nudged in last 24h.
        const sinceIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const fortyEightAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

        const { data: listings, error: lerr } = await supabaseAdmin
          .from("listings")
          .select("id, owner_id, title, created_at, views_count, boosted_until")
          .eq("status", "active")
          .or(`boosted_until.is.null,boosted_until.lt.${new Date().toISOString()}`)
          .limit(500);
        if (lerr) return new Response(JSON.stringify({ error: lerr.message }), { status: 500 });

        type Cand = { user_id: string; listing_id: string; title: string; kind: string };
        const candidates: Cand[] = [];
        for (const l of listings ?? []) {
          const created = new Date(l.created_at as string).getTime();
          const views = (l as any).views_count ?? 0;
          const boostedUntil = (l as any).boosted_until ? new Date((l as any).boosted_until).getTime() : 0;
          let kind: string | null = null;
          if (created > Date.parse(dayAgo)) kind = "new";
          else if (created < Date.parse(fortyEightAgo) && views < 10) kind = "stagnant";
          else if (boostedUntil && boostedUntil > Date.now() - 7 * 86400_000 && boostedUntil < Date.now()) kind = "expired";
          if (kind) candidates.push({ user_id: l.owner_id as string, listing_id: l.id as string, title: l.title as string, kind });
        }

        // Filter out users/listings already nudged in 24h
        const filtered: Cand[] = [];
        for (const c of candidates) {
          const { data: recent } = await supabaseAdmin
            .from("push_send_log")
            .select("id")
            .eq("user_id", c.user_id)
            .eq("listing_id", c.listing_id)
            .gte("sent_at", sinceIso)
            .limit(1);
          if (!recent || recent.length === 0) filtered.push(c);
        }

        // Group by user — one push per user per run
        const seenUser = new Set<string>();
        const toSend = filtered.filter((c) => (seenUser.has(c.user_id) ? false : (seenUser.add(c.user_id), true)));

        let sent = 0, failed = 0, removed = 0;
        for (const c of toSend) {
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, id")
            .eq("user_id", c.user_id);
          if (!subs || subs.length === 0) continue;

          let anyOk = false;
          for (const s of subs) {
            try {
              const r = await sendEmptyPush({ endpoint: s.endpoint as string });
              if (r.ok) { anyOk = true; sent++; }
              else if (r.gone) {
                await supabaseAdmin.from("push_subscriptions").delete().eq("id", (s as any).id);
                removed++;
              } else { failed++; }
            } catch { failed++; }
          }
          if (anyOk) {
            await supabaseAdmin.from("push_send_log").insert({
              user_id: c.user_id, listing_id: c.listing_id, kind: c.kind,
            });
          }
        }

        return new Response(JSON.stringify({ ok: true, candidates: candidates.length, sent, failed, removed }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
