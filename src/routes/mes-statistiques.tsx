import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Eye, Heart, MessageCircle, Rocket, Megaphone } from "lucide-react";
import { resolveListingImages } from "@/lib/listing-images";

export const Route = createFileRoute("/mes-statistiques")({
  head: () => ({ meta: [{ title: "Mes statistiques — Afrique-business" }] }),
  component: StatsPage,
});

type Stats = {
  listings: number;
  active: number;
  views: number;
  favorites: number;
  unreadMessages: number;
  activeBoosts: number;
};

function StatsPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topListings, setTopListings] = useState<{ id: string; title: string; views_count: number; cover_url: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: listings }, favCount, msgCount, boostCount] = await Promise.all([
        supabase.from("listings")
          .select("id, title, status, views_count, favorites_count, cover_url, boosted_until")
          .eq("owner_id", user.id),
        supabase.from("favorites").select("listing_id", { count: "exact", head: true })
          .in("listing_id",
            (await supabase.from("listings").select("id").eq("owner_id", user.id)).data?.map((l) => l.id) ?? []
          ),
        supabase.from("messages").select("id", { count: "exact", head: true })
          .eq("recipient_id", user.id).is("read_at", null),
        supabase.from("boosts").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).gt("expires_at", new Date().toISOString()),
      ]);
      if (cancelled) return;
      const ls = listings ?? [];
      const totalViews = ls.reduce((s, l) => s + (l.views_count ?? 0), 0);
      const active = ls.filter((l) => l.status === "active").length;
      setStats({
        listings: ls.length,
        active,
        views: totalViews,
        favorites: favCount.count ?? 0,
        unreadMessages: msgCount.count ?? 0,
        activeBoosts: boostCount.count ?? 0,
      });
      const top = [...ls].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 5);
      const resolved = await resolveListingImages(top.map((l) => l.cover_url));
      setTopListings(top.map((l) => ({
        id: l.id,
        title: l.title,
        views_count: l.views_count ?? 0,
        cover_url: l.cover_url ? (resolved.get(l.cover_url) ?? l.cover_url) : null,
      })));
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <MobileShell><div className="p-10 text-center text-sm text-muted-foreground">…</div></MobileShell>;
  if (!user) {
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Connexion requise</h1>
          <Link to="/auth" className="mt-6 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">Se connecter</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-brand-gold)_10%,white),transparent)] px-5 pb-5 pt-6">
        <Link to="/profil" className="text-xs font-bold uppercase tracking-widest text-brand-green">← Profil</Link>
        <h1 className="mt-3 font-display text-3xl">Mes statistiques</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance globale de votre activité.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 px-5 py-5">
        <Card icon={<Megaphone className="size-4" />} label="Annonces actives" value={`${stats?.active ?? "…"} / ${stats?.listings ?? "…"}`} />
        <Card icon={<Eye className="size-4" />} label="Vues totales" value={stats?.views ?? "…"} />
        <Card icon={<Heart className="size-4" />} label="Favoris reçus" value={stats?.favorites ?? "…"} />
        <Card icon={<MessageCircle className="size-4" />} label="Messages non lus" value={stats?.unreadMessages ?? "…"} />
        <Card icon={<Rocket className="size-4" />} label="Boosts actifs" value={stats?.activeBoosts ?? "…"} />
        <Card icon={<BarChart3 className="size-4" />} label="Moy. vues / annonce"
          value={stats && stats.listings > 0 ? Math.round(stats.views / stats.listings) : "…"} />
      </div>

      <section className="px-5 pb-10">
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Top annonces</h2>
        {topListings.length === 0 ? (
          <p className="rounded-2xl bg-muted py-8 text-center text-sm text-muted-foreground">Pas encore d'annonce.</p>
        ) : (
          <ul className="space-y-2">
            {topListings.map((l) => (
              <li key={l.id}>
                <Link to="/annonces/$id" params={{ id: l.id }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  {l.cover_url
                    ? <img src={l.cover_url} alt="" className="size-12 rounded-lg object-cover" />
                    : <div className="size-12 rounded-lg bg-muted" />}
                  <p className="line-clamp-1 flex-1 text-sm font-bold">{l.title}</p>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="size-3.5" /> {l.views_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MobileShell>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-green/10 text-brand-green">{icon}</span>
      <p className="mt-3 font-display text-2xl italic">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
