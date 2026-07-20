"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { Recommendation } from "@/services/platform";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useActivateCapability, useRecommendations } from "../../_hooks/use-platform";

export function StepCapacidades({ orgId, onNext, onBack }: { orgId: number; onNext: () => void; onBack: () => void }) {
  const { data: recommendations, isLoading } = useRecommendations(orgId);
  const activate = useActivateCapability(orgId);
  const [activatedKeys, setActivatedKeys] = useState<Set<string>>(new Set());
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handleActivate = (rec: Recommendation) => {
    setPendingKey(rec.capabilityKey);
    activate.mutate(rec.capabilityKey, {
      onSuccess: () => {
        setActivatedKeys((prev) => new Set(prev).add(rec.capabilityKey));
        toast.success(`${rec.label} ativada.`);
      },
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível ativar.")),
      onSettled: () => setPendingKey(null),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendado para você</CardTitle>
        <CardDescription>
          Com base no que você marcou, estas funcionalidades podem ajudar. Ative só o que fizer sentido agora — o resto continua
          disponível em Explore a Nokta quando quiser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <BlockSkeleton className="h-40" />
        ) : !recommendations || recommendations.length === 0 ? (
          <p className="text-sm text-black/50">Nenhuma recomendação por enquanto — você pode ativar funcionalidades quando quiser em Explore a Nokta.</p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec) => {
              const isActivated = activatedKeys.has(rec.capabilityKey);
              return (
                <div key={rec.capabilityKey} className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 text-sm">
                  <div>
                    <p className="font-medium">{rec.label}</p>
                    <p className="text-black/60">{rec.reason}</p>
                  </div>
                  {isActivated ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={14} /> Ativada
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleActivate(rec)} disabled={activate.isPending && pendingKey === rec.capabilityKey}>
                      {activate.isPending && pendingKey === rec.capabilityKey ? "Ativando…" : "Ativar"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={onNext}>Continuar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
