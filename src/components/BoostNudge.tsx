import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket, TrendingUp, Clock, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Lite = {
  id: string;
  title: string;
  views_count: number;
  boosted_until: string | null;
  published_at: string | null;
  created_at: string;
  status: string;
};

type Nudge = {
  key: string;
  listingId: string;
  title: string;
  message: string;
  cta: string;
  tone: "fresh" | "stagnant" | "expired" | "weekly";
  icon: typeof Rocket;
};

const DISMISS_KEY = "boost-nudges-dismissed-v1";
const DISMISS_TTL_HOURS = 24;

function loadDismissed(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as Record<string, number>;
    const cutoff = Date.now() - DISMISS_TTL_HOURS * 3600 * 1000;
    return Object.fromEntries(Object.entries(obj).filter(([, ts]) => ts > cutoff));
  } catch {
    return {};
  }
}

function saveDismissed(map: Record<string, number>) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

function buildNudges(rows: Lite[]): Nudge[] {
  const now = Date.now();
  const out: Nudge[] = [];
  const active = rows.filter((r) => r.status === "active");

  for (const r of active) {
    const published = r.published_at ? new Date(r.published_at).getTime() : new Date(r.created_at).getTime();
    const ageH = (now - published) / 3600_000;
    const boostedUntil = r.boosted_until ? new Date(r.boosted_until).getTime() : 0;
    const isBoosted = boostedUntil > now;
    const justExpired = boostedUntil > 0 && boostedUntil < now && now - boostedUntil < 7 * 24 * 3600_000;

    if (justExpired) {
      out.push({
        key: `expired:${r.id}`,
        listingId: r.id,
        title: "Votre boost vient de se terminer",
        message: `« ${r.title} » n'est plus mise en avant. Relancez-la pour garder son trafic.`,
        cta: "Re-booster",
        tone: "expired",
        icon: Clock,
      });
      continue;
    }
    if (isBoosted) continue;

    if (ageH < 24) {
      out.push({
        key: `fresh:${r.id}`,
        listingId: r.id,
        title: "Boostez votre nouvelle annonce 🚀",
        message: `« ${r.title} » vient d'être publiée. Un boost = jusqu'à 10× plus de vues les 7 premiers jours.`,
        cta: "Booster maintenant",
        tone: "fresh",
        icon: Sparkles,
      });
    } else if (ageH > 48 && r.views_count < 10) {
      out.push({
        key: `stagnant:${r.id}`,
        listingId: r.id,
        title: "Votre annonce mérite plus de vues",
        message: `« ${r.title} » a seulement ${r.views_count} vue${r.views_count > 1 ? "s" : ""}. Un boost la remet en tête de liste.`,
        cta: "La booster",
        tone: "stagnant",
        icon: TrendingUp,
      });
    }
  }

  // Weekly summary (only if user has ≥2 listings and none currently boosted)
  const anyBoosted = active.some((r) => r.boosted_until && new Date(r.boosted_until).getTime() > now);
  if (active.length >= 2 && !anyBoosted) {
    out.push({
      key: "weekly:summary",
      listingId: active[0].id,
      title: `Offre de la semaine — ${active.length} annonces sans boost`,
      message: "Boostez vos annonces ensemble et multipliez vos contacts WhatsApp cette semaine.",
      cta: "Voir mes annonces",
      tone: "weekly",
      icon: Rocket,
    });
  }

  return out.slice(0, 3);
}

const TONE_STYLES: Record<Nudge["tone"], string> = {
  fresh: "from-brand-green/15 via-white to-brand-gold/10 border-brand-green/30",
  stagnant: "from-brand-gold/20 via-white to-brand-green/10 border-brand-gold/40",
  expired: "from-rose-100 via-white to-brand-gold/10 border-rose-200",
  weekly: "from-brand-green/10 via-white to-brand-green/5 border-brand-green/20",
};

export function BoostNudge({ variant = "stack" }: { variant?: "stack" | "single" }) {
  const { user } = useAuth();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, number>>({});

  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from("listings")
        .select("id, title, views_count, boosted_until, published_at, created_at, status")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (cancelled) return;
      setNudges(buildNudges((data as Lite[]) ?? []));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;
  const visible = nudges.filter((n) => !dismissed[n.key]);
  if (visible.length === 0) return null;

  const shown = variant === "single" ? visible.slice(0, 1) : visible;

  function dismiss(key: string) {
    const next = { ...dismissed, [key]: Date.now() };
    setDismissed(next);
    saveDismissed(next);
  }

  return (
    <div className="space-y-2.5">
      {shown.map((n) => {
        const Icon = n.icon;
        return (
          <div
            key={n.key}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${TONE_STYLES[n.tone]} p-4 shadow-[0_10px_30px_-22px_color-mix(in_oklab,var(--color-brand-green)_50%,transparent)]`}
          >
            <button
              onClick={() => dismiss(n.key)}
              aria-label="Masquer"
              className="absolute right-2 top-2 rounded-full p-1 text-foreground/40 transition hover:bg-black/5 hover:text-foreground/70"
            >
              <X className="size-3.5" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm">
                <Icon className="size-5 text-brand-green" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold leading-tight">{n.title}</p>
                <p className="mt-1 text-xs leading-snug text-foreground/70">{n.message}</p>
                <Link
                  to="/boost/$id"
                  params={{ id: n.listingId }}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-green px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary-foreground shadow-sm transition active:scale-[0.98]"
                >
                  <Rocket className="size-3.5" /> {n.cta}
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
