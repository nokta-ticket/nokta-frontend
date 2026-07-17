"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useUpdateVenueOperationSettings, useVenueOperationSettings } from "../_hooks/use-venue-settings";

/** Converte basis points <-> percentual exibido (1000 bps = 10%). */
function bpsToPercent(bps: number): string {
  return (bps / 100).toString();
}
function percentToBps(percent: string): number {
  const n = Number(percent.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function OperacaoTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data, isLoading } = useVenueOperationSettings(orgId);
  const update = useUpdateVenueOperationSettings(orgId);

  const [percent, setPercent] = useState("0");
  const [requireCash, setRequireCash] = useState(true);

  useEffect(() => {
    if (data) {
      setPercent(bpsToPercent(data.defaultServiceChargeBps));
      setRequireCash(data.requireOpenCashSessionForPayments);
    }
  }, [data]);

  if (isLoading) return <BlockSkeleton className="h-72" />;

  const handleSave = () => {
    update.mutate(
      { defaultServiceChargeBps: percentToBps(percent), requireOpenCashSessionForPayments: requireCash },
      {
        onSuccess: () => toast.success("Configurações de operação salvas."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")),
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Taxa de serviço padrão</CardTitle>
          <CardDescription>
            Aplicada automaticamente a toda nova comanda aberta — nunca altera comandas já abertas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-[200px] space-y-1.5">
            <Label>Percentual (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              disabled={!canManage}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Exigir caixa aberto para registrar pagamento</p>
              <p className="text-xs text-black/50">
                Desative apenas se o estabelecimento não trabalha com caixa físico.
              </p>
            </div>
            <Switch checked={requireCash} onCheckedChange={setRequireCash} disabled={!canManage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estoque negativo</CardTitle>
          <CardDescription>Configurado por unidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/venue/estoque">Ir para Estoque</Link>
          </Button>
        </CardContent>
      </Card>

      {canManage ? (
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? "Salvando…" : "Salvar"}
        </Button>
      ) : null}
    </div>
  );
}
