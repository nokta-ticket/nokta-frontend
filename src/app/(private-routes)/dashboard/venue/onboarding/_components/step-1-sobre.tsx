"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import { Callout } from "@/components/ui/callout";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { VENUE_BUSINESS_TYPES, VENUE_BUSINESS_TYPE_LABEL, VENUE_OPERATION_MODES, VENUE_OPERATION_MODE_LABEL, type VenueBusinessType, type VenueOperationMode, type VenueSetupStatus } from "@/services/venue-setup";
import type { VenueLocation } from "@/services/venue-operation";
import { useVenueLocationMutations } from "../../../operacao/_hooks/use-venue-locations";
import { useSaveVenueSetupProfile } from "../../../configuracoes/_hooks/use-venue-settings";
import { StepNav } from "./step-nav";

export function Step1Sobre({ orgId, status, mainLocation, onNext }: { orgId: number; status: VenueSetupStatus; mainLocation: VenueLocation | null; onNext: () => void }) {
  const saveProfile = useSaveVenueSetupProfile(orgId);
  const { create } = useVenueLocationMutations(orgId);

  const [businessType, setBusinessType] = useState<VenueBusinessType | "">(status.profile?.businessType ?? "");
  const [operationMode, setOperationMode] = useState<VenueOperationMode | "">(status.profile?.operationMode ?? "");
  const [nome, setNome] = useState(mainLocation?.nome ?? "Unidade principal");
  const [telefone, setTelefone] = useState(mainLocation?.telefone ?? "");
  const [endereco, setEndereco] = useState(mainLocation?.endereco ?? "");
  const [timezone, setTimezone] = useState(mainLocation?.timezone ?? "America/Sao_Paulo");

  useEffect(() => {
    if (mainLocation) {
      setNome(mainLocation.nome);
      setTelefone(mainLocation.telefone ?? "");
      setEndereco(mainLocation.endereco ?? "");
      setTimezone(mainLocation.timezone);
    }
  }, [mainLocation]);

  const isPending = saveProfile.isPending || create.isPending;
  const locked = Boolean(mainLocation);

  const handleContinue = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da unidade principal.");
      return;
    }
    try {
      await saveProfile.mutateAsync({ ...(businessType && { businessType }), ...(operationMode && { operationMode }), lastStep: "sobre" });
      if (!mainLocation) {
        await create.mutateAsync({ nome: nome.trim(), telefone, endereco, timezone, isMain: true });
      }
      onNext();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar."));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sobre o estabelecimento</CardTitle>
            <CardDescription>Orienta o resto da configuração — dá pra ajustar depois.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <FieldGroup columns={2}>
            <Field label="Tipo de negócio">
              <SelectInput value={businessType || undefined} onValueChange={(v) => setBusinessType(v as VenueBusinessType)} placeholder="Selecione" options={VENUE_BUSINESS_TYPES.map((t) => ({ value: t, label: VENUE_BUSINESS_TYPE_LABEL[t] }))} />
            </Field>
            <Field label="Modo de operação" hint="Define se mesas são obrigatórias na próxima etapa.">
              <SelectInput value={operationMode || undefined} onValueChange={(v) => setOperationMode(v as VenueOperationMode)} placeholder="Selecione" options={VENUE_OPERATION_MODES.map((m) => ({ value: m, label: VENUE_OPERATION_MODE_LABEL[m] }))} />
            </Field>
          </FieldGroup>

          <div className="space-y-4 rounded-xl border border-border bg-surface-2/50 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Unidade principal</p>
              <p className="text-caption text-muted-foreground">O endereço físico onde a operação acontece.</p>
            </div>
            {locked ? <Callout tone="info" icon="check-circle">Unidade já criada — pra alterar, use Configurações &gt; Unidades.</Callout> : null}
            <Field label="Nome" htmlFor="setup-nome" required>
              <Input id="setup-nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={locked} />
            </Field>
            <FieldGroup columns={2}>
              <Field label="Telefone" htmlFor="setup-telefone" optional>
                <Input id="setup-telefone" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={locked} placeholder="(11) 99999-8888" />
              </Field>
              <Field label="Fuso horário" htmlFor="setup-tz">
                <Input id="setup-tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={locked} />
              </Field>
            </FieldGroup>
            <Field label="Endereço" htmlFor="setup-endereco" optional>
              <Input id="setup-endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} disabled={locked} placeholder="Rua, número — bairro, cidade/UF" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <StepNav onNext={handleContinue} loading={isPending} nextLabel={locked ? "Continuar" : "Salvar e continuar"} />
    </div>
  );
}
