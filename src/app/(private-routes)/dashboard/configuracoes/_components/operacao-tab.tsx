"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
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

  if (isLoading) return <Skeleton className="h-72 rounded-card" />;

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
          <div>
            <CardTitle>Taxa de serviço padrão</CardTitle>
            <CardDescription>Aplicada automaticamente a toda nova comanda aberta — nunca altera comandas já abertas.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Field label="Percentual" htmlFor="service-charge" className="max-w-[200px]">
            <Input id="service-charge" type="number" min={0} max={100} step="0.5" inputMode="decimal" suffix="%" value={percent} onChange={(e) => setPercent(e.target.value)} disabled={!canManage} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium text-foreground">Exigir caixa aberto para registrar pagamento</span>
              <span className="mt-0.5 block text-caption text-muted-foreground">Desative apenas se o estabelecimento não trabalha com caixa físico.</span>
            </span>
            <Switch checked={requireCash} onCheckedChange={setRequireCash} disabled={!canManage} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Estoque negativo</CardTitle>
            <CardDescription>Configurado por unidade, dentro do Estoque.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/estoque">
              <Icon name="box" size={14} />
              Ir para Estoque
            </Link>
          </Button>
        </CardContent>
      </Card>

      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={update.isPending} leftIcon="save">
            Salvar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
