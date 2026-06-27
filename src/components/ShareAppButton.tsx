import { Share2 } from "lucide-react";
import { shareApp } from "@/lib/share";

export function ShareAppButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={shareApp}
      aria-label="Partager l'application"
      className={`grid size-10 place-items-center rounded-full bg-white/10 text-white transition active:scale-95 hover:bg-white/15 ${className}`}
    >
      <Share2 className="size-5" />
    </button>
  );
}
