"use client";

import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VenueSetupChecklistItem, VenueSetupStatus } from "@/services/venue-setup";

function ChecklistRow({ item }: { item: VenueSetupChecklistItem }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2.5">
        {item.done ? (
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
        ) : (
          <Circle size={18} className="shrink-0 text-black/25" />
        )}
        <span className={item.done ? "text-sm text-black/50 line-through" : "text-sm text-black/85"}>{item.label}</span>
      </div>
      {!item.done ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={item.route}>Configurar</Link>
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Checklist de prontidão do Venue — reutilizado no onboarding, na Início
 * (enquanto incompleto) e em Configurações. Ocultar (via `onDismiss`) nunca
 * marca como concluído, só some da tela até o usuário voltar a esta página.
 */
export function VenueReadinessChecklist({
  status,
  onDismiss,
  title = "Prontidão para operar",
}: {
  status: VenueSetupStatus;
  onDismiss?: () => void;
  title?: string;
}) {
  if (status.restricted) return null;

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          {title}
          <span className="text-sm font-normal text-black/40">{status.progress}%</span>
        </CardTitle>
        <CardDescription>
          {status.readyToOperate
            ? "Todos os itens obrigatórios estão prontos. Os recomendados ajudam a operar melhor."
            : "Complete os itens obrigatórios para conseguir vender."}
        </CardDescription>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Ocultar checklist"
            className="absolute right-4 top-4 text-black/30 hover:text-black/60"
          >
            <X size={16} />
          </button>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
          <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${status.progress}%` }} />
        </div>

        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-black/40">Obrigatórios para operar</p>
          <div className="divide-y">
            {status.requiredItems.map((item) => (
              <ChecklistRow key={item.key} item={item} />
            ))}
          </div>
        </div>

        {status.recommendedItems.length > 0 ? (
          <div className="mt-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-black/40">Recomendados</p>
            <div className="divide-y">
              {status.recommendedItems.map((item) => (
                <ChecklistRow key={item.key} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
