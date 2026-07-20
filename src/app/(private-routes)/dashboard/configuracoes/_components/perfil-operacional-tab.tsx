"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import {
  ORG_SEGMENTS,
  ORG_SEGMENT_LABEL,
  type OrgSegment,
  type SaveBusinessProfilePayload,
} from "@/services/platform";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useBusinessProfile, usePlatformNavigation, useSaveBusinessProfile } from "../../_hooks/use-platform";

const OPERATION_FIELDS: { key: keyof SaveBusinessProfilePayload; label: string }[] = [
  { key: "sellsAdvanceTickets", label: "Vendo ingressos antecipadamente" },
  { key: "acceptsReservations", label: "Aceito reservas" },
  { key: "usesGuestLists", label: "Trabalho com convidados ou listas" },
  { key: "usesTables", label: "Atendo por mesas" },
  { key: "usesTabs", label: "Trabalho com comandas" },
  { key: "usesCounterService", label: "Atendo no balcão" },
  { key: "sellsFoodOrBeverages", label: "Vendo alimentos ou bebidas" },
  { key: "usesPreparationStations", label: "Possuo cozinha ou bar" },
  { key: "controlsInventory", label: "Quero controlar estoque" },
  { key: "worksWithPromoters", label: "Trabalho com promoters" },
  { key: "wantsFinancialManagement", label: "Quero gestão financeira" },
  { key: "wantsBusinessInsights", label: "Quero inteligência do negócio (insights)" },
];

export function PerfilOperacionalTab({ orgId }: { orgId: number }) {
  const { data: profile, isLoading, isError, refetch } = useBusinessProfile(orgId);
  const { data: navigation } = usePlatformNavigation(orgId);
  const save = useSaveBusinessProfile(orgId);

  const canManage = navigation?.canExplore ?? false;

  const [segments, setSegments] = useState<OrgSegment[]>([]);
  const [hasPhysicalVenue, setHasPhysicalVenue] = useState(false);
  const [numberOfLocations, setNumberOfLocations] = useState<string>("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!profile) return;
    setSegments(profile.segments);
    setHasPhysicalVenue(profile.hasPhysicalVenue);
    setNumberOfLocations(profile.numberOfLocations ? String(profile.numberOfLocations) : "");
    const nextFlags: Record<string, boolean> = {};
    for (const f of OPERATION_FIELDS) nextFlags[f.key as string] = Boolean(profile[f.key as keyof typeof profile]);
    setFlags(nextFlags);
  }, [profile]);

  if (isLoading) return <BlockSkeleton className="h-96" />;
  if (isError || !profile) {
    return <EmptyState title="Não foi possível carregar o perfil operacional" description="Tente novamente em instantes." onAction={() => refetch()} actionLabel="Tentar novamente" />;
  }

  const toggleSegment = (segment: OrgSegment) => {
    setSegments((prev) => (prev.includes(segment) ? prev.filter((s) => s !== segment) : [...prev, segment]));
  };

  const handleSave = () => {
    const payload: SaveBusinessProfilePayload = {
      segments,
      hasPhysicalVenue,
      numberOfLocations: numberOfLocations ? Number(numberOfLocations) : undefined,
      ...flags,
      markCompleted: true,
    };
    save.mutate(payload, {
      onSuccess: () => toast.success("Perfil operacional atualizado."),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar o perfil.")),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Como o seu negócio funciona</CardTitle>
          <CardDescription>
            Isso ajuda a Nokta a recomendar as funcionalidades certas para você em{" "}
            <span className="font-medium">Explore a Nokta</span> — não muda nada sozinho na sua operação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-black/70">O que descreve seu negócio (pode marcar mais de um)</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ORG_SEGMENTS.map((segment) => (
                <label key={segment} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={segments.includes(segment)}
                    onCheckedChange={() => toggleSegment(segment)}
                    disabled={!canManage}
                  />
                  {ORG_SEGMENT_LABEL[segment]}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={hasPhysicalVenue} onCheckedChange={(v) => setHasPhysicalVenue(Boolean(v))} disabled={!canManage} />
              Possuo espaço físico
            </label>
            <div>
              <Label htmlFor="numberOfLocations" className="mb-1 block text-xs font-medium text-black/50">
                Número de unidades (opcional)
              </Label>
              <Input
                id="numberOfLocations"
                type="number"
                min={1}
                value={numberOfLocations}
                onChange={(e) => setNumberOfLocations(e.target.value)}
                disabled={!canManage}
                className="max-w-40"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-black/70">Como recebe e atende clientes</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OPERATION_FIELDS.map((field) => (
                <label key={field.key as string} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(flags[field.key as string])}
                    onCheckedChange={(v) => setFlags((prev) => ({ ...prev, [field.key as string]: Boolean(v) }))}
                    disabled={!canManage}
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </div>

          {canManage ? (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={save.isPending}>
                {save.isPending ? "Salvando…" : "Salvar perfil"}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-black/40">Somente o proprietário ou um gerente autorizado pode alterar o perfil operacional.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
