import africaGold from "@/assets/africa-3d-gold.jpg";
import elephantGold from "@/assets/elephant-gold.png";

/**
 * Scène 3D : la tête d'éléphant en or qui flotte et tourne au-dessus
 * de la carte d'Afrique en relief doré. Purement décoratif.
 */
export function ElephantAfrica3D({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none select-none ${className}`}>
      <div className="relative [perspective:1200px]">
        {/* Halo doré */}
        <div className="absolute inset-[10%] -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-gold)_28%,transparent),transparent)] blur-2xl" />

        {/* Carte d'Afrique en relief, légère rotation 3D */}
        <div className="animate-africa-tilt">
          <img
            src={africaGold}
            alt=""
            loading="lazy"
            width={1536}
            height={1024}
            className="mx-auto w-full object-contain opacity-95 mix-blend-screen drop-shadow-[0_30px_60px_rgba(0,0,0,0.65)]"
          />
        </div>

        {/* Éléphant doré qui défile / flotte en 3D au-dessus de la carte */}
        <div className="absolute inset-0 grid place-items-center">
          <img
            src={elephantGold}
            alt=""
            loading="lazy"
            width={1024}
            height={1024}
            className="animate-elephant-orbit w-[38%] object-contain drop-shadow-[0_24px_44px_rgba(0,0,0,0.7)]"
          />
        </div>
      </div>
    </div>
  );
}

/** Marque compacte pour le header : éléphant or dans un disque. */
export function ElephantMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-gold/12 ring-1 ring-brand-gold/30 ${className}`}
    >
      <img
        src={elephantGold}
        alt="Afrique-Afrique"
        width={1024}
        height={1024}
        className="animate-mark-sway size-[86%] object-contain"
      />
    </span>
  );
}
