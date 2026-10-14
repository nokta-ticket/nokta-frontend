"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { VENUE_BUSINESS_TYPES, VENUE_BUSINESS_TYPE_LABEL, VENUE_OPERATION_MODES, VENUE_OPERATION_MODE_LABEL, type VenueBusinessType, type VenueOperationMode } from "@/services/venue-setup";
import { SELECT_CONTENT_CLASS, SELECT_TRIGGER_CLASS } from "../../_lib/form-classes";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
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

  if (isLoading) return <Skeleton className="h-72 rounded-card" />;

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
  const progress = Math.round((status?.progress ?? 0) * (status && status.progress <= 1 ? 100 : 1));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sobre o estabelecimento</CardTitle>
            <CardDescription>Orienta o onboarding e os textos do sistema.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FieldGroup columns={2}>
            <Field label="Tipo de negócio" htmlFor="venue-business-type">
              <Select value={businessType} onValueChange={(v) => setBusinessType(v as VenueBusinessType)} disabled={!canManage}>
                <SelectTrigger id="venue-business-type" className={SELECT_TRIGGER_CLASS}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASS}>
                  {VENUE_BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {VENUE_BUSINESS_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Modo de operação" htmlFor="venue-operation-mode">
              <Select value={operationMode} onValueChange={(v) => setOperationMode(v as VenueOperationMode)} disabled={!canManage}>
                <SelectTrigger id="venue-operation-mode" className={SELECT_TRIGGER_CLASS}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASS}>
                  {VENUE_OPERATION_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {VENUE_OPERATION_MODE_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
        {canManage ? (
          <CardFooter className="justify-end">
            <Button onClick={handleSave} loading={saveProfile.isPending} leftIcon="save">
              Salvar
            </Button>
          </CardFooter>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unidade principal</CardTitle>
          </CardHeader>
          <CardContent>
            {mainLocation ? (
              <div className="flex items-center gap-2">
                <Icon name="map-pin" size={14} className="text-brand" />
                <span className="text-sm font-medium text-foreground">{mainLocation.nome}</span>
                <StatusBadge tone="brand" dot={false}>
                  Principal
                </StatusBadge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma unidade principal definida ainda.</p>
            )}
            <p className="mt-2 text-caption text-subtle-foreground">Gerencie unidades na aba Unidades.</p>
          </CardContent>
        </Card>

        <Card accent={!status?.readyToOperate}>
          <CardHeader>
            <div>
              <CardTitle>Configuração inicial</CardTitle>
              <CardDescription>{status?.readyToOperate ? "Seu Venue está pronto para operar." : "Ainda há itens obrigatórios pendentes para operar."}</CardDescription>
            </div>
            <StatusBadge tone={status?.readyToOperate ? "success" : "warning"}>{status?.readyToOperate ? "Pronto" : `${progress}%`}</StatusBadge>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard/venue/onboarding">
                <Icon name="magic" size={14} />
                Abrir assistente de configuração
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
