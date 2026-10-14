"use client";

import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";
import type { Recommendation } from "@/services/platform";

/**
 * Discreto de propósito (briefing: "sem modal invasivo, sem linguagem
 * agressiva de venda"). O motivo vem sempre do backend — nunca texto
 * inventado no frontend.
 */
export function RecommendationsPanel({ recommendations, onDismiss, dismissingKey }: { recommendations: Recommendation[]; onDismiss: (key: string) => void; dismissingKey: string | null }) {
  if (recommendations.length === 0) return null;

  return (
    <section aria-labelledby="recommendations-title" className="space-y-3">
      <h2 id="recommendations-title" className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon name="lightbulb" size={14} className="text-brand" />
        Recomendado para você
      </h2>
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        {recommendations.map((rec, i) => (
          <div key={rec.capabilityKey} className="fade-up" style={{ ["--i" as string]: i } as never}>
            <Callout
              tone="brand"
              icon="magic"
              title={rec.label}
              action={
                <button
                  type="button"
                  aria-label={`Dispensar recomendação de ${rec.label}`}
                  onClick={() => onDismiss(rec.capabilityKey)}
                  disabled={dismissingKey === rec.capabilityKey}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
                >
                  <Icon name="close" size={12} />
                </button>
              }
            >
              {rec.reason}
            </Callout>
          </div>
        ))}
      </div>
    </section>
  );
}
