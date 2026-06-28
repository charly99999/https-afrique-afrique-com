import { Share2 } from "lucide-react";
import { shareApp, SHARE_TEXT_HOME } from "@/lib/share";

export function ShareAppButton({ className = "", text }: { className?: string; text?: string }) {
  return (
    <button
      type="button"
      onClick={() => shareApp(text ?? SHARE_TEXT_HOME)}
      aria-label="Partager l'application"
      className={`grid size-10 place-items-center rounded-full bg-white/10 text-white transition active:scale-95 hover:bg-white/15 ${className}`}
    >
      <Share2 className="size-5" />
    </button>
  );
}
