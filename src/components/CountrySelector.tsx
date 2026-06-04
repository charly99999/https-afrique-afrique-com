import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { COUNTRIES, type CountryCode } from "@/data/catalog";

export function CountrySelector({
  value,
  onChange,
}: {
  value: CountryCode;
  onChange: (c: CountryCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const country = COUNTRIES.find((c) => c.code === value)!;

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
          <ul className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover shadow-soft">
            {COUNTRIES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
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
        </>
      )}
    </div>
  );
}
