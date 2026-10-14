/** Mesmo layout da página da cidade (sem isto, valeria o skeleton da busca de /eventos). */
export default function CityEventsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 lg:px-6 lg:pt-10" aria-busy="true">
      <div className="skeleton-shimmer h-3 w-40 rounded-md" />
      <div className="skeleton-shimmer mt-5 h-9 w-3/4 max-w-md rounded-lg lg:h-12" />
      <div className="mt-4 max-w-3xl space-y-2">
        <div className="skeleton-shimmer h-4 w-full rounded-md" />
        <div className="skeleton-shimmer h-4 w-5/6 rounded-md" />
      </div>
      <div className="skeleton-shimmer mt-10 h-6 w-32 rounded-md" />
      <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton-shimmer aspect-video rounded-card" />
            <div className="space-y-2 px-0.5">
              <div className="skeleton-shimmer h-4 w-4/5 rounded-md" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
