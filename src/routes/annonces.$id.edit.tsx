import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, X } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { CATEGORIES, COUNTRIES, type CountryCode } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { resolveListingImages } from "@/lib/listing-images";
import { compressMany } from "@/lib/image-compress";

export const Route = createFileRoute("/annonces/$id/edit")({
  head: () => ({ meta: [{ title: "Modifier l'annonce — Afrique-business" }] }),
  component: EditListingPage,
});

const MAX_PHOTOS = 8;
type ExistingPhoto = { id: string; path: string; previewUrl: string; position: number };
type NewPhoto = { file: File; preview: string };

function EditListingPage() {
  const { id } = useParams({ from: "/annonces/$id/edit" });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [notOwner, setNotOwner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [subCategory, setSubCategory] = useState("");
  const [country, setCountry] = useState<CountryCode>("CI");
  const [city, setCity] = useState(COUNTRIES[0].cities[0]);

  const [existing, setExisting] = useState<ExistingPhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [toDelete, setToDelete] = useState<ExistingPhoto[]>([]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      const { data: l, error } = await supabase.from("listings")
        .select("id, owner_id, title, description, price_fcfa, negotiable, category_slug, subcategory_slug, country, city")
        .eq("id", id).maybeSingle();
      if (cancelled) return;
      if (error || !l) { setLoading(false); setNotOwner(true); return; }
      if (l.owner_id !== user.id) { setLoading(false); setNotOwner(true); return; }

      setTitle(l.title);
      setDescription(l.description);
      setPrice(String(l.price_fcfa));
      setNegotiable(!!l.negotiable);
      setCategory(l.category_slug);
      setSubCategory(l.subcategory_slug ?? "");
      setCountry(l.country as CountryCode);
      setCity(l.city);

      const { data: photos } = await supabase.from("listing_photos")
        .select("id, url, position").eq("listing_id", id).order("position");
      const rows = photos ?? [];
      const resolved = await resolveListingImages(rows.map((p) => p.url));
      if (cancelled) return;
      setExisting(rows.map((p) => ({
        id: p.id, path: p.url, position: p.position,
        previewUrl: resolved.get(p.url) ?? p.url,
      })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user, authLoading]);

  if (authLoading || loading) {
    return <MobileShell><div className="p-10 text-center text-sm text-muted-foreground">…</div></MobileShell>;
  }
  if (!user) {
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Connexion requise</h1>
          <Link to="/auth" search={{ redirect: `/annonces/${id}/edit` }}
            className="mt-6 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-primary-foreground">Se connecter</Link>
        </div>
      </MobileShell>
    );
  }
  if (notOwner) {
    return (
      <MobileShell>
        <div className="px-6 py-20 text-center">
          <h1 className="font-display text-2xl italic">Annonce introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">Vous n'êtes pas le propriétaire ou cette annonce n'existe pas.</p>
          <Link to="/mes-annonces" className="mt-6 inline-block text-sm font-bold text-brand-green">← Mes annonces</Link>
        </div>
      </MobileShell>
    );
  }

  const cities = COUNTRIES.find((c) => c.code === country)?.cities ?? [];
  const subs = CATEGORIES.find((c) => c.slug === category)?.sub ?? [];
  const totalPhotos = existing.length + newPhotos.length;

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, MAX_PHOTOS - totalPhotos);
    const accepted = incoming.filter((f) => f.type.startsWith("image/") && f.size < 20 * 1024 * 1024);
    if (accepted.length === 0) return;
    try {
      const compressed = await compressMany(accepted);
      setNewPhotos((p) => [...p, ...compressed.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    } catch {
      toast.error("Impossible de traiter ces images");
    }
  }

  function removeExisting(p: ExistingPhoto) {
    setExisting((prev) => prev.filter((x) => x.id !== p.id));
    setToDelete((prev) => [...prev, p]);
  }

  function removeNew(i: number) {
    setNewPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (totalPhotos < 1) return toast.error("1 photo minimum");
    if (!title.trim() || !description.trim() || !price) return toast.error("Champs requis");

    setSubmitting(true);
    const uploadedPaths: string[] = [];
    try {
      // 1. Update champs
      const { error: upErr } = await supabase.from("listings").update({
        title: title.trim(),
        description: description.trim(),
        price_fcfa: Math.max(0, Number(price.replace(/\D/g, "")) || 0),
        negotiable,
        category_slug: category,
        subcategory_slug: subCategory || null,
        country, city,
      }).eq("id", id);
      if (upErr) throw upErr;

      // 2. Supprimer les photos retirées (Storage + DB)
      if (toDelete.length > 0) {
        await supabase.storage.from("listings").remove(toDelete.map((p) => p.path));
        await supabase.from("listing_photos").delete().in("id", toDelete.map((p) => p.id));
      }

      // 3. Upload nouvelles photos
      const startPos = existing.length;
      const newRows: { listing_id: string; url: string; position: number }[] = [];
      for (let i = 0; i < newPhotos.length; i++) {
        setProgress({ current: i + 1, total: newPhotos.length });
        const file = newPhotos[i].file;
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user!.id}/${id}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from("listings").upload(path, file, {
          cacheControl: "31536000", upsert: false, contentType: file.type,
        });
        if (error) throw error;
        uploadedPaths.push(path);
        newRows.push({ listing_id: id, url: path, position: startPos + i });
      }
      if (newRows.length > 0) {
        const { error } = await supabase.from("listing_photos").insert(newRows);
        if (error) throw error;
      }

      // 4. Mettre à jour la cover (1ère photo restante)
      const newCover = existing[0]?.path ?? newRows[0]?.url ?? null;
      if (newCover) {
        await supabase.from("listings").update({ cover_url: newCover }).eq("id", id);
      }

      toast.success("Annonce modifiée !");
      navigate({ to: "/annonces/$id", params: { id } });
    } catch (err) {
      if (uploadedPaths.length > 0) {
        try { await supabase.storage.from("listings").remove(uploadedPaths); } catch { /* noop */ }
      }
      toast.error(err instanceof Error ? err.message : "Erreur modification");
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <Link to="/mes-annonces" aria-label="Retour" className="grid size-9 place-items-center rounded-full bg-muted text-foreground">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-display text-xl italic">Modifier l'annonce</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-10 pt-5">
        <div>
          <Label>Photos ({totalPhotos}/{MAX_PHOTOS})</Label>
          <div className="grid grid-cols-3 gap-2">
            {existing.map((p, i) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <img src={p.previewUrl} alt="" className="size-full object-cover" />
                <button type="button" onClick={() => removeExisting(p)}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90">
                  <X className="size-3" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-brand-green px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">Couverture</span>}
              </div>
            ))}
            {newPhotos.map((p, i) => (
              <div key={p.preview} className="relative aspect-square overflow-hidden rounded-xl bg-muted ring-2 ring-brand-green/40">
                <img src={p.preview} alt="" className="size-full object-cover" />
                <button type="button" onClick={() => removeNew(i)}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90">
                  <X className="size-3" />
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-brand-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-foreground">Nouvelle</span>
              </div>
            ))}
            {totalPhotos < MAX_PHOTOS && (
              <button type="button" onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
                <Camera className="size-6" />
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden
            onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
        </div>

        <div>
          <Label>Titre</Label>
          <Input value={title} onChange={setTitle} maxLength={120} required />
        </div>
        <div>
          <Label>Description</Label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            required maxLength={2000} rows={5}
            className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-brand-green/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Prix (FCFA)</Label>
            <Input value={price} onChange={(v) => setPrice(v.replace(/\D/g, ""))} required inputMode="numeric" />
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
            ? progress ? `Photo ${progress.current}/${progress.total}…` : "Enregistrement…"
            : "Enregistrer"}
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
