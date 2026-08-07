// Bannière événementielle temporaire — Fête de l'Indépendance de la Côte d'Ivoire.
// Visible uniquement du 7 au 8 août inclus (heure locale), puis disparaît d'elle-même.

function isIndependenceWindow(now = new Date()) {
  const month = now.getMonth(); // 7 = août
  const day = now.getDate();
  return month === 7 && (day === 7 || day === 8);
}

export function IndependenceBanner() {
  if (!isIndependenceWindow()) return null;

  return (
    <div className="px-4 pt-3">
      <div className="flag-3d relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3">
        <span aria-hidden className="flag-3d-wave pointer-events-none absolute inset-0" />
        <span
          aria-hidden
          className="flag-3d-ci relative z-10 h-9 w-14 shrink-0 rounded-md ring-1 ring-black/10"
        />
        <div className="relative z-10 min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">
            7 août • Fête nationale
          </p>
          <p className="text-[13px] font-extrabold leading-snug text-white">
            Bonne Fête de l'Indépendance à la Côte d'Ivoire ! 🇨🇮
          </p>
        </div>
      </div>
    </div>
  );
}
