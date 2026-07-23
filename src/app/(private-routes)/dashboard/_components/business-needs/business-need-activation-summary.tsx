"use client";

import { CheckCircle2, Info } from "lucide-react";
import type { BusinessNeedGroup, BusinessNeedsActivationPreview } from "@/services/platform";
import { BlockSkeleton } from "../states/loading-state";

/** "Vamos preparar seu workspace com:" — resumo antes de confirmar (onboarding). */
export function BusinessNeedActivationSummary({
  groups,
  preview,
  isLoading,
}: {
  groups: BusinessNeedGroup[];
  preview: BusinessNeedsActivationPreview | undefined;
  isLoading: boolean;
}) {
  const labelOf = (key: string) => groups.flatMap((g) => g.capabilities).find((c) => c.key === key)?.label ?? key;

  if (isLoading || !preview) {
    return <BlockSkeleton className="h-40" />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-900">Vamos preparar seu workspace com:</p>

      <div className="space-y-3">
        {preview.groups.map((group) => (
          <div key={group.key} className="rounded-xl border border-black/10 p-3">
            <p className="text-sm font-medium text-gray-900">{group.label}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {group.capabilityKeys.map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                >
                  <CheckCircle2 size={11} /> {labelOf(key)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {preview.autoIncludedKeys.length > 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Incluímos automaticamente: {preview.autoIncludedKeys.map((k) => labelOf(k)).join(", ")} — necessário para o que você escolheu funcionar.
          </span>
        </div>
      ) : null}

      <p className="text-xs text-black/50">Você poderá adicionar ou remover funcionalidades posteriormente em Explore a Nokta.</p>
    </div>
  );
}
