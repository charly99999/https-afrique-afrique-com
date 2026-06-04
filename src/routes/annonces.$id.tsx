import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Phone, MessageCircle, Flag, Rocket, ShieldCheck, MapPin } from "lucide-react";
import { getListing, formatFcfa, LISTINGS } from "@/data/catalog";
import { MobileShell } from "@/components/MobileShell";
import { ListingCard } from "@/components/ListingCard";

export const Route = createFileRoute("/annonces/$id")({
  loader: ({ params }) => {
    const listing = getListing(params.id);
    if (!listing) throw notFound();
    return { listing };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.listing.title} — Afrique-business` },
          { name: "description", content: loaderData.listing.description.slice(0, 155) },
          { property: "og:title", content: loaderData.listing.title },
          { property: "og:description", content: loaderData.listing.description.slice(0, 155) },
          { property: "og:image", content: loaderData.listing.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <MobileShell>
      <div className="px-6 py-20 text-center">
        <h1 className="font-display text-2xl italic">Annonce introuvable</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-brand-green">
          ← Retour à l'accueil
        </Link>
      </div>
    </MobileShell>
  ),
  errorComponent: ({ error, reset }) => (
    <MobileShell>
      <div className="px-6 py-20 text-center">
        <h1 className="font-display text-2xl italic">Une erreur s'est produite</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded-xl bg-brand-green px-5 py-2 text-sm font-bold text-primary-foreground">
          Réessayer
        </button>
      </div>
    </MobileShell>
  ),
  component: ListingDetail,
});

function ListingDetail() {
  const { listing } = Route.useLoaderData();
  const similar = LISTINGS.filter((l) => l.id !== listing.id && l.category === listing.category).slice(0, 4);

  return (
    <MobileShell>
      <div className="relative">
        <img
          src={listing.image}
          alt={listing.title}
          className="aspect-[4/5] w-full object-cover"
        />
        <Link
          to="/"
          aria-label="Retour"
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div className="absolute right-4 top-4 flex gap-2">
          {listing.boosted && (
            <span className="pro-glow rounded-full bg-brand-gold px-3 py-1 text-[10px] font-extrabold uppercase">
              Boosté
            </span>
          )}
          {listing.badge === "pro" && (
            <span className="rounded-full bg-brand-green px-3 py-1 text-[10px] font-bold uppercase text-primary-foreground">
              Pro
            </span>
          )}
          {listing.badge === "business" && (
            <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase text-brand-gold">
              👑 Business
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pt-6">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand-green">
          {listing.subCategory ?? listing.category}
        </p>
        <h1 className="font-display text-2xl leading-tight">{listing.title}</h1>
        <p className="mt-3 font-mono text-2xl font-bold text-foreground">
          {formatFcfa(listing.price)}
          {listing.priceSuffix && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">{listing.priceSuffix}</span>
          )}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {listing.city}
          <span className="mx-1">•</span>
          {listing.postedAt}
        </div>
      </div>

      {/* Seller */}
      <Link
        to="/"
        className="mx-5 mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
      >
        <div className="grid size-12 place-items-center rounded-full bg-brand-green/10 font-display text-lg italic text-brand-green">
          {listing.seller[0]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{listing.seller}</p>
          <p className="text-[11px] text-muted-foreground">Voir la boutique →</p>
        </div>
        {listing.badge === "business" && (
          <span className="rounded bg-foreground px-2 py-0.5 text-[9px] font-extrabold text-brand-gold">👑</span>
        )}
        {listing.badge === "pro" && (
          <span className="rounded bg-brand-green px-2 py-0.5 text-[9px] font-extrabold text-primary-foreground">PRO</span>
        )}
      </Link>

      {/* Description */}
      <section className="mt-6 px-5">
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Description
        </h2>
        <p className="whitespace-pre-line text-sm leading-relaxed">{listing.description}</p>
      </section>

      {/* Safety */}
      <section className="mx-5 mt-6 flex items-start gap-3 rounded-2xl bg-accent/30 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-green" />
        <div>
          <p className="text-xs font-bold">Conseils de sécurité</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Rencontrez le vendeur dans un lieu public, vérifiez le produit avant de payer, ne payez jamais à l'avance.
          </p>
        </div>
      </section>

      {/* Boost CTA */}
      <Link
        to="/boost/$id"
        params={{ id: listing.id }}
        className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-brand-gold/50 bg-brand-gold/10 px-4 py-3 text-sm font-bold text-foreground"
      >
        <Rocket className="size-4 text-brand-gold" />
        Booster cette annonce
      </Link>

      {/* Report */}
      <button
        type="button"
        className="mx-5 mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive"
      >
        <Flag className="size-3.5" />
        Signaler cette annonce
      </button>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-10 px-5">
          <h2 className="mb-4 flex items-center gap-3 text-sm font-extrabold uppercase tracking-tight">
            <span className="h-[2px] w-6 bg-brand-green" />
            Annonces Similaires
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-[88px] z-40 mx-auto max-w-[440px] px-5">
        <div className="flex gap-2 rounded-2xl bg-background/95 p-2 shadow-soft ring-1 ring-border backdrop-blur">
          <a
            href="tel:+2250000000000"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-primary-foreground"
          >
            <Phone className="size-4" /> Appeler
          </a>
          <a
            href="https://wa.me/2250000000000"
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-bold text-brand-gold"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        </div>
      </div>
    </MobileShell>
  );
}
