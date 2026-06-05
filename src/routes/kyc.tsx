import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-compress";

export const Route = createFileRoute("/kyc")({
  head: () => ({
    meta: [
      { title: "Vérification d'identité — Afrique-business" },
      { name: "description", content: "Vérifiez votre identité pour obtenir le badge vendeur de confiance." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: KycPage,
});

type Submission = {
  id: string;
  status: "pending" | "approved" | "rejected";
  doc_type: string;
  full_name: string;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function KycPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [last, setLast] = useState<Submission | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState<"cni" | "passport" | "license">("cni");
  const [docNumber, setDocNumber] = useState("");
  const [docCountry, setDocCountry] = useState("CI");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("kyc_submissions")
        .select("id, status, doc_type, full_name, reviewer_notes, created_at, reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLast(data ?? null);
      setLoadingSub(false);
    })();
  }, [user, loading, navigate]);

  async function uploadFile(file: File, label: string): Promise<string> {
    const compressed = await compressImage(file, { maxDim: 1600, quality: 0.82 }).catch(() => file);
    const ext = (compressed.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user!.id}/${Date.now()}-${label}.${ext}`;
    const { error } = await supabase.storage.from("kyc").upload(path, compressed, { upsert: false, contentType: compressed.type || "image/jpeg" });
    if (error) throw error;
    return path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !docNumber.trim()) return toast.error("Nom complet et numéro requis");
    if (!front || !selfie) return toast.error("Photo du document (recto) et selfie requis");
    if (docType !== "passport" && !back) return toast.error("Verso du document requis");

    setSubmitting(true);
    try {
      const [fp, bp, sp] = await Promise.all([
        uploadFile(front, "front"),
        back ? uploadFile(back, "back") : Promise.resolve(null),
        uploadFile(selfie, "selfie"),
      ]);
      const { error } = await (supabase as any).from("kyc_submissions").insert({
        user_id: user.id,
        full_name: fullName.trim(),
        doc_type: docType,
        doc_number: docNumber.trim(),
        doc_country: docCountry,
        doc_front_path: fp,
        doc_back_path: bp,
        selfie_path: sp,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Dossier envoyé. Réponse sous 24-48h.");
      navigate({ to: "/parametres" });
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MobileShell>
      <div className="flex items-center gap-3 px-5 py-4">
        <Link to="/parametres" aria-label="Retour" className="grid size-10 place-items-center rounded-full bg-card shadow-soft">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl italic">Vérification d'identité</h1>
      </div>

      <div className="mx-5 mb-4 flex items-start gap-3 rounded-2xl border border-brand-green/30 bg-brand-green/5 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-green" />
        <div className="text-xs text-foreground/80">
          <p className="font-bold">Obtenez le badge vérifié</p>
          <p className="mt-1">Les vendeurs vérifiés gagnent jusqu'à 3× plus de contacts. Vos documents restent privés et ne sont consultés que par notre équipe.</p>
        </div>
      </div>

      {loadingSub ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : last && last.status !== "rejected" ? (
        <StatusCard sub={last} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-10">
          {last?.status === "rejected" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="font-bold">Dossier précédent rejeté</p>
              {last.reviewer_notes && <p className="mt-1">{last.reviewer_notes}</p>}
              <p className="mt-1">Vous pouvez soumettre à nouveau ci-dessous.</p>
            </div>
          )}

          <Field label="Nom complet (comme sur le document)" value={fullName} onChange={setFullName} placeholder="Ex : Aïcha Diallo" />

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Type de document</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="cni">Carte nationale d'identité</option>
              <option value="passport">Passeport</option>
              <option value="license">Permis de conduire</option>
            </select>
          </div>

          <Field label="Numéro du document" value={docNumber} onChange={setDocNumber} placeholder="Numéro figurant sur le document" />

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Pays d'émission</label>
            <select
              value={docCountry}
              onChange={(e) => setDocCountry(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              {["CI","SN","CM","ML","BF","BJ","TG","NE","GA","CG","CD","GN","MR","TD","RW","MG"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <FileField label="Document — Recto" file={front} onChange={setFront} required />
          {docType !== "passport" && (
            <FileField label="Document — Verso" file={back} onChange={setBack} required />
          )}
          <FileField label="Selfie en tenant le document" file={selfie} onChange={setSelfie} required />

          <p className="text-[11px] text-muted-foreground">
            En soumettant, vous confirmez que ces documents sont authentiques. Toute fraude entraîne la suspension définitive du compte.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            <Upload className="size-4" />
            {submitting ? "Envoi en cours…" : "Envoyer pour vérification"}
          </button>
        </form>
      )}
    </MobileShell>
  );
}

function StatusCard({ sub }: { sub: Submission }) {
  const map = {
    pending: { icon: Clock, color: "text-brand-gold", bg: "bg-brand-gold/10 border-brand-gold/30", title: "En cours d'examen", text: "Votre dossier a été reçu. Réponse sous 24-48h ouvrées." },
    approved: { icon: CheckCircle2, color: "text-brand-green", bg: "bg-brand-green/10 border-brand-green/30", title: "Identité vérifiée", text: "Félicitations ! Votre badge vérifié est désormais visible sur vos annonces." },
    rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30", title: "Dossier rejeté", text: sub.reviewer_notes ?? "Veuillez soumettre à nouveau." },
  } as const;
  const cfg = map[sub.status];
  const Icon = cfg.icon;
  return (
    <div className="mx-5 pb-10">
      <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
        <Icon className={`size-8 ${cfg.color}`} />
        <p className="mt-3 font-display text-lg italic">{cfg.title}</p>
        <p className="mt-1 text-sm text-foreground/80">{cfg.text}</p>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Soumis le {new Date(sub.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
      />
    </div>
  );
}

function FileField({ label, file, onChange, required }: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm hover:bg-muted">
        <Upload className="size-4 text-muted-foreground" />
        <span className="flex-1 truncate">{file ? file.name : "Choisir une image (JPG/PNG)"}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
