import { Skeleton } from "@/components/ui/skeleton";

/** Suspense do fetch no servidor — copia o layout real (cabeçalho + formulário). */
export default function Loading() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-3xl">
        <Skeleton className="aspect-[430/190] w-full rounded-none" />
        <div className="-mt-10 flex items-end gap-4 px-4 md:px-6">
          <Skeleton className="size-20 rounded-full ring-4 ring-background md:size-24" />
          <Skeleton className="mb-2 h-7 w-48" />
        </div>
        <div className="space-y-4 px-4 pt-8 md:px-6">
          <Skeleton className="h-7 w-64" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-card" />
            <Skeleton className="h-14 rounded-card" />
          </div>
          <Skeleton className="h-11 rounded-input" />
          <Skeleton className="h-11 rounded-input" />
          <Skeleton className="h-12 rounded-pill" />
        </div>
      </div>
    </main>
  );
}
