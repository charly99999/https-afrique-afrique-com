import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Settings, Store, CreditCard, Bell, LogIn, LogOut, MoreHorizontal, UserCog, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { shareApp } from "@/lib/share";

export const Route = createFileRoute("/profil")({
  head: () => ({ meta: [{ title: "Mon profil — Afrique-business" }] }),
  component: ProfilPage,
});

const GOLD = "#D4AF37";
const DARK_GREEN = "#0B3D2E";

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
          {user && (
            <Link
              to="/profil/modifier"
              aria-label="Modifier mon profil"
              className="grid size-10 place-items-center rounded-full bg-brand-green/10 text-brand-green hover:bg-brand-green/15"
            >
              <UserCog className="size-5" />
            </Link>
          )}
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

        {/* BANNIÈRE ABONNEMENT */}
        <Link
          to="/abonnements"
          className="mt-6 block overflow-hidden rounded-2xl p-5 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${DARK_GREEN} 0%, #155e44 100%)` }}
        >
          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>
            ✨ Abonnements
          </p>
          <h3 className="mt-1 text-base font-extrabold">
            Vendez plus vite et gagnez plus grâce à nos abonnements
          </h3>
          <p className="mt-1 text-xs text-white/80">Gratuit, Pro ou Business — au choix.</p>
          <span
            className="mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-extrabold"
            style={{ backgroundColor: GOLD, color: DARK_GREEN }}
          >
            Découvrir
          </span>
        </Link>

        <div className="mt-6 space-y-2">
          <Link to="/mes-annonces" className="row-link">
            <span className="row-ico"><Store className="size-4" /></span>
            <span className="flex-1">Mes annonces</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link to="/mon-abonnement" className="row-link">
            <span className="row-ico"><CreditCard className="size-4" /></span>
            <span className="flex-1">Mon abonnement</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link to="/parametres" className="row-link">
            <span className="row-ico"><Settings className="size-4" /></span>
            <span className="flex-1">Paramètres</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link to="/messages" className="row-link">
            <span className="row-ico"><Bell className="size-4" /></span>
            <span className="flex-1">Notifications</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <button type="button" onClick={() => shareApp()} className="row-link w-full">
            <span className="row-ico"><Share2 className="size-4" /></span>
            <span className="flex-1 text-left">Partager l'application</span>
            <span className="text-muted-foreground">→</span>
          </button>
          <Link to="/plus" className="row-link">
            <span className="row-ico"><MoreHorizontal className="size-4" /></span>
            <span className="flex-1">Plus</span>
            <span className="text-muted-foreground">→</span>
          </Link>
        </div>

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

      <style>{`
        .row-link { display:flex; align-items:center; gap:0.75rem; border-radius:0.75rem; border:1px solid hsl(var(--border)); background:hsl(var(--card)); padding:0.75rem 1rem; font-size:0.875rem; font-weight:500; transition:background 0.15s; }
        .row-link:hover { background: hsl(var(--muted)); }
        .row-ico { display:grid; place-items:center; width:2rem; height:2rem; border-radius:0.5rem; background:hsl(var(--muted)); color: ${DARK_GREEN}; }
      `}</style>
    </MobileShell>
  );
}
