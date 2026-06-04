import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Plus, Rocket, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatFcfa } from "@/data/catalog";
import { toast } from "sonner";
import { resolveListingImages } from "@/lib/listing-images";

export const Route = createFileRoute("/mes-annonces")({
  head: () => ({ meta: [{ title: "Mes annonces — Afrique-business" }] }),
  component: MyListingsPage,
});

type Row = {
  id: string; title: string; price_fcfa: number; status: string;
  cover_url: string | null; created_at: string; boosted_until: string | null; views_count: number;
};

function MyListingsPage() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("listings")
      .select("id, title, price_fcfa, status, cover_url, created_at, boosted_until, views_count")
      .eq("owner_id", user.id).order("created_at", { ascending: false });
    const rows = (data as Row[] | null) ?? [];
    const resolved = await resolveListingImages(rows.map((row) => row.cover_url));
    setRows(rows.map((row) => ({ ...row, cover_url: row.cover_url ? (resolved.get(row.cover_url) ?? row.cover_url) : null })));
  }

  useEffect(() => { load(); }, [user]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Annonce supprimée"); load(); }
  }

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
      <header className="border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-brand-green)_8%,white),transparent)] px-5 pb-5 pt-6">
        <Link to="/profil" className="text-xs font-bold uppercase tracking-widest text-brand-green">← Profil</Link>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-green">Seller studio</p>
            <h1 className="mt-2 font-display text-3xl">Mes annonces</h1>
          </div>
          <Link to="/publier" className="flex items-center gap-1 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-primary-foreground">
            <Plus className="size-3.5" /> Nouvelle
          </Link>
        </div>
      </header>

      <div className="space-y-3 px-5 py-5">
        {rows === null ? <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p> : null}
        {rows && rows.length === 0 && (
          <p className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">Aucune annonce. Publiez votre première !</p>
        )}
        {rows?.map((r) => {
          const boosted = r.boosted_until && new Date(r.boosted_until) > new Date();
          return (
            <article key={r.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_10px_30px_-20px_color-mix(in_oklab,var(--color-brand-green)_35%,transparent)]">
              <Link to="/annonces/$id" params={{ id: r.id }} className="shrink-0">
                {r.cover_url
                  ? <img src={r.cover_url} alt="" className="size-20 rounded-xl object-cover" />
                  : <div className="size-20 rounded-xl bg-muted" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <Link to="/annonces/$id" params={{ id: r.id }} className="line-clamp-1 text-sm font-bold">{r.title}</Link>
                <p className="mt-0.5 font-mono text-sm">{formatFcfa(Number(r.price_fcfa))}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] uppercase">
                  <span className={`rounded px-1.5 py-0.5 font-bold ${r.status === "active" ? "bg-brand-green/15 text-brand-green" : "bg-muted text-muted-foreground"}`}>
                    {r.status}
                  </span>
                  {boosted && <span className="rounded bg-brand-gold/20 px-1.5 py-0.5 font-bold text-brand-gold">Boosté</span>}
                  <span className="text-muted-foreground">{r.views_count} vues</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Link to="/boost/$id" params={{ id: r.id }}
                    className="flex items-center gap-1 rounded-lg bg-brand-gold/10 px-2.5 py-1 text-[11px] font-bold text-brand-gold">
                    <Rocket className="size-3" /> Booster
                  </Link>
                  <button onClick={() => handleDelete(r.id)}
                    className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive">
                    <Trash2 className="size-3" /> Supprimer
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </MobileShell>
  );
}
