import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, Phone, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — Afrique-business" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const target = redirect && redirect.startsWith("/") ? redirect : "/profil";
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName, phone },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Compte créé. Vous êtes connecté.");
          navigate({ to: target });
        } else {
          toast.success("Compte créé. Vérifiez votre e-mail pour confirmer votre compte.");
          setMode("signin");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie");
        navigate({ to: target });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(traduireErreur(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 pb-10 pt-6">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-brand-green">
          <ArrowLeft className="size-3.5" /> Retour
        </Link>

        <header className="mt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-brand-gold">
            Afrique-business
          </p>
          <h1 className="mt-1 font-display text-3xl italic leading-tight">
            {mode === "signin" ? "Bon retour parmi nous" : "Créez votre compte"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Connectez-vous pour publier et gérer vos annonces."
              : "Inscription gratuite. Aucune carte demandée."}
          </p>
        </header>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-lg py-2.5 transition ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg py-2.5 transition ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <>
              <Field icon={<UserIcon className="size-4" />} placeholder="Nom complet" value={displayName} onChange={setDisplayName} required />
              <Field icon={<Phone className="size-4" />} placeholder="Numéro WhatsApp (+225...)" value={phone} onChange={setPhone} type="tel" />
            </>
          )}
          <Field icon={<Mail className="size-4" />} placeholder="Adresse e-mail" value={email} onChange={setEmail} type="email" required />
          <Field icon={<Lock className="size-4" />} placeholder="Mot de passe (8+ caractères)" value={password} onChange={setPassword} type="password" required minLength={8} />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-brand-green py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </div>
    </main>
  );
}

function Field({
  icon, placeholder, value, onChange, type = "text", required, minLength,
}: {
  icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; minLength?: number;
}) {
  return (
    <label className="relative block">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-green/30"
      />
    </label>
  );
}

function traduireErreur(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("failed to fetch")) return "Connexion réseau impossible pour le moment. Réessayez dans quelques secondes.";
  if (m.includes("invalid login")) return "E-mail ou mot de passe incorrect";
  if (m.includes("already registered") || m.includes("user already")) return "Cette adresse est déjà inscrite";
  if (m.includes("password") && m.includes("pwned")) return "Mot de passe trop courant. Choisissez-en un autre.";
  if (m.includes("password")) return "Mot de passe invalide (8 caractères minimum)";
  if (m.includes("email")) return "Adresse e-mail invalide";
  return msg;
}
