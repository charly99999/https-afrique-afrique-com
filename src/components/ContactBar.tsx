import { Phone, MessageCircle, Lock, FileText } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { DbListing } from "@/lib/listings-client";
import { useAuth } from "@/hooks/use-auth";

export function ContactBar({
  listing,
  onMessage,
  isOwn,
  isB2B = false,
}: {
  listing: DbListing;
  onMessage: () => void;
  isOwn: boolean;
  isB2B?: boolean;
}) {
  const { user } = useAuth();

  const wrapperCls =
    "fixed inset-x-0 bottom-[88px] z-40 mx-auto w-full max-w-[440px] px-4 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl pb-[env(safe-area-inset-bottom)]";

  if (isOwn) {
    return (
      <div className={wrapperCls}>
        <div className="rounded-2xl bg-accent/40 p-3 text-center text-xs font-bold text-muted-foreground ring-1 ring-border">
          Ceci est votre annonce
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={wrapperCls}>
        <Link
          to="/auth"
          search={{ redirect: typeof window !== "undefined" ? window.location.pathname : "/" }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-green py-4 text-sm font-bold text-primary-foreground shadow-luxury"
        >
          <Lock className="size-4" /> Connectez-vous pour contacter le vendeur
        </Link>
      </div>
    );
  }

  const phone = listing.sellerPhone?.replace(/[^\d+]/g, "");
  const wa = listing.sellerWhatsapp?.replace(/[^\d]/g, "");
  const waMessage = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur Afrique-Business. Est-elle toujours disponible ?`
  );
  const devisMessage = encodeURIComponent(
    `Bonjour, je souhaite obtenir un devis pour votre prestation "${listing.title}" sur Afrique-Business. Merci de me recontacter.`
  );

  return (
    <div className={wrapperCls}>
      <div className="flex flex-col gap-2 rounded-2xl bg-background/95 p-2 shadow-luxury ring-1 ring-border backdrop-blur">
        {isB2B && wa && (
          <a
            href={`https://wa.me/${wa}?text=${devisMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-gold py-3.5 text-sm font-extrabold text-foreground"
          >
            <FileText className="size-4" /> Demander un devis
          </a>
        )}
        <div className="flex gap-2">
          {wa ? (
            <a
              href={`https://wa.me/${wa}?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 text-sm font-extrabold text-white"
            >
              <MessageCircle className="size-5" /> WhatsApp
            </a>
          ) : (
            <button onClick={onMessage} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-4 text-sm font-extrabold text-brand-gold">
              <MessageCircle className="size-5" /> Message
            </button>
          )}
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green py-4 text-sm font-extrabold text-primary-foreground"
            >
              <Phone className="size-5" /> Appeler le vendeur
            </a>
          ) : (
            <button onClick={onMessage} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green py-4 text-sm font-extrabold text-primary-foreground">
              <MessageCircle className="size-5" /> Contacter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
