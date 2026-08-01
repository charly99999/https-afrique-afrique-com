import { Gift, X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "afb-promo-banner-dismissed-at";
const TTL_MS = 24 * 3600 * 1000;

export function PromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(KEY);
    const ts = raw ? Number(raw) : 0;
    setVisible(!ts || Date.now() - ts > TTL_MS);
  }, []);

  if (!visible) return null;

  function dismiss() {
    try { window.localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ }
    setVisible(false);
  }

  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-2xl gradient-warm text-primary-foreground shadow-luxury ring-1 ring-brand-green/40">
      <div className="relative px-4 py-3.5 pr-10">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer la bannière"
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
        >
          <X className="size-4" />
        </button>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-white/15">
            <Gift className="size-4" />
          </span>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide">🎉 Application 100% gratuite</p>
            <p className="mt-1 text-[13px] font-medium leading-snug opacity-95">
              Toutes les fonctionnalités <span className="font-extrabold">Business</span> (annonces illimitées, boosts permanents, badge premium) sont offertes à tous pendant <span className="font-extrabold">4 mois</span>. Profitez-en !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
