import { Link } from "@tanstack/react-router";
import { Heart, BadgeCheck } from "lucide-react";
import type { Listing } from "@/data/catalog";
import { formatFcfa } from "@/data/catalog";

export function ListingCard({ listing }: { listing: Listing }) {
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
          aria-label="Ajouter aux favoris"
          onClick={(e) => e.preventDefault()}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 text-brand-green shadow-sm backdrop-blur transition hover:bg-background"
        >
          <Heart className="size-4" />
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
      </div>
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-green">
        {listing.subCategory ?? listing.category}
      </p>
      <h4 className="line-clamp-1 text-sm font-bold">{listing.title}</h4>
      <p className="mt-1 font-mono text-sm font-bold text-foreground">
        {formatFcfa(listing.price)}
        {listing.priceSuffix && (
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">{listing.priceSuffix}</span>
        )}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {listing.city} • {listing.postedAt}
      </p>
    </Link>
  );
}

export function BoostedCard({ listing }: { listing: Listing }) {
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
