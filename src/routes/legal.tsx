import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import type { ReactNode } from "react";

export function LegalLayout({ title, lastUpdate = "Mise à jour : 2025", children }: { title: string; lastUpdate?: string; children: ReactNode }) {
  return (
    <MobileShell>
      <header className="border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-brand-green)_8%,white),transparent)] px-5 pb-5 pt-6">
        <Link to="/plus" className="text-xs font-bold uppercase tracking-widest text-brand-green">← Plus</Link>
        <h1 className="mt-3 font-display text-3xl">{title}</h1>
        <p className="mt-1 text-[11px] text-muted-foreground">{lastUpdate}</p>
      </header>
      <article className="prose prose-sm max-w-none space-y-4 px-5 py-6 text-sm leading-relaxed text-foreground">
        {children}
      </article>
    </MobileShell>
  );
}

export const Route = createFileRoute("/legal")({
  component: () => (
    <MobileShell>
      <div className="px-6 py-10 text-center">
        <h1 className="font-display text-2xl">Informations légales</h1>
        <Link to="/plus" className="mt-4 inline-block text-sm text-brand-green underline">Retour</Link>
      </div>
    </MobileShell>
  ),
});
