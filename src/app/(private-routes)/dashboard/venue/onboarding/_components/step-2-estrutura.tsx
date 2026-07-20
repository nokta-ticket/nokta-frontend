"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { useVenueAreaMutations, useVenueTableMutations, useVenueTables } from "../../../operacao/_hooks/use-venue-areas-tables";
import { useVenueCashRegisterMutations, useVenueCashRegisters } from "../../../operacao/_hooks/use-venue-cash";

function ReadyRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-black/25" />}
      <span className={done ? "text-black/50 line-through" : "text-black/85"}>{label}</span>
    </div>
  );
}

export function Step2Estrutura({
  orgId,
  locationId,
  operationMode,
  onNext,
  onBack,
}: {
  orgId: number;
  locationId: number;
  operationMode: string | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const { data: tables } = useVenueTables(orgId, locationId);
  const { data: cashRegisters } = useVenueCashRegisters(orgId, locationId);
  const { create: createArea } = useVenueAreaMutations(orgId, locationId);
  const { create: createTable } = useVenueTableMutations(orgId, locationId);

  const [areaNome, setAreaNome] = useState("Salão");
  const [quantidade, setQuantidade] = useState(10);
  const [capacidade, setCapacidade] = useState(4);
  const [prefixo, setPrefixo] = useState("Mesa");
  const [creatingTables, setCreatingTables] = useState(false);

  const [cashNome, setCashNome] = useState("Caixa principal");
  const { create: createCashRegister } = useVenueCashRegisterMutations(orgId, locationId);

  const needsTables = operationMode !== "COUNTER_SERVICE";
  const hasTables = (tables?.length ?? 0) > 0;
  const hasCashRegister = (cashRegisters?.length ?? 0) > 0;

  const handleCreateTables = async () => {
    if (!areaNome.trim() || quantidade < 1) {
      toast.error("Informe a área e uma quantidade válida de mesas.");
      return;
    }
    setCreatingTables(true);
    try {
      const area = await createArea.mutateAsync({ nome: areaNome.trim() });
      const pad = quantidade >= 100 ? 3 : 2;
      for (let i = 1; i <= quantidade; i++) {
        // eslint-disable-next-line no-await-in-loop
        await createTable.mutateAsync({
          areaId: area.id,
          nome: `${prefixo} ${String(i).padStart(pad, "0")}`,
          capacidade,
        });
      }
      toast.success(`Área "${area.nome}" criada com ${quantidade} mesas.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível criar as mesas."));
    } finally {
      setCreatingTables(false);
    }
  };

  const handleCreateCashRegister = () => {
    if (!cashNome.trim()) {
      toast.error("Informe o nome do caixa.");
      return;
    }
    createCashRegister.mutate(
      { nome: cashNome.trim() },
      {
        onSuccess: () => toast.success("Caixa cadastrado."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cadastrar o caixa.")),
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Status atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {needsTables ? <ReadyRow done={hasTables} label="Ao menos uma mesa cadastrada" /> : null}
          <ReadyRow done={hasCashRegister} label="Ao menos um caixa cadastrado" />
          {!needsTables ? <p className="text-xs text-black/40">Operação por balcão — mesas não são obrigatórias.</p> : null}
        </CardContent>
      </Card>

      {needsTables ? (
        <Card>
          <CardHeader>
            <CardTitle>Criar área com mesas</CardTitle>
            <CardDescription>Crie uma área e várias mesas de uma vez. Você pode editar depois em Operação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Área</Label>
                <Input value={areaNome} onChange={(e) => setAreaNome(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" min={1} max={200} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Capacidade padrão</Label>
                <Input type="number" min={1} value={capacidade} onChange={(e) => setCapacidade(Number(e.target.value))} />
              </div>
            </div>
            <div className="max-w-[200px] space-y-1.5">
              <Label>Prefixo do nome</Label>
              <Input value={prefixo} onChange={(e) => setPrefixo(e.target.value)} />
              <p className="text-xs text-black/40">
                Gera &quot;{prefixo} 01&quot; até &quot;{prefixo} {String(quantidade).padStart(2, "0")}&quot;.
              </p>
            </div>
            <Button variant="outline" onClick={handleCreateTables} disabled={creatingTables}>
              {creatingTables ? "Criando…" : "Criar área e mesas"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar caixa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="max-w-xs flex-1 space-y-1.5">
            <Label>Nome do caixa</Label>
            <Input value={cashNome} onChange={(e) => setCashNome(e.target.value)} />
          </div>
          <Button variant="outline" onClick={handleCreateCashRegister} disabled={createCashRegister.isPending}>
            {createCashRegister.isPending ? "Cadastrando…" : "Cadastrar caixa"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext}>Continuar</Button>
      </div>
    </div>
  );
}
