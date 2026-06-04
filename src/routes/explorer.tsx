import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/explorer")({
  head: () => ({ meta: [{ title: "Explorer — Afrique-business" }] }),
  component: () => <StubPage title="Recherche avancée" subtitle="Filtres pays, ville, prix, catégorie." />,
});

export function StubPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <MobileShell>
      <div className="px-6 pb-10 pt-10 text-center">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-3xl bg-accent/40 text-brand-green">
          <Construction className="size-8" />
        </div>
        <h1 className="font-display text-3xl italic">{title}</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">{subtitle}</p>
        <p className="mt-2 text-xs text-muted-foreground">Disponible dans la prochaine itération.</p>
        <Link to="/" className="mt-8 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">
          ← Retour à l'accueil
        </Link>
      </div>
    </MobileShell>
  );
}
