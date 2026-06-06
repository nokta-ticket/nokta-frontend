import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/70", className)}
      {...props}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function EventoDetailSkeleton() {
  return (
    <div className="min-h-screen animate-fade-in bg-background">
      <Skeleton className="h-[260px] w-full rounded-none sm:h-[380px] md:h-[480px]" />

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-md">
            <Skeleton className="h-20 w-full rounded-none" />
            <div className="space-y-4 p-5">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResaleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-1 flex items-center justify-between border-t pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="h-full min-h-[120px] w-24 shrink-0 rounded-none sm:w-32" />
      <div className="flex-1 space-y-2 p-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TicketDetailSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-16 w-full rounded-none" />

      <div className="mx-4 overflow-hidden rounded-2xl border bg-card">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>

      <div className="mx-4 flex flex-col items-center gap-4 rounded-2xl border bg-card p-6">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-[172px] w-[172px] rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
