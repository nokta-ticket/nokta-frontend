"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import {
  VENUE_BUSINESS_TYPES,
  VENUE_BUSINESS_TYPE_LABEL,
  VENUE_OPERATION_MODES,
  VENUE_OPERATION_MODE_LABEL,
  type VenueBusinessType,
  type VenueOperationMode,
} from "@/services/venue-setup";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useVenueLocations } from "../../venue/operacao/_hooks/use-venue-locations";
import { useSaveVenueSetupProfile, useVenueSetupStatus } from "../_hooks/use-venue-settings";

export function VenueTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: status, isLoading } = useVenueSetupStatus(orgId);
  const { data: locations } = useVenueLocations(orgId);
  const saveProfile = useSaveVenueSetupProfile(orgId);

  const [businessType, setBusinessType] = useState<VenueBusinessType | "">("");
  const [operationMode, setOperationMode] = useState<VenueOperationMode | "">("");

  useEffect(() => {
    if (status?.profile) {
      setBusinessType(status.profile.businessType ?? "");
      setOperationMode(status.profile.operationMode ?? "");
    }
  }, [status?.profile]);

  if (isLoading) return <BlockSkeleton className="h-72" />;

  const handleSave = () => {
    saveProfile.mutate(
      {
        ...(businessType && { businessType }),
        ...(operationMode && { operationMode }),
      },
      {
        onSuccess: () => toast.success("Preferências do Venue salvas."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")),
      },
    );
  };

  const mainLocation = locations?.find((l) => l.isMain);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sobre o estabelecimento</CardTitle>
          <CardDescription>Usado para orientar o onboarding e os textos do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo de negócio</Label>
              <Select
                value={businessType}
                onValueChange={(v) => setBusinessType(v as VenueBusinessType)}
                disabled={!canManage}
              >
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
              <Select
                value={operationMode}
                onValueChange={(v) => setOperationMode(v as VenueOperationMode)}
                disabled={!canManage}
              >
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

          {canManage ? (
            <Button onClick={handleSave} disabled={saveProfile.isPending}>
              {saveProfile.isPending ? "Salvando…" : "Salvar"}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unidade principal</CardTitle>
        </CardHeader>
        <CardContent>
          {mainLocation ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{mainLocation.nome}</span>
              <Badge variant="secondary">Principal</Badge>
            </div>
          ) : (
            <p className="text-sm text-black/50">Nenhuma unidade principal definida ainda.</p>
          )}
          <p className="mt-1 text-xs text-black/40">Gerencie unidades na aba &quot;Unidades&quot;.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuração inicial (onboarding)</CardTitle>
          <CardDescription>
            {status?.readyToOperate
              ? "Seu Venue está pronto para operar."
              : "Ainda há itens obrigatórios pendentes para operar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/venue/onboarding">Abrir assistente de configuração</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
