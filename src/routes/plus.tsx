import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useLiteMode } from "@/hooks/use-lite-mode";
import { shareApp } from "@/lib/share";
import {
  ImageOff, Share2, MessageCircle, Mail, FileText, ShieldCheck, ScrollText, BookOpen, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/plus")({
  head: () => ({ meta: [{ title: "Plus — Afrique-business" }] }),
  component: PlusPage,
});

function PlusPage() {
  const [lite, setLite] = useLiteMode();

  return (
    <MobileShell>
      <header className="border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-brand-green)_8%,white),transparent)] px-5 pb-5 pt-6">
        <Link to="/profil" className="text-xs font-bold uppercase tracking-widest text-brand-green">← Profil</Link>
        <h1 className="mt-3 font-display text-3xl">Plus</h1>
        <p className="mt-1 text-sm text-muted-foreground">Options, contact et informations légales.</p>
      </header>

      <section className="space-y-2 px-5 pt-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">Préférences</p>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="grid size-8 place-items-center rounded-lg bg-muted text-brand-green"><ImageOff className="size-4" /></span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Mode Lite</span>
            <span className="block text-[11px] text-muted-foreground">Désactive le chargement automatique des photos pour économiser vos données.</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={lite}
            onChange={(e) => setLite(e.target.checked)}
            className="relative h-6 w-11 cursor-pointer appearance-none rounded-full bg-slate-300 transition checked:bg-brand-green before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-white before:shadow before:transition checked:before:translate-x-5"
          />
        </label>
      </section>

      <section className="space-y-2 px-5 pt-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">Communauté</p>
        <button type="button" onClick={shareApp} className="row">
          <span className="ico"><Share2 className="size-4" /></span>
          <span className="flex-1 text-left">Inviter mes amis</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        <a href="https://wa.me/2250565242349" target="_blank" rel="noreferrer" className="row">
          <span className="ico" style={{ background: "rgba(37,211,102,0.12)", color: "#25D366" }}>
            <MessageCircle className="size-4" />
          </span>
          <span className="flex-1 text-left">Nous contacter sur WhatsApp</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </a>
        <a href="mailto:contact@afrique-afrique.com" className="row">
          <span className="ico"><Mail className="size-4" /></span>
          <span className="flex-1 text-left">Nous contacter par mail</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </a>
      </section>

      <section className="space-y-2 px-5 pb-10 pt-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">Informations légales</p>
        <Link to="/legal/cgu" className="row"><span className="ico"><FileText className="size-4" /></span><span className="flex-1">Conditions Générales d'Utilisation</span><ChevronRight className="size-4 text-muted-foreground" /></Link>
        <Link to="/legal/cgv" className="row"><span className="ico"><ScrollText className="size-4" /></span><span className="flex-1">Conditions Générales de Vente</span><ChevronRight className="size-4 text-muted-foreground" /></Link>
        <Link to="/legal/confidentialite" className="row"><span className="ico"><ShieldCheck className="size-4" /></span><span className="flex-1">Politique de Confidentialité</span><ChevronRight className="size-4 text-muted-foreground" /></Link>
        <Link to="/legal/regles" className="row"><span className="ico"><BookOpen className="size-4" /></span><span className="flex-1">Règles de diffusion</span><ChevronRight className="size-4 text-muted-foreground" /></Link>
        <Link to="/legal/securite" className="row"><span className="ico"><ShieldCheck className="size-4" /></span><span className="flex-1">Conseils de sécurité</span><ChevronRight className="size-4 text-muted-foreground" /></Link>
      </section>

      <style>{`
        .row { display:flex; align-items:center; gap:0.75rem; border-radius:0.75rem; border:1px solid hsl(var(--border)); background:hsl(var(--card)); padding:0.75rem 1rem; font-size:0.875rem; font-weight:500; width:100%; transition:background 0.15s; }
        .row:hover { background: hsl(var(--muted)); }
        .ico { display:grid; place-items:center; width:2rem; height:2rem; border-radius:0.5rem; background:hsl(var(--muted)); color:#0B3D2E; }
      `}</style>
    </MobileShell>
  );
}
