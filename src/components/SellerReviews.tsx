import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Review = {
  id: string;
  author_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author_name?: string | null;
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function SellerReviews({ sellerId }: { sellerId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState<{ avg: number; total: number }>({ avg: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSelf = user?.id === sellerId;
  const myReview = reviews.find((r) => r.author_id === user?.id);

  async function load() {
    setLoading(true);
    const [{ data: rows }, { data: rpc }] = await Promise.all([
      (supabase as any)
        .from("reviews")
        .select("id, author_id, rating, comment, created_at")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(50),
      (supabase as any).rpc("get_seller_rating", { _seller_id: sellerId }).maybeSingle(),
    ]);
    const list = (rows ?? []) as Review[];
    // fetch author display names
    const ids = Array.from(new Set(list.map((r) => r.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id, display_name")
        .in("id", ids);
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p.display_name]));
      list.forEach((r) => (r.author_name = byId.get(r.author_id) ?? "Utilisateur"));
    }
    setReviews(list);
    if (rpc) setAvg({ avg: Number(rpc.avg_rating ?? 0), total: Number(rpc.total ?? 0) });
    setLoading(false);
  }

  useEffect(() => {
    if (sellerId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? "");
    }
  }, [myReview?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Connectez-vous pour laisser un avis");
      return;
    }
    if (isSelf) return;
    setSubmitting(true);
    const payload = {
      seller_id: sellerId,
      author_id: user.id,
      rating,
      comment: comment.trim() || null,
      listing_id: null,
    };
    const { error } = myReview
      ? await (supabase as any).from("reviews").update({ rating, comment: comment.trim() || null }).eq("id", myReview.id)
      : await (supabase as any).from("reviews").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(myReview ? "Avis mis à jour" : "Merci pour votre avis !");
    setComment("");
    setRating(5);
    load();
  }

  async function handleDelete() {
    if (!myReview) return;
    if (!confirm("Supprimer votre avis ?")) return;
    const { error } = await (supabase as any).from("reviews").delete().eq("id", myReview.id);
    if (error) return toast.error(error.message);
    toast.success("Avis supprimé");
    load();
  }

  return (
    <section className="mt-6 px-5">
      <h2 className="mb-3 flex items-center gap-3 text-sm font-extrabold uppercase tracking-tight">
        <span className="h-[2px] w-6 bg-brand-green" /> Avis ({avg.total})
      </h2>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="text-3xl font-display italic">{avg.avg.toFixed(1)}</div>
        <div>
          <Stars value={Math.round(avg.avg)} />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {avg.total === 0 ? "Aucun avis pour le moment" : `Basé sur ${avg.total} avis`}
          </p>
        </div>
      </div>

      {user && !isSelf && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {myReview ? "Modifier mon avis" : "Laisser un avis"}
          </p>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`${n} étoiles`}
              >
                <Star
                  className={`size-7 ${n <= rating ? "fill-brand-gold text-brand-gold" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience (optionnel)"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-brand-green py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Envoi…" : myReview ? "Mettre à jour" : "Publier l'avis"}
            </button>
            {myReview && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-destructive/30 px-3 py-2.5 text-sm font-bold text-destructive"
              >
                Supprimer
              </button>
            )}
          </div>
        </form>
      )}

      {!user && (
        <div className="mb-4 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Connectez-vous pour laisser un avis.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Soyez le premier à laisser un avis.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{r.author_name}</p>
                <Stars value={r.rating} small />
              </div>
              {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
              <p className="mt-2 text-[11px] text-muted-foreground">{fmt(r.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stars({ value, small = false }: { value: number; small?: boolean }) {
  const sz = small ? "size-3.5" : "size-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${sz} ${n <= value ? "fill-brand-gold text-brand-gold" : "text-muted-foreground/40"}`} />
      ))}
    </div>
  );
}
