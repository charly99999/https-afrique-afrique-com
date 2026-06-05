import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  photos: string[];
  alt: string;
}

export function ListingGallery({ photos, alt }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const scrollTo = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: i * w, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth;
        if (w > 0) setActive(Math.round(el.scrollLeft / w));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? 0 : Math.min(i + 1, photos.length - 1)));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? 0 : Math.max(i - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  const multi = photos.length > 1;

  return (
    <>
      <div className="relative">
        <div
          ref={scrollerRef}
          className="hide-scrollbar flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", touchAction: "pan-y pinch-zoom" }}
        >
          {photos.map((src, i) => (
            <button
              type="button"
              key={src + i}
              onClick={() => setLightbox(i)}
              className="aspect-[4/5] h-full w-full shrink-0 snap-center"
              aria-label={`Voir photo ${i + 1} en grand`}
            >
              <img
                src={src}
                alt={`${alt} — photo ${i + 1}`}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                {...(i === 0 ? { fetchPriority: "high" as const } : {})}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {multi && (
          <>
            <button
              type="button"
              onClick={() => scrollTo(Math.max(0, active - 1))}
              aria-label="Photo précédente"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 grid size-10 place-items-center rounded-full bg-background/80 shadow-soft backdrop-blur transition active:scale-95 sm:grid"
              disabled={active === 0}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(photos.length - 1, active + 1))}
              aria-label="Photo suivante"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 grid size-10 place-items-center rounded-full bg-background/80 shadow-soft backdrop-blur transition active:scale-95 sm:grid"
              disabled={active === photos.length - 1}
            >
              <ChevronRight className="size-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-background/70 px-2 py-1 backdrop-blur">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Aller à la photo ${i + 1}`}
                  className={`size-1.5 rounded-full transition ${i === active ? "w-4 bg-foreground" : "bg-foreground/40"}`}
                />
              ))}
            </div>

            <span className="absolute right-3 bottom-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
              {active + 1}/{photos.length}
            </span>
          </>
        )}
      </div>

      {multi && (
        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
          {photos.map((p, i) => (
            <button
              key={p + i}
              type="button"
              onClick={() => scrollTo(i)}
              className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === active ? "border-brand-green" : "border-transparent opacity-70"}`}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={p} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white"
          >
            ✕
          </button>
          {lightbox > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 grid size-12 place-items-center rounded-full bg-white/10 text-white"
              aria-label="Précédente"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid size-12 place-items-center rounded-full bg-white/10 text-white"
              aria-label="Suivante"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
          <img
            src={photos[lightbox]}
            alt={`${alt} — photo ${lightbox + 1}`}
            className="max-h-[90vh] max-w-[95vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            {lightbox + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}
