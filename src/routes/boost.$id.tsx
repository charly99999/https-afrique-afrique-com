import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell } from "@/components/MobileShell";
import { Rocket, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startBoostPayment } from "@/lib/paydunya.functions";
import { BOOST_PRICES, type BoostDays } from "@/data/pricing";
import { resolveListingImages } from "@/lib/listing-images";

export const Route = createFileRoute("/boost/$id")({
  head: () => ({ meta: [{ title: "Booster mon annonce — Afrique-business" }] }),
  component: BoostPage,
});

const PACKS: { days: BoostDays }[] = [{ days: 1 }, { days: 3 }, { days: 7 }, { days: 30 }];

function BoostPage() {
  const { id } = useParams({ from: "/boost/$id" });
  const startBoost = useServerFn(startBoostPayment);
  const [loadingDays, setLoadingDays] = useState<BoostDays | null>(null);
  const [info, setInfo] = useState<{ title: string; city: string; cover: string | null } | null>(null);

  useEffect(() => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id);
    if (!isUuid) { setInfo({ title: "Annonce démo", city: "—", cover: null }); return; }
    supabase.from("listings").select("title, city, cover_url").eq("id", id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) return setInfo(null);
        const resolved = await resolveListingImages([data.cover_url]);
        setInfo({ title: data.title, city: data.city, cover: data.cover_url ? (resolved.get(data.cover_url) ?? data.cover_url) : null });
      });
  }, [id]);

  async function handleBoost(days: BoostDays) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)) {
      toast.error("Le boost n'est disponible que sur vos annonces réelles");
      return;
    }
    setLoadingDays(days);
    try {
      const res = await startBoost({ data: { listingId: id, days, origin: window.location.origin } });
      if (!res.ok || !res.invoiceUrl) throw new Error(res.error ?? "Erreur");
      window.location.href = res.invoiceUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setLoadingDays(null);
    }
  }

  return (
    <MobileShell>
      <header className="border-b border-border px-5 pb-5 pt-6">
        <Link to="/annonces/$id" params={{ id }} className="text-xs font-bold uppercase tracking-widest text-brand-green">
          ← Retour à l'annonce
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <Rocket className="size-6 text-brand-gold" />
          <h1 className="font-display text-2xl italic">Booster cette annonce</h1>
        </div>
      </header>

      <section className="px-5 py-6">
        {info && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            {info.cover ? <img src={info.cover} alt="" className="size-14 rounded-xl object-cover" /> : <div className="size-14 rounded-xl bg-muted" />}
            <div className="flex-1">
              <p className="line-clamp-1 text-sm font-bold">{info.title}</p>
              <p className="text-xs text-muted-foreground">{info.city}</p>
            </div>
          </div>
        )}

        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Choisissez votre formule boost
        </h2>

        <div className="space-y-3">
          {PACKS.map(({ days }) => {
            const price = BOOST_PRICES[days];
            const isLoading = loadingDays === days;
            return (
              <button key={days} type="button" disabled={loadingDays !== null} onClick={() => handleBoost(days)}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 text-left transition hover:border-brand-green disabled:opacity-60">
                <div className="grid size-12 place-items-center rounded-xl bg-brand-gold/10 font-mono text-lg font-bold text-brand-gold">
                  {days}j
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{days} {days > 1 ? "jours" : "jour"} en tête de liste</p>
                  <p className="text-xs text-muted-foreground">Badge Boosté, priorité dans les recherches</p>
                </div>
                <p className="font-mono text-base font-bold">
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : new Intl.NumberFormat("fr-FR").format(price).replaceAll(",", ".")}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">FCFA</span>
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-accent/30 p-4 text-xs text-muted-foreground">
          <p className="mb-2 font-bold text-foreground">Inclus dans chaque boost</p>
          <ul className="space-y-1">
            <li className="flex gap-2"><Check className="size-3.5 text-brand-green" /> Remontée en tête de liste</li>
            <li className="flex gap-2"><Check className="size-3.5 text-brand-green" /> Badge "Boosté" visible</li>
            <li className="flex gap-2"><Check className="size-3.5 text-brand-green" /> Fin automatique à expiration</li>
          </ul>
        </div>
      </section>
    </MobileShell>
  );
}
