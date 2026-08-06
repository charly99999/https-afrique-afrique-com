import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Réinitialiser le mot de passe — Afrique-Business" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mot de passe : 6 caractères minimum");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour");
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 pb-10 pt-6">
        <Link to="/auth" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-brand-green">
          <ArrowLeft className="size-3.5" /> Retour
        </Link>
        <header className="mt-6">
          <h1 className="font-display text-3xl italic leading-tight">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ready
              ? "Choisissez un nouveau mot de passe (6 caractères minimum)."
              : "Vérification du lien de réinitialisation..."}
          </p>
        </header>

        {ready && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <PasswordField value={password} onChange={setPassword} placeholder="Nouveau mot de passe" />
            <PasswordField value={confirm} onChange={setConfirm} placeholder="Confirmer le mot de passe" />
            <button
              type="submit" disabled={loading}
              className="mt-2 w-full rounded-xl bg-brand-green py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "..." : "Mettre à jour"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="relative block">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock className="size-4" /></span>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={6}
        autoComplete="new-password"
        className="w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-12 text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </label>
  );
}

