import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, X, ArrowLeft, Loader2, Trash2, Sparkles, ShieldAlert } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { CATEGORIES, COUNTRIES, isFreeCategory, type CountryCode, formatFcfa } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import { compressMany } from "@/lib/image-compress";
import { useDraft } from "@/hooks/use-draft";
import { moderateListing } from "@/lib/ai-moderation.functions";
import { estimatePrice } from "@/lib/ai-price.functions";

const DRAFT_KEY = "ab_publier_draft_v1";
type DraftShape = {
  title: string; description: string; price: string; negotiable: boolean;
  category: string; subCategory: string; country: CountryCode; city: string;
};
const INITIAL_DRAFT: DraftShape = {
  title: "", description: "", price: "", negotiable: false,
  category: CATEGORIES[0].slug, subCategory: "",
  country: "CI", city: COUNTRIES[0].cities[0],
};

export const Route = createFileRoute("/publier")({
  head: () => ({ meta: [{ title: "Publier une annonce — Afrique-business" }] }),
  component: PublierPage,
});

type PhotoFile = { file: File; preview: string };
const MAX_PHOTOS = 8;
const MIN_PHOTOS = 1;

function PublierPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [draft, setDraft, clearDraft] = useDraft<DraftShape>(DRAFT_KEY, INITIAL_DRAFT);
  const { title, description, price, negotiable, category, subCategory, country, city } = draft;
  const setField = <K extends keyof DraftShape>(k: K, v: DraftShape[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const setTitle = (v: string) => setField("title", v);
  const setDescription = (v: string) => setField("description", v);
  const setPrice = (v: string) => setField("price", v);
  const setNegotiable = (v: boolean) => setField("negotiable", v);
  const setCategory = (v: string) => setField("category", v);
  const setSubCategory = (v: string) => setField("subCategory", v);
  const setCountry = (v: CountryCode) => setField("country", v);
  const setCity = (v: string) => setField("city", v);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [moderation, setModeration] = useState<{ decision: "review" | "reject"; reason: string } | null>(null);
  const [bypassReview, setBypassReview] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<{ min: number; max: number; confidence: string; note: string } | null>(null);
  const moderateFn = useServerFn(moderateListing);
  const estimateFn = useServerFn(estimatePrice);

  async function handleEstimate() {
    if (!title.trim() || !description.trim()) {
      toast.error("Renseignez le titre et la description d'abord");
      return;
    }
    setEstimating(true);
    setEstimate(null);
    try {
      const res = await estimateFn({ data: { title: title.trim(), description: description.trim(), category, country } });
      if (res.max === 0) toast.error(res.note || "Estimation indisponible");
      else setEstimate(res);
    } catch {
      toast.error("Estimation IA échouée");
    } finally {
      setEstimating(false);
    }
  }

  if (loading || !user) {
    if (loading) return <MobileShell><div className="p-10 text-center text-sm text-muted-foreground">…</div></MobileShell>;
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Connexion requise</h1>
          <p className="mt-3 text-sm text-muted-foreground">Connectez-vous pour publier une annonce.</p>
          <Link to="/auth" className="mt-6 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">Se connecter</Link>
        </div>
      </MobileShell>
    );
  }
  const currentUser = user;

  const cities = COUNTRIES.find((c) => c.code === country)?.cities ?? [];
  const subs = CATEGORIES.find((c) => c.slug === category)?.sub ?? [];

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    const accepted = incoming.filter((f) => f.type.startsWith("image/") && f.size < 20 * 1024 * 1024);
    if (accepted.length === 0) return;
    setCompressing(true);
    try {
      const compressed = await compressMany(accepted);
      setPhotos((p) => [...p, ...compressed.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    } catch {
      toast.error("Impossible de traiter ces images");
    } finally {
      setCompressing(false);
    }
  }

  function removePhoto(i: number) {
    setPhotos((p) => {
      const target = p[i];
      if (target) URL.revokeObjectURL(target.preview);
      return p.filter((_, idx) => idx !== i);
    });
  }

  function movePhoto(from: number, to: number) {
    setPhotos((p) => {
      if (to < 0 || to >= p.length) return p;
      const next = p.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length < MIN_PHOTOS) return toast.error(`${MIN_PHOTOS} photo minimum`);
    const isFree = isFreeCategory(category);
    if (!title.trim() || !description.trim()) return toast.error("Champs requis");
    if (!isFree && !price) return toast.error("Prix requis");

    // Modération IA — bloque les rejets, prévient sur "review"
    setSubmitting(true);
    try {
      const mod = await moderateFn({ data: { title: title.trim(), description: description.trim(), category } });
      if (mod.decision === "reject") {
        setModeration({ decision: "reject", reason: mod.reason || "Contenu non autorisé." });
        setSubmitting(false);
        return;
      }
      if (mod.decision === "review" && !bypassReview) {
        setModeration({ decision: "review", reason: mod.reason || "Annonce à vérifier avant publication." });
        setSubmitting(false);
        return;
      }
    } catch {
      // Échec IA → on continue sans bloquer
    }

    let listingId: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      // 1. Insert listing en pending (atomicité : actif après upload réussi)
      const { data: listing, error: insErr } = await supabase
        .from("listings")
        .insert({
          owner_id: currentUser.id,
          title: title.trim(),
          description: description.trim(),
          price_fcfa: Math.max(0, Number(price.replace(/\D/g, "")) || 0),
          negotiable,
          category_slug: category,
          subcategory_slug: subCategory || null,
          country,
          city,
          status: "pending",
        })
        .select("id")
        .single();
      if (insErr || !listing) throw insErr ?? new Error("Insertion impossible");
      listingId = listing.id;

      // 2. Upload photos une par une avec feedback
      const photoRows: { listing_id: string; url: string; position: number }[] = [];
      for (let i = 0; i < photos.length; i++) {
        setProgress({ current: i + 1, total: photos.length });
        const file = photos[i].file;
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${currentUser.id}/${listing.id}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from("listings").upload(path, file, {
          cacheControl: "31536000", upsert: false, contentType: file.type,
        });
        if (upErr) throw upErr;
        uploadedPaths.push(path);
        photoRows.push({ listing_id: listing.id, url: path, position: i });
      }

      // 3. Insert photos + cover, puis activer
      const { error: phErr } = await supabase.from("listing_photos").insert(photoRows);
      if (phErr) throw phErr;

      const { error: actErr } = await supabase.from("listings").update({
        cover_url: photoRows[0].url,
        status: "active",
        published_at: new Date().toISOString(),
      }).eq("id", listing.id);
      if (actErr) throw actErr;

      toast.success("Annonce publiée !");
      clearDraft();
      navigate({ to: "/annonces/$id", params: { id: listing.id } });
    } catch (err) {
      // Rollback : supprimer fichiers uploadés et listing créé
      if (uploadedPaths.length > 0) {
        try { await supabase.storage.from("listings").remove(uploadedPaths); } catch { /* noop */ }
      }
      if (listingId) {
        try { await supabase.from("listings").delete().eq("id", listingId); } catch { /* noop */ }
      }
      toast.error(err instanceof Error ? err.message : "Erreur publication");
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <Link to="/" aria-label="Retour" className="grid size-9 place-items-center rounded-full bg-muted text-foreground">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-display text-xl italic">Publier une annonce</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-10 pt-5">
        {(title || description || price) && (
          <div className="flex items-center justify-between rounded-xl border border-brand-green/30 bg-brand-green/5 px-3 py-2 text-[11px] text-muted-foreground">
            <span>📝 Brouillon sauvegardé automatiquement</span>
            <button type="button" onClick={() => { clearDraft(); setDraft(INITIAL_DRAFT); }}
              className="flex items-center gap-1 font-bold text-foreground hover:text-brand-green">
              <Trash2 className="size-3" /> Effacer
            </button>
          </div>
        )}
        {/* Photos */}
        <div>
          <Label>Photos (1 à 8) — compressées automatiquement</Label>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={p.preview} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <img src={p.preview} alt="" className="size-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90">
                  <X className="size-3" />
                </button>
                <div className="absolute bottom-1 right-1 flex gap-1">
                  {i > 0 && (
                    <button type="button" onClick={() => movePhoto(i, i - 1)}
                      className="grid size-6 place-items-center rounded-full bg-background/90 text-[10px] font-bold">←</button>
                  )}
                  {i < photos.length - 1 && (
                    <button type="button" onClick={() => movePhoto(i, i + 1)}
                      className="grid size-6 place-items-center rounded-full bg-background/90 text-[10px] font-bold">→</button>
                  )}
                </div>
                {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-brand-green px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">Couverture</span>}
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" disabled={compressing} onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground disabled:opacity-50">
                {compressing ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-6" />}
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden
            onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
        </div>

        <div>
          <Label>Titre</Label>
          <Input value={title} onChange={setTitle} placeholder="Ex. Toyota Corolla 2020" maxLength={120} required />
        </div>

        <div>
          <Label>Description</Label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            required maxLength={2000} rows={5}
            placeholder="Détails, état, accessoires…"
            className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/30" />
        </div>

        {isFreeCategory(category) && (
          <div className="rounded-2xl border-2 border-brand-green/40 bg-brand-green/10 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-brand-green">✨ Opportunité gratuite</p>
            <p className="mt-1 text-[12px] leading-relaxed text-foreground">
              Publication 100% gratuite pour les offres d'emploi, demandes d'emploi et prestataires de services.
              Aidons l'Afrique à se mettre au travail 🌍
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{isFreeCategory(category) ? "Rémunération (optionnel)" : "Prix (FCFA)"}</Label>
            <Input value={price} onChange={(v) => setPrice(v.replace(/\D/g, ""))}
              placeholder={isFreeCategory(category) ? "Laisser vide si non défini" : "0"}
              required={!isFreeCategory(category)} inputMode="numeric" />
          </div>
          <label className="flex items-end gap-2 pb-3 text-sm">
            <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="size-4 accent-brand-green" />
            Négociable
          </label>
        </div>

        {!isFreeCategory(category) && (
          <div className="rounded-2xl border border-brand-green/30 bg-brand-green/5 p-3">
            <button type="button" onClick={handleEstimate} disabled={estimating}
              className="flex items-center gap-2 text-xs font-bold text-brand-green disabled:opacity-50">
              {estimating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Estimer le prix avec l'IA
            </button>
            {estimate && estimate.max > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-bold">
                  Fourchette : {formatFcfa(estimate.min)} – {formatFcfa(estimate.max)}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{estimate.confidence}</span>
                </p>
                {estimate.note && <p className="text-[11px] text-muted-foreground">{estimate.note}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setPrice(String(estimate.min))} className="rounded-lg bg-background px-2 py-1 text-[11px] font-bold">Min</button>
                  <button type="button" onClick={() => setPrice(String(Math.round((estimate.min + estimate.max) / 2)))} className="rounded-lg bg-background px-2 py-1 text-[11px] font-bold">Moyenne</button>
                  <button type="button" onClick={() => setPrice(String(estimate.max))} className="rounded-lg bg-background px-2 py-1 text-[11px] font-bold">Max</button>
                </div>
              </div>
            )}
          </div>
        )}

        {moderation && (
          <div className={`rounded-2xl border-2 p-4 ${moderation.decision === "reject" ? "border-destructive/40 bg-destructive/10" : "border-amber-500/40 bg-amber-500/10"}`}>
            <div className="flex items-start gap-2">
              <ShieldAlert className={`mt-0.5 size-4 shrink-0 ${moderation.decision === "reject" ? "text-destructive" : "text-amber-600"}`} />
              <div className="flex-1">
                <p className="text-xs font-extrabold uppercase tracking-wider">
                  {moderation.decision === "reject" ? "Publication refusée" : "Annonce à vérifier"}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed">{moderation.reason}</p>
                {moderation.decision === "review" && (
                  <button type="button" onClick={() => { setBypassReview(true); setModeration(null); }}
                    className="mt-2 rounded-lg bg-background px-3 py-1.5 text-[11px] font-bold">
                    Publier quand même
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <Label>Catégorie</Label>
          <Select value={category} onChange={(v) => { setCategory(v); setSubCategory(""); }}
            options={CATEGORIES.map((c) => ({ value: c.slug, label: `${c.emoji} ${c.name}` }))} />
        </div>
        {subs.length > 0 && (
          <div>
            <Label>Sous-catégorie (optionnel)</Label>
            <Select value={subCategory} onChange={setSubCategory}
              options={[{ value: "", label: "—" }, ...subs.map((s) => ({ value: s, label: s }))]} />
          </div>
        )}


        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Pays</Label>
            <Select value={country} onChange={(v) => { setCountry(v as CountryCode); setCity(COUNTRIES.find((c) => c.code === v)?.cities[0] ?? ""); }}
              options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))} />
          </div>
          <div>
            <Label>Ville</Label>
            <Select value={city} onChange={setCity}
              options={cities.map((c) => ({ value: c, label: c }))} />
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting
            ? progress ? `Photo ${progress.current}/${progress.total}…` : "Publication…"
            : "Publier mon annonce"}
        </button>
      </form>
    </MobileShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</p>;
}
function Input({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} {...rest}
    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/30" />;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/30">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
