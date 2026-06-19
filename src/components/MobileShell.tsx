import { Link, useRouter } from "@tanstack/react-router";
import { Home, Heart, Plus, MessageCircle, User } from "lucide-react";
import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = router.state.location.pathname;
  const isActive = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto min-h-screen w-full max-w-[440px] bg-white pb-28 shadow-xl ring-1 ring-black/5 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 border-t border-slate-200 bg-white px-6 pb-5 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
        <div className="flex items-end justify-between">
          <NavItem to="/" icon={<Home className="size-5" />} label="Accueil" active={isActive("/")} />
          <NavItem to="/explorer" icon={<Heart className="size-5" />} label="Favoris" active={isActive("/explorer")} />
          <div className="-mt-8">
            <Link
              to="/publier"
              className="grid size-14 place-items-center rounded-full border-4 border-white bg-[#0B3D2E] text-white shadow-lg shadow-black/30 transition active:scale-95"
              aria-label="Publier une annonce"
            >
              <Plus className="size-7" strokeWidth={2.5} />
            </Link>
            <span className="mt-1 block text-center text-[10px] font-bold text-slate-900">Publier</span>
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
      className={`group relative flex flex-col items-center gap-1 transition ${active ? "text-brand-green" : "text-slate-400 hover:text-slate-600"}`}
    >
      {active && <span aria-hidden className="absolute -top-2 h-1 w-6 rounded-full bg-brand-gold" />}
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
}
