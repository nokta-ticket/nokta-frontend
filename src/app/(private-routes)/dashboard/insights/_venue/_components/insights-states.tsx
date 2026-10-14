import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de aba: 4 KPIs, indicadores secundários e dois gráficos — o mesmo layout da aba real. */
export function TabSkeleton({ secondary = true }: { secondary?: boolean }) {
  return (
    <div className="space-y-6" aria-busy aria-label="Carregando insights">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] w-full rounded-card" />
        ))}
      </div>
      {secondary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
          ))}
        </div>
      ) : null}
      <Skeleton className="h-[340px] w-full rounded-card" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-card" />
        <Skeleton className="h-[300px] w-full rounded-card" />
      </div>
    </div>
  );
}

export function TabError({ onRetry }: { onRetry: () => void }) {
  return <ErrorState title="Não deu pra carregar os insights" description="Confira a conexão e tenta de novo em alguns segundos." onRetry={onRetry} />;
}

/** Lista de nomes curta: "Vodka, Gelo e Limão (+2)". */
export function joinNames(names: string[], max = 3): string {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  const text = shown.length <= 1 ? (shown[0] ?? "") : `${shown.slice(0, -1).join(", ")} e ${shown[shown.length - 1]}`;
  return rest > 0 ? `${text} (+${rest})` : text;
}

/** Plural simples em pt-BR: plural(2, "item", "itens") → "2 itens". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count.toLocaleString("pt-BR")} ${count === 1 ? singular : pluralForm}`;
}
