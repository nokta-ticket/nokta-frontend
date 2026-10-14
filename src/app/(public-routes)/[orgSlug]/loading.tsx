import { Skeleton } from "@/components/ui/skeleton";

/** Suspense do fetch no servidor — copia o layout real da Home pública. */
export default function Loading() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-3xl">
        <Skeleton className="aspect-[430/190] w-full rounded-none" />
        <div className="-mt-10 flex items-end gap-4 px-4 md:px-6">
          <Skeleton className="size-20 rounded-full ring-4 ring-background md:size-24" />
          <Skeleton className="mb-2 h-7 w-48" />
        </div>
        <div className="space-y-4 px-4 pt-6 md:px-6">
          <Skeleton className="h-14 rounded-pill" />
          <Skeleton className="h-16 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
      </div>
    </main>
  );
}
