import { ResaleCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function MinhasRevendasLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ResaleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
