import { Link, useRouter } from "@tanstack/react-router";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = router.state.location.pathname;
  const isActive = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));

  return (
    <div className="min-h-screen bg-[color-mix(in_oklab,var(--color-brand-green)_4%,var(--color-surface))]">
      <main className="mx-auto min-h-screen max-w-[440px] bg-background pb-28 shadow-[var(--shadow-luxury)] ring-1 ring-border/60">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 border-t border-border/70 bg-background/85 px-8 pb-6 pt-3 backdrop-blur-xl">

        <div className="flex items-center justify-between">
          <NavItem to="/" icon={<Home className="size-5" />} label="Accueil" active={isActive("/")} />
          <NavItem to="/explorer" icon={<Search className="size-5" />} label="Explorer" active={isActive("/explorer")} />
          <div className="-mt-10">
            <Link
              to="/publier"
              className="grid size-14 place-items-center rounded-full border-4 border-background bg-brand-green text-primary-foreground shadow-lg shadow-brand-green/30 transition active:scale-95"
              aria-label="Publier une annonce"
            >
              <Plus className="size-7" strokeWidth={2.5} />
            </Link>
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
      className={`flex flex-col items-center gap-1 transition ${
        active ? "text-brand-green" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
}
