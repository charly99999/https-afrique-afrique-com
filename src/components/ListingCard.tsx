import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, BadgeCheck, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Listing } from "@/data/catalog";
import { formatFcfa, isFreeCategory } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { DbListing } from "@/lib/listings-client";

type ListingItem = Listing | DbListing;

export function ListingCard({ listing }: { listing: ListingItem }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState((listing as DbListing).isFavorite ?? false);
  const [busy, setBusy] = useState(false);
  const isPersistedListing = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(listing.id);

  useEffect(() => {
    // If we have DbListing with isFavorite, we trust it on mount
    if ("isFavorite" in listing && listing.isFavorite !== undefined) {
      setIsFav(listing.isFavorite);
    } else if (user && isPersistedListing) {
      // Fallback only if not provided (N+1 scenario we want to avoid but keep for compatibility)
      let cancelled = false;
      supabase.from("favorites").select("listing_id")
        .eq("user_id", user.id).eq("listing_id", listing.id).maybeSingle()
        .then(({ data }) => { if (!cancelled) setIsFav(!!data); });
      return () => { cancelled = true; };
    } else {
      setIsFav(false);
    }
  }, [user, listing.id, (listing as DbListing).isFavorite, isPersistedListing]);

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!isPersistedListing) { toast.error("Les annonces de démonstration ne peuvent pas être ajoutées aux favoris."); return; }
    if (busy) return;
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

  return (
    <Link to="/annonces/$id" params={{ id: listing.id }} className="group flex flex-col">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-muted">
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <button
          type="button"
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={toggleFav}
          disabled={busy}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 text-brand-green shadow-sm backdrop-blur transition hover:bg-background disabled:opacity-60"
        >
          <Heart className={`size-4 transition ${isFav ? "fill-destructive text-destructive" : ""}`} />
        </button>
        {listing.badge === "pro" && (
          <span className="absolute bottom-2 left-2 rounded bg-brand-green px-2 py-0.5 text-[9px] font-extrabold uppercase text-primary-foreground shadow-sm">
            <BadgeCheck className="mr-0.5 inline size-2.5" /> Pro
          </span>
        )}
        {listing.badge === "business" && (
          <span className="absolute bottom-2 left-2 rounded bg-foreground px-2 py-0.5 text-[9px] font-extrabold uppercase text-brand-gold shadow-sm">
            👑 Business
          </span>
        )}
        {isFreeCategory(listing.category) && (
          <span className="absolute bottom-2 right-2 rounded-full bg-brand-green px-2 py-0.5 text-[9px] font-extrabold uppercase text-primary-foreground shadow-sm">
            ✨ Gratuit
          </span>
        )}
      </div>
      <div className="mb-0.5 flex items-center gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-brand-green">
          {listing.subCategory ?? listing.category}
        </p>
        {(listing as DbListing).verified && (
          <span title="Vendeur vérifié" className="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1 py-0.5 text-[9px] font-extrabold text-sky-600">
            <BadgeCheck className="size-2.5" /> Vérifié
          </span>
        )}
      </div>
      <h4 className="line-clamp-1 text-sm font-bold">{listing.title}</h4>
      <p className="mt-1 font-mono text-sm font-bold text-foreground">
        {isFreeCategory(listing.category) && (!listing.price || listing.price === 0)
          ? <span className="text-brand-green">Opportunité gratuite</span>
          : formatFcfa(listing.price)}
        {"priceSuffix" in listing && listing.priceSuffix && (
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">{listing.priceSuffix}</span>
        )}
      </p>

      <p className="mt-1 text-[10px] text-muted-foreground">
        {listing.city} • {listing.postedAt}
      </p>
      {(listing.badge === "pro" || listing.badge === "business") && (
        <span
          className="mt-2 inline-flex items-center justify-center gap-1 rounded-full bg-[#25D366] py-1.5 text-[11px] font-bold text-white"
        >
          <MessageCircle className="size-3" /> Contacter sur WhatsApp
        </span>
      )}
    </Link>
  );
}

export function BoostedCard({ listing }: { listing: ListingItem }) {
  return (
    <Link
      to="/annonces/$id"
      params={{ id: listing.id }}
      className="group block min-w-[280px]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          className="size-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="pro-glow rounded-full bg-brand-gold px-3 py-1 text-[10px] font-extrabold uppercase text-foreground">
            Boosté
          </span>
          {listing.badge === "pro" && (
            <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold uppercase text-white backdrop-blur-md">
              Pro
            </span>
          )}
          {listing.badge === "business" && (
            <span className="rounded-full bg-foreground/80 px-3 py-1 text-[10px] font-bold uppercase text-brand-gold backdrop-blur-md">
              👑 Business
            </span>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="absolute inset-x-5 bottom-5 text-white">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-80">{listing.city}</p>
          <h3 className="text-xl font-semibold leading-tight">{listing.title}</h3>
          <p className="mt-1 font-mono text-lg text-brand-gold">{formatFcfa(listing.price)}</p>
        </div>
      </div>
    </Link>
  );
}
