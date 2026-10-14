import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

export interface StepperStep {
  label: ReactNode;
  description?: ReactNode;
  /** Carimbo de data/hora (ex.: "Hoje às 21:33") — mostrado em etapas concluídas. */
  timestamp?: ReactNode;
  status: "done" | "current" | "upcoming" | "failed";
}

/**
 * Linha do tempo de etapas (pedido, saque, onboarding). Vertical por
 * padrão; `orientation="horizontal"` pra wizards no desktop (vira
 * vertical no celular automaticamente).
 */
export function Stepper({ steps, orientation = "vertical", className }: { steps: StepperStep[]; orientation?: "vertical" | "horizontal"; className?: string }) {
  return (
    <ol className={cn("flex", orientation === "vertical" ? "flex-col" : "flex-col gap-0 md:flex-row md:items-start", className)}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const dot =
          step.status === "done" ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-success text-white">
              <Icon name="check" size={10} />
            </span>
          ) : step.status === "failed" ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-danger text-white">
              <Icon name="close" size={10} />
            </span>
          ) : step.status === "current" ? (
            <span className="pulse-ring flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <span className="size-2 rounded-full bg-brand-foreground" />
            </span>
          ) : (
            <span className="flex size-6 items-center justify-center rounded-full border-2 border-border-strong bg-surface" />
          );
        const lineClass = step.status === "done" ? "bg-success/60" : "bg-border-strong";
        return (
          <li key={i} className={cn("relative flex gap-3", orientation === "horizontal" && "md:flex-1 md:flex-col md:items-start md:gap-2")}>
            <div className={cn("flex flex-col items-center", orientation === "horizontal" && "md:w-full md:flex-row")}>
              {dot}
              {!last ? <span className={cn("w-0.5 flex-1 rounded-full", lineClass, orientation === "vertical" ? "my-1 min-h-6" : "my-1 min-h-6 md:mx-2 md:my-0 md:h-0.5 md:w-auto md:flex-1")} aria-hidden /> : null}
            </div>
            <div className={cn("min-w-0 pb-5", orientation === "horizontal" && "md:pb-0 md:pr-4")}>
              <p className={cn("text-sm font-medium", step.status === "upcoming" ? "text-muted-foreground" : "text-foreground")}>{step.label}</p>
              {step.description ? <p className="mt-0.5 text-caption text-muted-foreground">{step.description}</p> : null}
              {step.timestamp ? <p className="mt-0.5 text-caption text-subtle-foreground tnum">{step.timestamp}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
