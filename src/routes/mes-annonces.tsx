import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Pencil, Plus, Rocket, Trash2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatFcfa } from "@/data/catalog";
import { toast } from "sonner";
import { deleteListingStorage, resolveListingImages } from "@/lib/listing-images";
import { BoostNudge } from "@/components/BoostNudge";
import { PushOptIn } from "@/components/PushOptIn";

export const Route = createFileRoute("/mes-annonces")({
  head: () => ({ meta: [{ title: "Mes annonces — Afrique-business" }] }),
  component: MyListingsPage,
});

type Row = {
  id: string; title: string; price_fcfa: number; status: string;
  cover_url: string | null; created_at: string; boosted_until: string | null; views_count: number;
};

type Boost = {
  id: string; listing_id: string; days: number; amount_fcfa: number;
  starts_at: string; expires_at: string;
  listing?: { title: string | null } | null;
};

type Purchase = {
  id: string; kind: string; amount_fcfa: number; status: string;
  completed_at: string | null; created_at: string;
  related_listing_id: string | null;
};

type MainTab = "annonces" | "boosts" | "achats";
type SubTab = "en-vente" | "vendues" | "expirees" | "rejetees";

function MyListingsPage() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [boosts, setBoosts] = useState<Boost[] | null>(null);
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [tab, setTab] = useState<MainTab>("annonces");
  const [sub, setSub] = useState<SubTab>("en-vente");

  async function loadListings() {
    if (!user) return;
    const { data } = await supabase.from("listings")
      .select("id, title, price_fcfa, status, cover_url, created_at, boosted_until, views_count")
      .eq("owner_id", user.id).order("created_at", { ascending: false });
    const rows = (data as Row[] | null) ?? [];
    const resolved = await resolveListingImages(rows.map((r) => r.cover_url));
    setRows(rows.map((r) => ({ ...r, cover_url: r.cover_url ? (resolved.get(r.cover_url) ?? r.cover_url) : null })));
  }

  async function loadBoosts() {
    if (!user) return;
    const { data } = await supabase
      .from("boosts")
      .select("id, listing_id, days, amount_fcfa, starts_at, expires_at, listing:listings(title)")
      .eq("user_id", user.id)
      .order("starts_at", { ascending: false });
    setBoosts((data as unknown as Boost[]) ?? []);
  }

  async function loadPurchases() {
    if (!user) return;
    const { data } = await supabase
      .from("payments")
      .select("id, kind, amount_fcfa, status, completed_at, created_at, related_listing_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPurchases((data as Purchase[] | null) ?? []);
  }

  useEffect(() => {
    loadListings();
    loadBoosts();
    loadPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleDelete(id: string) {
    if (!user) return;
    if (!confirm("Supprimer cette annonce ? Cette action est irréversible.")) return;
    await deleteListingStorage(user.id, id);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Annonce supprimée"); loadListings(); }
  }

  const counts = useMemo(() => {
    const list = rows ?? [];
    const now = new Date();
    return {
      "en-vente": list.filter((r) => r.status === "active").length,
      "vendues": list.filter((r) => r.status === "sold").length,
      "expirees": list.filter((r) => r.status === "expired" || (r.status === "active" && false /* placeholder */ )).length,
      "rejetees": list.filter((r) => r.status === "rejected").length,
      _now: now,
    } as const;
  }, [rows]);

  const subFiltered = useMemo(() => {
    const list = rows ?? [];
    switch (sub) {
      case "en-vente": return list.filter((r) => r.status === "active");
      case "vendues": return list.filter((r) => r.status === "sold");
      case "expirees": return list.filter((r) => r.status === "expired");
      case "rejetees": return list.filter((r) => r.status === "rejected");
    }
  }, [rows, sub]);

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
            <h1 className="mt-2 font-display text-3xl">Mes activités</h1>
          </div>
          <Link to="/publier" className="flex items-center gap-1 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-primary-foreground">
            <Plus className="size-3.5" /> Nouvelle
          </Link>
        </div>

        {/* MAIN TABS */}
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-xs font-bold">
          {(["annonces", "boosts", "achats"] as MainTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-2 py-2 capitalize transition ${tab === t ? "bg-card text-brand-gold shadow" : "text-muted-foreground"}`}
            >
              {t === "annonces" ? `Annonces (${rows?.length ?? 0})` : t === "boosts" ? `Boosts (${boosts?.length ?? 0})` : `Achats (${purchases?.length ?? 0})`}
            </button>
          ))}
        </div>
      </header>

      {tab === "annonces" && (
        <>
          <div className="px-5 pt-4">
            <PushOptIn />
            <BoostNudge />
          </div>

          {/* SUB TABS */}
          <div className="px-5 pt-4">
            <div className="flex gap-2 overflow-x-auto">
              {([
                ["en-vente", "En vente", counts["en-vente"]],
                ["vendues", "Vendues", counts["vendues"]],
                ["expirees", "Expirées", counts["expirees"]],
                ["rejetees", "Rejetées", counts["rejetees"]],
              ] as const).map(([key, label, n]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSub(key as SubTab)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${sub === key ? "border-brand-green bg-brand-green text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
                >
                  {label} <span className="ml-1 opacity-80">({n})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 px-5 py-5">
            {rows === null && <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>}
            {rows && subFiltered.length === 0 && (
              <p className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">Rien dans cette catégorie.</p>
            )}
            {subFiltered.map((r) => {
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
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link to="/annonces/$id/edit" params={{ id: r.id }}
                        className="flex items-center gap-1 rounded-lg bg-brand-green/10 px-2.5 py-1 text-[11px] font-bold text-brand-green">
                        <Pencil className="size-3" /> Modifier
                      </Link>
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
        </>
      )}

      {tab === "boosts" && (
        <div className="space-y-3 px-5 py-5">
          {boosts === null && <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>}
          {boosts && boosts.length === 0 && (
            <p className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">Aucun boost. Boostez vos annonces pour gagner en visibilité ✨</p>
          )}
          {boosts?.map((b) => {
            const active = new Date(b.expires_at) > new Date();
            return (
              <Link
                key={b.id}
                to="/annonces/$id"
                params={{ id: b.listing_id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-brand-gold/15 text-brand-gold">
                  <Rocket className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm font-bold">{b.listing?.title ?? "Annonce"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {b.days} jours • {formatFcfa(Number(b.amount_fcfa))}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {active ? `Expire le ${new Date(b.expires_at).toLocaleDateString("fr-FR")}` : `Terminé le ${new Date(b.expires_at).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase ${active ? "bg-brand-green/15 text-brand-green" : "bg-muted text-muted-foreground"}`}>
                  {active ? "Actif" : "Terminé"}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {tab === "achats" && (
        <div className="space-y-3 px-5 py-5">
          {purchases === null && <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>}
          {purchases && purchases.length === 0 && (
            <p className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">Aucun achat pour l'instant.</p>
          )}
          {purchases?.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-green/10 text-brand-green">
                <ShoppingBag className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold capitalize">{p.kind}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("fr-FR")} • {formatFcfa(Number(p.amount_fcfa))}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase ${p.status === "completed" ? "bg-brand-green/15 text-brand-green" : p.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
