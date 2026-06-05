import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, X, ArrowLeft, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { CATEGORIES, COUNTRIES, isFreeCategory, type CountryCode } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { resolveListingImage } from "@/lib/listing-images";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [subCategory, setSubCategory] = useState("");
  const [country, setCountry] = useState<CountryCode>("CI");
  const [city, setCity] = useState(COUNTRIES[0].cities[0]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

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

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    const valid = incoming.filter((f) => f.type.startsWith("image/") && f.size < 6 * 1024 * 1024);
    setPhotos((p) => [...p, ...valid.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length < MIN_PHOTOS) return toast.error(`${MIN_PHOTOS} photo minimum`);
    if (!title.trim() || !description.trim() || !price) return toast.error("Champs requis");

    setSubmitting(true);
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
        {/* Photos */}
        <div>
          <Label>Photos (1 à 8)</Label>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={p.preview} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <img src={p.preview} alt="" className="size-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90">
                  <X className="size-3" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-brand-green px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">Couverture</span>}
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
                <Camera className="size-6" />
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden
            onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Prix (FCFA)</Label>
            <Input value={price} onChange={(v) => setPrice(v.replace(/\D/g, ""))} placeholder="0" required inputMode="numeric" />
          </div>
          <label className="flex items-end gap-2 pb-3 text-sm">
            <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="size-4 accent-brand-green" />
            Négociable
          </label>
        </div>

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
