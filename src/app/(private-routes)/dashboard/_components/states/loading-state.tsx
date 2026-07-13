import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton para uma fileira de MetricCards. */
export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

/** Skeleton para uma tabela. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-lg" />
      ))}
    </div>
  );
}

/** Skeleton genérico para um bloco de conteúdo/gráfico. */
export function BlockSkeleton({ className = "h-64" }: { className?: string }) {
  return <Skeleton className={`w-full rounded-xl ${className}`} />;
}
