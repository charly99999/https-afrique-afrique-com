import { Phone, MessageCircle, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { DbListing } from "@/lib/listings-client";
import { useAuth } from "@/hooks/use-auth";

export function ContactBar({
  listing,
  onMessage,
  isOwn,
}: {
  listing: DbListing;
  onMessage: () => void;
  isOwn: boolean;
}) {
  const { user } = useAuth();

  if (isOwn) {
    return (
      <div className="fixed inset-x-0 bottom-[88px] z-40 mx-auto max-w-[440px] px-5">
        <div className="rounded-2xl bg-accent/40 p-3 text-center text-xs font-bold text-muted-foreground ring-1 ring-border">
          Ceci est votre annonce
        </div>
      </div>
    );
  }

  // Visiteur non connecté : on indique clairement qu'il faut se connecter pour voir le contact
  if (!user) {
    return (
      <div className="fixed inset-x-0 bottom-[88px] z-40 mx-auto max-w-[440px] px-5">
        <Link
          to="/auth"
          search={{ redirect: typeof window !== "undefined" ? window.location.pathname : "/" }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-green py-3.5 text-sm font-bold text-primary-foreground shadow-soft"
        >
          <Lock className="size-4" /> Connectez-vous pour contacter le vendeur
        </Link>
      </div>
    );
  }

  const phone = listing.sellerPhone?.replace(/[^\d+]/g, "");
  const wa = listing.sellerWhatsapp?.replace(/[^\d]/g, "");
  const waMessage = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur Afrimarket. Est-elle toujours disponible ?`
  );

  return (
    <div className="fixed inset-x-0 bottom-[88px] z-40 mx-auto max-w-[440px] px-5">
      <div className="flex gap-2 rounded-2xl bg-background/95 p-2 shadow-soft ring-1 ring-border backdrop-blur">
        {phone ? (
          <a href={`tel:${phone}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-primary-foreground">
            <Phone className="size-4" /> Appeler
          </a>
        ) : (
          <button onClick={onMessage} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-primary-foreground">
            <MessageCircle className="size-4" /> Message
          </button>
        )}
        {wa ? (
          <a
            href={`https://wa.me/${wa}?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        ) : (
          <button onClick={onMessage} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-bold text-brand-gold">
            <MessageCircle className="size-4" /> Discuter
          </button>
        )}
      </div>
    </div>
  );
}
