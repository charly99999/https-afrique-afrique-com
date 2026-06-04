import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Settings, BarChart3, Store, CreditCard, Bell, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profil")({
  head: () => ({ meta: [{ title: "Mon profil — Afrique-business" }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else {
      toast.success("Déconnecté");
      navigate({ to: "/" });
    }
  }

  const initial = (user?.user_metadata?.display_name || user?.email || "?").charAt(0).toUpperCase();
  const name = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Visiteur";

  return (
    <MobileShell>
      <div className="px-5 pt-6">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-brand-green/10 font-display text-2xl italic text-brand-green">
            {initial}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{name}</p>
            <p className="text-xs text-muted-foreground">
              {user ? user.email : "Connectez-vous pour publier"}
            </p>
          </div>
        </div>

        {!loading && !user && (
          <Link
            to="/auth"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-primary-foreground"
          >
            <LogIn className="size-4" />
            Se connecter / S'inscrire
          </Link>
        )}

        <div className="mt-8 space-y-2">
          <Link to="/mes-annonces" className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition hover:bg-muted">
            <span className="grid size-8 place-items-center rounded-lg bg-muted text-brand-green"><Store className="size-4" /></span>
            <span className="flex-1">Mes annonces</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link to="/abonnements" className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition hover:bg-muted">
            <span className="grid size-8 place-items-center rounded-lg bg-muted text-brand-green"><CreditCard className="size-4" /></span>
            <span className="flex-1">Mon abonnement</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Row icon={<BarChart3 className="size-4" />} label="Mes statistiques" />
          <Row icon={<Bell className="size-4" />} label="Notifications" />
          <Row icon={<Settings className="size-4" />} label="Paramètres" />
        </div>

        <Link
          to="/abonnements"
          className="mt-8 block overflow-hidden rounded-2xl bg-foreground p-5 text-primary-foreground"
        >
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-gold">
            👑 Business
          </p>
          <h3 className="mt-1 font-display text-xl italic">Débloquez tout le potentiel</h3>
          <p className="mt-2 text-xs text-primary-foreground/70">
            Boutique avancée, catalogue, 3 boosts/mois offerts.
          </p>
        </Link>

        {user && (
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground hover:bg-muted"
          >
            <LogOut className="size-4" /> Se déconnecter
          </button>
        )}
      </div>
    </MobileShell>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition hover:bg-muted"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-muted text-brand-green">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-muted-foreground">→</span>
    </button>
  );
}
