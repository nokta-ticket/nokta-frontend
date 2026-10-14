"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { ORG_SEGMENTS, ORG_SEGMENT_LABEL, type OrgSegment, type SaveBusinessProfilePayload } from "@/services/platform";
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

/** Linha de checkbox com alvo de toque inteiro (44px) e estado visual claro. */
function CheckRow({ checked, onChange, disabled, children }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors", checked ? "border-brand/40 bg-brand-soft/60 text-foreground" : "border-border bg-surface-2/60 text-foreground hover:border-border-strong", disabled && "cursor-default opacity-70")}>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} disabled={disabled} />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

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

  if (isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (isError || !profile) {
    return <ErrorState description="Não foi possível carregar o perfil operacional." onRetry={() => refetch()} />;
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
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Como o seu negócio funciona</CardTitle>
          <CardDescription>
            Isso ajuda a Nokta a recomendar as funcionalidades certas em <span className="font-medium text-foreground">Explore a Nokta</span> — não muda nada sozinho na sua operação.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-foreground">O que descreve seu negócio</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {ORG_SEGMENTS.map((segment) => (
              <CheckRow key={segment} checked={segments.includes(segment)} onChange={() => toggleSegment(segment)} disabled={!canManage}>
                {ORG_SEGMENT_LABEL[segment]}
              </CheckRow>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CheckRow checked={hasPhysicalVenue} onChange={setHasPhysicalVenue} disabled={!canManage}>
            Possuo espaço físico
          </CheckRow>
          <Field label="Número de unidades" htmlFor="numberOfLocations" optional>
            <Input id="numberOfLocations" type="number" min={1} inputMode="numeric" value={numberOfLocations} onChange={(e) => setNumberOfLocations(e.target.value)} disabled={!canManage} className="max-w-40" />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-foreground">Como recebe e atende clientes</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {OPERATION_FIELDS.map((field) => (
              <CheckRow key={field.key as string} checked={Boolean(flags[field.key as string])} onChange={(v) => setFlags((prev) => ({ ...prev, [field.key as string]: v }))} disabled={!canManage}>
                {field.label}
              </CheckRow>
            ))}
          </div>
        </fieldset>
      </CardContent>
      <CardFooter className="justify-between">
        <p className="text-caption text-muted-foreground">{canManage ? "As recomendações são recalculadas ao salvar." : "Somente o proprietário ou um gerente autorizado pode alterar o perfil operacional."}</p>
        {canManage ? (
          <Button onClick={handleSave} loading={save.isPending} leftIcon="save">
            Salvar perfil
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
