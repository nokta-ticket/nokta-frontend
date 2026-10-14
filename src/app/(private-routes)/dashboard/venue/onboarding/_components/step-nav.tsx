import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Rodapé comum das etapas: voltar à esquerda, continuar à direita. */
export function StepNav({ onBack, onNext, nextLabel = "Continuar", loading, disabled }: { onBack?: () => void; onNext: () => void; nextLabel?: string; loading?: boolean; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {onBack ? (
        <Button variant="ghost" leftIcon="arrow-left" onClick={onBack} disabled={loading}>
          Voltar
        </Button>
      ) : (
        <span />
      )}
      <Button size="lg" rightIcon="arrow-right" onClick={onNext} loading={loading} disabled={disabled}>
        {nextLabel}
      </Button>
    </div>
  );
}

/** Linha "feito / pendente" dos cartões de status de cada etapa. */
export function ReadyRow({ done, label, hint }: { done: boolean; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <Icon name={done ? "check-circle" : "circle-outline"} size={15} className={cn("mt-0.5 shrink-0", done ? "text-success" : "text-subtle-foreground")} />
      <span className="min-w-0">
        <span className={cn("block text-sm", done ? "text-muted-foreground line-through" : "font-medium text-foreground")}>{label}</span>
        {hint && !done ? <span className="block text-caption text-muted-foreground">{hint}</span> : null}
      </span>
    </li>
  );
}
