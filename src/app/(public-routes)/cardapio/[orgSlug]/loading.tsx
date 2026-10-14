import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mostrado pelo Next (Suspense) enquanto page.tsx resolve o fetch no servidor
 * — sem isso o navegador não recebe NADA até o fetch terminar. Copia o
 * layout real: banner, logo, barra de categorias e linhas de itens.
 */
export default function Loading() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-3xl">
        <Skeleton className="aspect-[430/190] w-full rounded-none" />
        <div className="-mt-10 flex items-end gap-4 px-4 md:px-6">
          <Skeleton className="size-20 rounded-full ring-4 ring-background md:size-24" />
          <Skeleton className="mb-2 h-7 w-48" />
        </div>
        <div className="mt-4 flex gap-2 px-4 md:px-6">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
        <div className="mt-6 flex gap-5 border-b border-border px-4 pb-3 md:px-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-2.5 px-4 pt-7 md:px-6">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
