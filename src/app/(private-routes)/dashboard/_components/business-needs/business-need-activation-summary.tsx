"use client";

import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import type { BusinessNeedGroup, BusinessNeedsActivationPreview } from "@/services/platform";

/** "Vamos preparar seu workspace com:" — resumo antes de confirmar (onboarding). */
export function BusinessNeedActivationSummary({ groups, preview, isLoading }: { groups: BusinessNeedGroup[]; preview: BusinessNeedsActivationPreview | undefined; isLoading: boolean }) {
  const labelOf = (key: string) => groups.flatMap((g) => g.capabilities).find((c) => c.key === key)?.label ?? key;

  if (isLoading || !preview) {
    return <Skeleton className="h-40 w-full rounded-card" />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-foreground">Vamos preparar seu workspace com:</p>

      <div className="space-y-3">
        {preview.groups.map((group) => (
          <div key={group.key} className="surface-inset rounded-xl p-3.5">
            <p className="text-sm font-medium text-foreground">{group.label}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {group.capabilityKeys.map((key) => (
                <span key={key} className="inline-flex items-center gap-1 rounded-pill bg-success-bg px-2 py-0.5 text-caption font-medium text-success ring-1 ring-inset ring-success-ring">
                  <Icon name="check" size={9} /> {labelOf(key)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {preview.autoIncludedKeys.length > 0 ? (
        <Callout tone="brand">Incluímos automaticamente: {preview.autoIncludedKeys.map((k) => labelOf(k)).join(", ")} — necessário para o que você escolheu funcionar.</Callout>
      ) : null}

      <p className="text-caption text-subtle-foreground">Você pode adicionar ou remover funcionalidades depois em Explore a Nokta.</p>
    </div>
  );
}
