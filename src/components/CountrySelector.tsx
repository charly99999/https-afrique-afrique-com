import { useState } from "react";
import { ChevronDown, MapPin, Loader2, LocateFixed } from "lucide-react";
import { COUNTRIES, type CountryCode } from "@/data/catalog";
import { useGeolocation } from "@/hooks/use-geolocation";
import { setStoredCountry } from "@/lib/currency";

export function CountrySelector({
  value,
  onChange,
}: {
  value: CountryCode;
  onChange: (c: CountryCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const { detect, loading, error } = useGeolocation();
  const country = COUNTRIES.find((c) => c.code === value)!;

  async function handleDetect() {
    const r = await detect();
    if (r?.country) {
      const match = COUNTRIES.find((c) => c.code === r.country);
      if (match) {
        onChange(match.code as CountryCode);
        setStoredCountry(match.code);
        setOpen(false);
      }
    }
  }

  function handleSelect(code: CountryCode) {
    onChange(code);
    setStoredCountry(code);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold transition hover:bg-accent"
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="tracking-wide">{country.code}</span>
        <ChevronDown className="size-3" />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-popover shadow-soft">
            <button
              type="button"
              onClick={handleDetect}
              disabled={loading}
              className="flex w-full items-center gap-2 border-b border-border bg-brand-green/5 px-4 py-2.5 text-left text-xs font-bold text-brand-green transition hover:bg-brand-green/10 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <LocateFixed className="size-3.5" />}
              {loading ? "Détection…" : "Détecter ma position"}
            </button>
            {error && (
              <p className="border-b border-border bg-destructive/5 px-4 py-2 text-[11px] text-destructive">{error}</p>
            )}
            <ul className="max-h-72 overflow-y-auto">
              {COUNTRIES.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-muted ${
                      c.code === value ? "bg-accent/40 font-semibold" : ""
                    }`}
                  >
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span className="flex-1">{c.name}</span>
                    {c.code === value && <MapPin className="size-3.5 text-brand-green" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
