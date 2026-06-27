import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone, KeyRound, BellRing, LogOut, Trash2, Save } from "lucide-react";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/profil/modifier")({
  head: () => ({ meta: [{ title: "Modifier mon profil — Afrique-business" }] }),
  component: EditProfilePage,
});

function EditProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, phone, whatsapp, email_opt_in").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setDisplayName(data.display_name ?? "");
        setPhone(data.phone ?? "");
        setWhatsapp(data.whatsapp ?? "");
        setEmailOptIn(data.email_opt_in ?? true);
      });
  }, [user]);

  if (loading) return <MobileShell><div className="p-10 text-center text-sm text-muted-foreground">…</div></MobileShell>;
  if (!user) {
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Connexion requise</h1>
          <Link to="/auth" className="mt-6 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">Se connecter</Link>
        </div>
      </MobileShell>
    );
  }

  async function saveContacts() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email_opt_in: emailOptIn,
    }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Profil mis à jour");
  }

  async function changePassword() {
    if (password.length < 8) { toast.error("Le mot de passe doit faire au moins 8 caractères."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Mot de passe modifié"); setPassword(""); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    navigate({ to: "/" });
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement votre compte ? Toutes vos annonces et données seront effacées. Cette action est irréversible.")) return;
    if (!confirm("Dernière confirmation : voulez-vous vraiment supprimer votre compte ?")) return;
    setBusy(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      toast.success("Compte supprimé");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileShell>
      <header className="border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-brand-green)_8%,white),transparent)] px-5 pb-5 pt-6">
        <Link to="/profil" className="text-xs font-bold uppercase tracking-widest text-brand-green">← Profil</Link>
        <h1 className="mt-3 font-display text-3xl">Modifier mon profil</h1>
      </header>

      <div className="space-y-6 px-5 py-6">
        {/* Contacts */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <Phone className="size-4 text-brand-green" /> Changer mes contacts
          </div>
          <div className="space-y-2">
            <Field label="Nom affiché" value={displayName} onChange={setDisplayName} placeholder="Votre nom" />
            <Field label="Téléphone" value={phone} onChange={setPhone} placeholder="+225 ..." />
            <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+225 ..." />
          </div>
          <button disabled={busy} onClick={saveContacts} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
            <Save className="size-3.5" /> Enregistrer
          </button>
        </section>

        {/* Password */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <KeyRound className="size-4 text-brand-green" /> Changer le mot de passe
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe (8+ caractères)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button disabled={busy} onClick={changePassword} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
            <Save className="size-3.5" /> Mettre à jour
          </button>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <BellRing className="size-4 text-brand-green" /> Gérer mes notifications
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Recevoir les emails promotionnels</span>
            <input
              type="checkbox"
              role="switch"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
              className="relative h-6 w-11 cursor-pointer appearance-none rounded-full bg-slate-300 transition checked:bg-brand-green before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-white before:shadow before:transition checked:before:translate-x-5"
            />
          </label>
          <button disabled={busy} onClick={saveContacts} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
            <Save className="size-3.5" /> Enregistrer
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pour activer les notifications push, allez dans <Link to="/mes-annonces" className="underline">Mes annonces</Link>.
          </p>
        </section>

        {/* Actions */}
        <section className="space-y-2">
          <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground hover:bg-muted">
            <LogOut className="size-4" /> Se déconnecter
          </button>
          <button disabled={busy} onClick={handleDelete} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 disabled:opacity-60">
            <Trash2 className="size-4" /> Supprimer le compte
          </button>
        </section>
      </div>
    </MobileShell>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}
