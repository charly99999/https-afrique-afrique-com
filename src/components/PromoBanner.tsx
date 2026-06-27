import { Link } from "@tanstack/react-router";
import { Phone, X } from "lucide-react";
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
    <div className="mx-4 mt-4 overflow-hidden rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25 ring-1 ring-red-700/40">
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
            <Phone className="size-4" />
          </span>
          <p className="text-[13px] font-medium leading-snug">
            Pour toutes questions concernant nos offres ou toutes autres informations, contactez-nous :{" "}
            <a href="tel:+2250565242349" className="font-extrabold underline underline-offset-2">
              +225 0565242349
            </a>
          </p>
        </div>
        <Link
          to="/abonnements"
          className="mt-3 inline-block w-full rounded-xl bg-white py-2.5 text-center text-xs font-extrabold uppercase tracking-wider text-red-600 shadow-sm transition active:scale-[0.98]"
        >
          Découvrir nos offres
        </Link>
      </div>
    </div>
  );
}
