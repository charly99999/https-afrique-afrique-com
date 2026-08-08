// Skeletons de chargement — évitent les sauts d'écran pendant les requêtes.

export function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-2">
      <div className="skeleton mb-3 aspect-square w-full rounded-xl" />
      <div className="skeleton mb-2 h-2.5 w-16 rounded-full" />
      <div className="skeleton mb-2 h-3.5 w-11/12 rounded-full" />
      <div className="skeleton mb-2 h-3.5 w-1/2 rounded-full" />
      <div className="skeleton h-2.5 w-2/3 rounded-full" />
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return <div className="skeleton h-20 rounded-2xl" />;
}
