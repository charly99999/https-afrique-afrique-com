import { BadgeCheck, ShieldCheck, Shield } from "lucide-react";

export type SellerStats = {
  active_listings: number;
  member_since: string;
  verified: boolean;
  verified_at: string | null;
  trust_score: number;
};

function monthsSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 30)));
}

export function memberSinceLabel(iso: string): string {
  const m = monthsSince(iso);
  if (m < 1) return "Nouveau membre";
  if (m < 12) return `Membre depuis ${m} mois`;
  const y = Math.floor(m / 12);
  return `Membre depuis ${y} an${y > 1 ? "s" : ""}`;
}

export function trustLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 70) return { label: "Confiance élevée", color: "text-brand-green", bg: "bg-brand-green/15" };
  if (score >= 40) return { label: "Confiance moyenne", color: "text-brand-gold", bg: "bg-brand-gold/15" };
  return { label: "Nouveau vendeur", color: "text-muted-foreground", bg: "bg-muted" };
}

export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const sz = size === "md" ? "size-4" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-1 rounded bg-brand-green/15 px-2 py-0.5 text-[10px] font-extrabold text-brand-green">
      <BadgeCheck className={sz} /> Vérifié
    </span>
  );
}

export function TrustChip({ stats }: { stats: SellerStats }) {
  const level = trustLevel(stats.trust_score);
  const Icon = stats.trust_score >= 70 ? ShieldCheck : Shield;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${level.bg} ${level.color}`}>
      <Icon className="size-3" /> {level.label}
    </span>
  );
}
