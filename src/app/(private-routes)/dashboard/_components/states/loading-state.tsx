import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

/**
 * Skeletons do painel. Todo `loading.tsx` deve copiar o layout real da página;
 * estes são os blocos genéricos pra isso.
 * @deprecated Prefira `Skeleton`/`RowsSkeleton` de `@/components/ui/skeleton`.
 */

/** Fileira de StatCards/MetricCards. */
export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", count >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-card" />
      ))}
    </div>
  );
}

/** Linhas de uma tabela/lista. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Bloco genérico de conteúdo/gráfico. */
export function BlockSkeleton({ className = "h-64" }: { className?: string }) {
  return <Skeleton className={cn("w-full rounded-card", className)} />;
}
