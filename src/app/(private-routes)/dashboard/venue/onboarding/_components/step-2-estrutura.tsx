"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { useVenueAreaMutations, useVenueTableMutations, useVenueTables } from "../../../operacao/_hooks/use-venue-areas-tables";
import { useVenueCashRegisterMutations, useVenueCashRegisters } from "../../../operacao/_hooks/use-venue-cash";
import { ReadyRow, StepNav } from "./step-nav";

export function Step2Estrutura({ orgId, locationId, operationMode, onNext, onBack }: { orgId: number; locationId: number; operationMode: string | null; onNext: () => void; onBack: () => void }) {
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
  const tableCount = tables?.length ?? 0;
  const cashCount = cashRegisters?.length ?? 0;
  const hasTables = tableCount > 0;
  const hasCashRegister = cashCount > 0;

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
        await createTable.mutateAsync({ areaId: area.id, nome: `${prefixo} ${String(i).padStart(pad, "0")}`, capacidade });
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
          <div>
            <CardTitle>Estrutura da casa</CardTitle>
            <CardDescription>{needsTables ? "Mesas por área e ao menos um caixa pra receber." : "Operação por balcão — mesas não são obrigatórias, só o caixa."}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ul>
            {needsTables ? <ReadyRow done={hasTables} label={hasTables ? `${tableCount} ${tableCount === 1 ? "mesa cadastrada" : "mesas cadastradas"}` : "Ao menos uma mesa cadastrada"} /> : null}
            <ReadyRow done={hasCashRegister} label={hasCashRegister ? `${cashCount} ${cashCount === 1 ? "caixa cadastrado" : "caixas cadastrados"}` : "Ao menos um caixa cadastrado"} />
          </ul>
        </CardContent>
      </Card>

      {needsTables ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Criar área com mesas</CardTitle>
              <CardDescription>Cria uma área e várias mesas de uma vez — dá pra editar depois em Mesas e comandas.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup columns={2}>
              <Field label="Área" htmlFor="setup-area">
                <Input id="setup-area" value={areaNome} onChange={(e) => setAreaNome(e.target.value)} placeholder="Salão, Varanda, Deck…" />
              </Field>
              <Field label="Prefixo das mesas" htmlFor="setup-prefixo" hint={`Gera "${prefixo} 01" até "${prefixo} ${String(quantidade).padStart(2, "0")}".`}>
                <Input id="setup-prefixo" value={prefixo} onChange={(e) => setPrefixo(e.target.value)} />
              </Field>
              <Field label="Quantidade" htmlFor="setup-qtd">
                <Input id="setup-qtd" type="number" inputMode="numeric" min={1} max={200} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              </Field>
              <Field label="Lugares por mesa" htmlFor="setup-cap">
                <Input id="setup-cap" type="number" inputMode="numeric" min={1} value={capacidade} onChange={(e) => setCapacidade(Number(e.target.value))} />
              </Field>
            </FieldGroup>
            <Button variant="outline" leftIcon="chair" onClick={handleCreateTables} loading={creatingTables}>
              Criar área e mesas
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Cadastrar caixa</CardTitle>
            <CardDescription>Um por ponto de cobrança. Sem caixa aberto, nenhuma venda pode ser recebida.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Nome do caixa" htmlFor="setup-caixa" className="flex-1 sm:max-w-xs">
            <Input id="setup-caixa" value={cashNome} onChange={(e) => setCashNome(e.target.value)} />
          </Field>
          <Button variant="outline" leftIcon="wallet" onClick={handleCreateCashRegister} loading={createCashRegister.isPending}>
            Cadastrar caixa
          </Button>
        </CardContent>
      </Card>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
