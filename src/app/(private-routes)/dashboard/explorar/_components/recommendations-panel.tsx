"use client";

import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recommendation } from "@/services/platform";

/**
 * Discreto de propósito (briefing: "sem modal invasivo, sem linguagem
 * agressiva de venda"). O motivo vem sempre do backend — nunca texto
 * inventado no frontend.
 */
export function RecommendationsPanel({
  recommendations,
  onDismiss,
  dismissingKey,
}: {
  recommendations: Recommendation[];
  onDismiss: (key: string) => void;
  dismissingKey: string | null;
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-sm font-medium text-black/70">
        <Lightbulb size={15} className="text-violet-600" />
        Recomendado para você
      </h2>
      <div className="flex flex-col gap-2">
        {recommendations.map((rec) => (
          <div
            key={rec.capabilityKey}
            className="flex items-start justify-between gap-3 rounded-lg border border-violet-100 bg-violet-50/60 p-3 text-sm"
          >
            <div>
              <p className="font-medium text-violet-900">{rec.label}</p>
              <p className="text-violet-800/80">{rec.reason}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-violet-700/60 hover:text-violet-900"
              aria-label={`Dispensar recomendação de ${rec.label}`}
              onClick={() => onDismiss(rec.capabilityKey)}
              disabled={dismissingKey === rec.capabilityKey}
            >
              <X size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
