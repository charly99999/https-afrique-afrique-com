import { Link, useRouter } from "@tanstack/react-router";
import { Home, Heart, Plus, MessageCircle, User } from "lucide-react";
import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = router.state.location.pathname;
  const isActive = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));

  return (
    <div className="surface-warm min-h-screen bg-background">
      <main className="mx-auto min-h-screen w-full max-w-[440px] bg-card pb-28 shadow-luxury ring-1 ring-border md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 border-t border-border bg-card/95 px-6 pb-5 pt-2 shadow-[0_-8px_28px_-14px_rgb(92_42_20_/_0.35)] backdrop-blur md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
        <div className="flex items-end justify-between">
          <NavItem to="/" icon={<Home className="size-5" />} label="Accueil" active={isActive("/")} />
          <NavItem to="/explorer" icon={<Heart className="size-5" />} label="Favoris" active={isActive("/explorer")} />
          <div className="-mt-8">
            <Link
              to="/publier"
              className="gradient-warm grid size-14 place-items-center rounded-full border-4 border-card text-primary-foreground shadow-luxury transition active:scale-95"
              aria-label="Publier une annonce"
            >
              <Plus className="size-7" strokeWidth={2.5} />
            </Link>
            <span className="mt-1 block text-center text-[10px] font-bold text-foreground">Publier</span>
          </div>
          <NavItem to="/messages" icon={<MessageCircle className="size-5" />} label="Messages" active={isActive("/messages")} />
          <NavItem to="/profil" icon={<User className="size-5" />} label="Profil" active={isActive("/profil")} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, active }: { to: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`group relative flex flex-col items-center gap-1 px-2 py-1 transition-all duration-300 ${active ? "text-brand-green" : "text-muted-foreground hover:text-foreground"}`}
    >
      {active && (
        <span aria-hidden className="animate-nav-pop absolute -top-2 h-1 w-6 rounded-full bg-brand-gold" />
      )}
      <span className={`transition-transform duration-300 ${active ? "-translate-y-0.5 scale-110" : "group-active:scale-90"}`}>
        {icon}
      </span>
      <span className={`text-[10px] transition-all duration-300 ${active ? "font-extrabold" : "font-bold opacity-80"}`}>{label}</span>
    </Link>
  );
}

