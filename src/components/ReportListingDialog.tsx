import { useState } from "react";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const REASONS = [
  { id: "scam", label: "Tentative d'arnaque" },
  { id: "fake", label: "Annonce trompeuse / fausse" },
  { id: "forbidden", label: "Produit interdit ou illégal" },
  { id: "duplicate", label: "Doublon" },
  { id: "wrong_category", label: "Mauvaise catégorie" },
  { id: "wrong_price", label: "Prix abusif" },
  { id: "other", label: "Autre" },
];

export function ReportListingDialog({
  listingId, userId, onClose,
}: {
  listingId: string;
  userId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!reason) {
      toast.error("Choisissez un motif");
      return;
    }
    setBusy(true);
    try {
      const label = REASONS.find((r) => r.id === reason)?.label ?? reason;
      const { error } = await supabase.from("reports").insert({
        listing_id: listingId,
        reporter_id: userId,
        reason: label,
        details: details.trim() || null,
      });
      if (error) throw error;
      toast.success("Merci, le signalement a été envoyé à la modération.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl italic">
            <Flag className="size-5 text-destructive" /> Signaler cette annonce
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="grid size-9 place-items-center rounded-full bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Aidez-nous à garder Afrique-Business sûr. Tous les signalements sont vérifiés.
        </p>

        <div className="mt-4 space-y-2">
          {REASONS.map((r) => (
            <label key={r.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${reason === r.id ? "border-brand-green bg-brand-green/5" : "border-border"}`}>
              <input
                type="radio"
                name="report-reason"
                value={r.id}
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
                className="accent-brand-green"
              />
              <span className="flex-1">{r.label}</span>
            </label>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 500))}
          placeholder="Détails (optionnel, 500 caractères max)"
          rows={3}
          className="mt-3 w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
        />

        <button
          onClick={submit}
          disabled={busy || !reason}
          className="mt-4 w-full rounded-xl bg-destructive py-3.5 text-sm font-bold text-destructive-foreground disabled:opacity-50"
        >
          {busy ? "Envoi…" : "Envoyer le signalement"}
        </button>
      </div>
    </div>
  );
}
