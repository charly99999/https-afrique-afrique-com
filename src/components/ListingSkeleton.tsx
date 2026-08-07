// Skeletons de chargement — évitent les sauts d'écran pendant les requêtes.

export function ListingCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="mb-3 break-inside-avoid rounded-2xl bg-card p-2 shadow-sm ring-1 ring-border/60">
      <div className={`skeleton mb-3 w-full rounded-xl ${tall ? "h-52" : "h-36"}`} />
      <div className="skeleton mb-2 h-2.5 w-16 rounded-full" />
      <div className="skeleton mb-2 h-3.5 w-11/12 rounded-full" />
      <div className="skeleton mb-2 h-3.5 w-1/2 rounded-full" />
      <div className="skeleton h-2.5 w-2/3 rounded-full" />
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="columns-2 gap-3 md:columns-3 lg:columns-4 xl:columns-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} tall={i % 3 === 1} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return <div className="skeleton h-20 rounded-2xl" />;
}
