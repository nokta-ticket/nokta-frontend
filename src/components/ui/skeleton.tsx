import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("skeleton-shimmer rounded-md", className)} {...props} />;
}

export function EventCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-card" />
      <div className="space-y-2 px-0.5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function ResaleCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-card bg-surface p-2.5">
      <Skeleton className="aspect-video w-[108px] rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="rounded-card bg-surface p-3">
      <div className="flex items-center gap-3.5">
        <Skeleton className="aspect-video w-[108px] rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function TicketDetailSkeleton() {
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="mt-6 aspect-[3/4] w-full rounded-[24px]" />
      <Skeleton className="mt-4 h-12 w-full rounded-pill" />
    </div>
  );
}

/** Lista genérica de linhas (tabelas/cards do painel). */
export function RowsSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
