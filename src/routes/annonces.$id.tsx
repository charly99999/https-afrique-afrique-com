import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Flag, Rocket, ShieldCheck, MapPin, Heart } from "lucide-react";
import { formatFcfa, getListing, LISTINGS } from "@/data/catalog";
import { MobileShell } from "@/components/MobileShell";
import { ListingCard } from "@/components/ListingCard";
import { ContactBar } from "@/components/ContactBar";
import { fetchListing, fetchPhotos, fetchSimilarListings, type DbListing } from "@/lib/listings-client";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/annonces/$id")({
  head: () => ({ meta: [{ title: "Annonce — Afrique-business" }] }),
  notFoundComponent: () => (
    <MobileShell>
      <div className="px-6 py-20 text-center">
        <h1 className="font-display text-2xl italic">Annonce introuvable</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-brand-green">← Retour</Link>
      </div>
    </MobileShell>
  ),
  errorComponent: ({ error, reset }) => (
    <MobileShell>
      <div className="px-6 py-20 text-center">
        <h1 className="font-display text-2xl italic">Une erreur s'est produite</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded-xl bg-brand-green px-5 py-2 text-sm font-bold text-primary-foreground">Réessayer</button>
      </div>
    </MobileShell>
  ),
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = useParams({ from: "/annonces/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<DbListing | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [similar, setSimilar] = useState<DbListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id);
        if (!isUuid) {
          const demo = getListing(id);
          if (!cancelled) {
            setListing(demo ? ({ ...demo, ownerId: undefined, sellerPhone: undefined, sellerWhatsapp: undefined, isFavorite: false } as DbListing) : null);
            setPhotos(demo ? [demo.image] : []);
            setSimilar(demo ? (LISTINGS.filter((l) => l.id !== demo.id && l.category === demo.category).slice(0, 4) as unknown as DbListing[]) : []);
            setIsFav(false);
            setLoading(false);
          }
          return;
        }
        const l = await fetchListing(id, user?.id);
        if (cancelled) return;
        if (l) {
          setListing(l);
          setIsFav(l.isFavorite ?? false);
          const [ph, sim] = await Promise.all([
            fetchPhotos(id).catch(() => []),
            fetchSimilarListings(l, 4, user?.id).catch(() => []),
          ]);
          if (!cancelled) {
            setPhotos(ph);
            setSimilar(sim);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading listing:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  async function toggleFav() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!listing || busy) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(listing.id)) {
      toast.error("Les annonces de démonstration ne peuvent pas être ajoutées aux favoris.");
      return;
    }
    setBusy(true);
    try {
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listing.id);
        setIsFav(false);
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: user.id, listing_id: listing.id });
        if (error) throw error;
        setIsFav(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur favoris");
    } finally {
      setBusy(false);
    }
  }

  async function reportListing() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!listing || reporting) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(listing.id)) {
      toast.error("Le signalement n'est disponible que sur les annonces publiées.");
      return;
    }
    const reason = window.prompt("Pourquoi signaler cette annonce ?");
    if (!reason?.trim()) return;
    setReporting(true);
    try {
      await supabase.from("reports").insert({ listing_id: listing.id, reporter_id: user.id, reason: reason.trim() });
      toast.success("Merci, le signalement a été envoyé à la modération.");
    } catch (err) {
      toast.error("Erreur lors de l'envoi du signalement.");
    } finally {
      setReporting(false);
    }
  }

  async function startConversation() {
    if (!listing) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!listing.ownerId || listing.ownerId === user.id) return;
    navigate({ to: "/messages", search: { listing: listing.id, to: listing.ownerId } });
  }

  if (loading) {
    return <MobileShell><div className="p-10 text-center text-sm text-muted-foreground">Chargement…</div></MobileShell>;
  }
  if (!listing) {
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Annonce introuvable</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-brand-green">← Retour</Link>
        </div>
      </MobileShell>
    );
  }

  const cover = photos[0] ?? listing.image;

  return (
    <MobileShell>
      <div className="relative">
        <img src={cover} alt={listing.title} className="aspect-[4/5] w-full object-cover" />
        <Link to="/" aria-label="Retour"
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {listing.boosted && <span className="pro-glow rounded-full bg-brand-gold px-3 py-1 text-[10px] font-extrabold uppercase">Boosté</span>}
          {listing.badge === "pro" && <span className="rounded-full bg-brand-green px-3 py-1 text-[10px] font-bold uppercase text-primary-foreground">Pro</span>}
          {listing.badge === "business" && <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase text-brand-gold">👑 Business</span>}
          <button onClick={toggleFav} aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="grid size-10 place-items-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur transition active:scale-95 disabled:opacity-50">
            <Heart className={`size-5 transition ${isFav ? "fill-destructive text-destructive" : ""}`} />
          </button>
        </div>
      </div>

      {photos.length > 1 && (
        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
          {photos.map((p) => (
            <img key={p} src={p} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
          ))}
        </div>
      )}

      <div className="px-5 pt-6">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand-green">
          {listing.subCategory ?? listing.category}
        </p>
        <h1 className="font-display text-2xl leading-tight">{listing.title}</h1>
        <p className="mt-3 font-mono text-2xl font-bold text-foreground">{formatFcfa(listing.price)}</p>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />{listing.city}<span className="mx-1">•</span>{listing.postedAt}
        </div>
      </div>

      <div className="mx-5 mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="grid size-12 place-items-center rounded-full bg-brand-green/10 font-display text-lg italic text-brand-green">
          {listing.seller[0]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{listing.seller}</p>
          <p className="text-[11px] text-muted-foreground">Voir la boutique →</p>
        </div>
        {listing.badge === "business" && <span className="rounded bg-foreground px-2 py-0.5 text-[9px] font-extrabold text-brand-gold">👑</span>}
        {listing.badge === "pro" && <span className="rounded bg-brand-green px-2 py-0.5 text-[9px] font-extrabold text-primary-foreground">PRO</span>}
      </div>

      <section className="mt-6 px-5">
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed">{listing.description}</p>
      </section>

      <section className="mx-5 mt-6 flex items-start gap-3 rounded-2xl bg-accent/30 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-green" />
        <div>
          <p className="text-xs font-bold">Conseils de sécurité</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Rencontrez le vendeur dans un lieu public, vérifiez le produit avant de payer, ne payez jamais à l'avance.
          </p>
        </div>
      </section>

      <Link to="/boost/$id" params={{ id: listing.id }}
        className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-brand-gold/50 bg-brand-gold/10 px-4 py-3 text-sm font-bold text-foreground">
        <Rocket className="size-4 text-brand-gold" /> Booster cette annonce
      </Link>

      <button type="button" onClick={reportListing} disabled={reporting}
        className="mx-5 mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50">
        <Flag className="size-3.5" /> Signaler cette annonce
      </button>

      {similar.length > 0 && (
        <section className="mt-10 px-5 pb-10">
          <h2 className="mb-4 flex items-center gap-3 text-sm font-extrabold uppercase tracking-tight">
            <span className="h-[2px] w-6 bg-brand-green" /> Annonces Similaires
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {similar.map((l) => <ListingCard key={l.id} listing={l as any} />)}
          </div>
        </section>
      )}

      <ContactBar listing={listing} onMessage={startConversation} isOwn={!!user && listing.ownerId === user.id} />
    </MobileShell>
  );
}
