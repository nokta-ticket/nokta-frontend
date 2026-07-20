"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { BusinessProfile, SaveBusinessProfilePayload } from "@/services/platform";
import { useSaveBusinessProfile } from "../../_hooks/use-platform";

const FIELDS: { key: keyof SaveBusinessProfilePayload; label: string }[] = [
  { key: "sellsAdvanceTickets", label: "Vendo ingressos antecipadamente" },
  { key: "usesGuestLists", label: "Trabalho com convidados ou listas" },
  { key: "acceptsReservations", label: "Aceito reservas" },
  { key: "usesTables", label: "Atendo por mesas" },
  { key: "usesTabs", label: "Trabalho com comandas" },
  { key: "usesCounterService", label: "Atendo no balcão" },
  { key: "sellsFoodOrBeverages", label: "Vendo alimentos ou bebidas" },
  { key: "usesPreparationStations", label: "Possuo cozinha ou bar" },
  { key: "controlsInventory", label: "Quero controlar estoque" },
  { key: "worksWithPromoters", label: "Trabalho com promoters" },
];

export function StepOperacao({
  orgId,
  profile,
  onNext,
  onBack,
}: {
  orgId: number;
  profile: BusinessProfile;
  onNext: () => void;
  onBack: () => void;
}) {
  const save = useSaveBusinessProfile(orgId);
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const f of FIELDS) next[f.key as string] = Boolean(profile[f.key as keyof BusinessProfile]);
    setFlags(next);
  }, [profile]);

  const handleNext = () => {
    save.mutate(flags, {
      onSuccess: onNext,
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Como você recebe e atende clientes</CardTitle>
        <CardDescription>Marque só o que já faz ou pretende fazer — nada aqui obriga a configurar algo agora.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key as string} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={Boolean(flags[field.key as string])}
                onCheckedChange={(v) => setFlags((prev) => ({ ...prev, [field.key as string]: Boolean(v) }))}
              />
              {field.label}
            </label>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={handleNext} disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Continuar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
