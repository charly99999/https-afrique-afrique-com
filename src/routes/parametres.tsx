import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, LogOut, Trash2, MessageCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — Afrique-business" }] }),
  component: ParametresPage,
});

function ParametresPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    whatsapp: "",
    city: "",
    country: "CI",
    bio: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    (async () => {
      const [{ data, error }, { data: contact }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name,city,country,bio")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.rpc("get_my_contact"),
      ]);
      const c = Array.isArray(contact) ? contact[0] : contact;
      if (error) {
        toast.error("Impossible de charger le profil");
      } else if (data) {
        setForm({
          display_name: data.display_name ?? "",
          phone: c?.phone ?? "",
          whatsapp: c?.whatsapp ?? "",
          city: data.city ?? "",
          country: (data.country as string) ?? "CI",
          bio: data.bio ?? "",
        });
      }
      setLoadingProfile(false);
    })();

  }, [user, loading, navigate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        city: form.city.trim() || null,
        country: form.country as never,
        bio: form.bio.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Paramètres enregistrés");
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else {
      toast.success("Déconnecté");
      navigate({ to: "/" });
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Email de réinitialisation envoyé");
  }

  if (loading || loadingProfile) {
    return (
      <MobileShell>
        <div className="px-5 pt-6 text-sm text-muted-foreground">Chargement…</div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-5 pt-6 pb-10">
        <div className="flex items-center gap-3">
          <Link
            to="/profil"
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted"
            aria-label="Retour"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="font-display text-2xl italic">Paramètres</h1>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <Field
            label="Nom affiché"
            value={form.display_name}
            onChange={(v) => setForm((f) => ({ ...f, display_name: v }))}
            placeholder="Votre nom ou marque"
          />
          <Field
            label="Téléphone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+225 00 00 00 00"
            type="tel"
          />
          <Field
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
            placeholder="+225 00 00 00 00"
            type="tel"
          />
          <Field
            label="Ville"
            value={form.city}
            onChange={(v) => setForm((f) => ({ ...f, city: v }))}
            placeholder="Abidjan"
          />
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pays
            </label>
            <select
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="CI">Côte d'Ivoire</option>
              <option value="SN">Sénégal</option>
              <option value="ML">Mali</option>
              <option value="BF">Burkina Faso</option>
              <option value="TG">Togo</option>
              <option value="BJ">Bénin</option>
              <option value="GN">Guinée</option>
              <option value="CM">Cameroun</option>
              <option value="GA">Gabon</option>
              <option value="CG">Congo</option>
              <option value="CD">RD Congo</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Présentez-vous en quelques lignes"
              rows={4}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            <Save className="size-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        <div className="mt-8 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Compte
          </p>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <Link
            to="/kyc"
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-muted"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-brand-green/10 text-brand-green">
              <ShieldCheck className="size-4" />
            </span>
            <span className="flex-1">Vérifier mon identité</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <button
            type="button"
            onClick={handlePasswordReset}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-muted"
          >
            <span className="flex-1">Réinitialiser le mot de passe</span>
            <span className="text-muted-foreground">→</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground hover:bg-muted"
          >
            <LogOut className="size-4" /> Se déconnecter
          </button>
          <button
            type="button"
            onClick={() =>
              toast.info("Contactez le support pour supprimer votre compte.")
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm font-bold text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="size-4" /> Supprimer mon compte
          </button>
        </div>

        <div className="mt-8 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Aide & Support
          </p>
          <a
            href="https://wa.me/2250565242349"
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition hover:bg-muted"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-muted text-brand-green">
              <MessageCircle className="size-4" />
            </span>
            <span className="flex-1">Contacter le support WhatsApp</span>
            <span className="text-muted-foreground">→</span>
          </a>
        </div>
      </div>
    </MobileShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
      />
    </div>
  );
}
