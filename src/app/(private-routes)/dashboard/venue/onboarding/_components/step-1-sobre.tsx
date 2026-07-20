"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import {
  VENUE_BUSINESS_TYPES,
  VENUE_BUSINESS_TYPE_LABEL,
  VENUE_OPERATION_MODES,
  VENUE_OPERATION_MODE_LABEL,
  type VenueBusinessType,
  type VenueOperationMode,
  type VenueSetupStatus,
} from "@/services/venue-setup";
import type { VenueLocation } from "@/services/venue-operation";
import { useVenueLocationMutations } from "../../../operacao/_hooks/use-venue-locations";
import { useSaveVenueSetupProfile } from "../../../configuracoes/_hooks/use-venue-settings";

export function Step1Sobre({
  orgId,
  status,
  mainLocation,
  onNext,
}: {
  orgId: number;
  status: VenueSetupStatus;
  mainLocation: VenueLocation | null;
  onNext: () => void;
}) {
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

  const handleContinue = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da unidade principal.");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        ...(businessType && { businessType }),
        ...(operationMode && { operationMode }),
        lastStep: "sobre",
      });
      if (!mainLocation) {
        await create.mutateAsync({ nome: nome.trim(), telefone, endereco, timezone, isMain: true });
      }
      onNext();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sobre o estabelecimento</CardTitle>
        <CardDescription>Isso ajuda a orientar o restante da configuração — pode ser ajustado depois.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tipo de negócio</Label>
            <Select value={businessType} onValueChange={(v) => setBusinessType(v as VenueBusinessType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {VENUE_BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {VENUE_BUSINESS_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Modo de operação</Label>
            <Select value={operationMode} onValueChange={(v) => setOperationMode(v as VenueOperationMode)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {VENUE_OPERATION_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {VENUE_OPERATION_MODE_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Nome da unidade principal</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={Boolean(mainLocation)} />
          {mainLocation ? <p className="text-xs text-black/40">Já criada — edite em Configurações &gt; Unidades.</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={Boolean(mainLocation)} />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={Boolean(mainLocation)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Endereço (opcional)</Label>
          <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} disabled={Boolean(mainLocation)} />
        </div>

        <Button onClick={handleContinue} disabled={isPending}>
          {isPending ? "Salvando…" : "Continuar"}
        </Button>
      </CardContent>
    </Card>
  );
}
