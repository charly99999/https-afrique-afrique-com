import { Smartphone } from "lucide-react";
import { COUNTRY_BY_CODE } from "@/lib/currency";

/**
 * Affiche les opérateurs Mobile Money disponibles dans le pays donné.
 * Sert d'indicateur visuel sur les pages de paiement (boost, abonnements).
 */
export function MobileMoneyBadges({ countryCode, className = "" }: { countryCode: string; className?: string }) {
  const country = COUNTRY_BY_CODE[countryCode];
  if (!country || country.mobileMoney.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Smartphone className="size-4 text-brand-green" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Paiement Mobile Money — {country.flag} {country.name}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {country.mobileMoney.map((op) => (
          <span
            key={op}
            className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green ring-1 ring-brand-green/20"
          >
            {op}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Devise locale : <span className="font-bold text-foreground">{country.currency}</span>
      </p>
    </div>
  );
}
