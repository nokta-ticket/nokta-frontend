"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { ORG_SEGMENTS, ORG_SEGMENT_LABEL, type BusinessProfile, type OrgSegment } from "@/services/platform";
import { useSaveBusinessProfile } from "../../_hooks/use-platform";

export function StepNegocio({ orgId, profile, onNext }: { orgId: number; profile: BusinessProfile; onNext: () => void }) {
  const save = useSaveBusinessProfile(orgId);

  const [segments, setSegments] = useState<OrgSegment[]>(profile.segments);
  const [hasPhysicalVenue, setHasPhysicalVenue] = useState(profile.hasPhysicalVenue);
  const [numberOfLocations, setNumberOfLocations] = useState(profile.numberOfLocations ? String(profile.numberOfLocations) : "");

  useEffect(() => {
    setSegments(profile.segments);
    setHasPhysicalVenue(profile.hasPhysicalVenue);
    setNumberOfLocations(profile.numberOfLocations ? String(profile.numberOfLocations) : "");
  }, [profile]);

  const toggleSegment = (segment: OrgSegment) => {
    setSegments((prev) => (prev.includes(segment) ? prev.filter((s) => s !== segment) : [...prev, segment]));
  };

  const handleNext = () => {
    save.mutate(
      { segments, hasPhysicalVenue, numberOfLocations: numberOfLocations ? Number(numberOfLocations) : undefined },
      {
        onSuccess: onNext,
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sobre o seu negócio</CardTitle>
        <CardDescription>Pode marcar mais de um — sua operação não precisa se encaixar em uma categoria só.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ORG_SEGMENTS.map((segment) => (
            <label key={segment} className="flex items-center gap-2 text-sm">
              <Checkbox checked={segments.includes(segment)} onCheckedChange={() => toggleSegment(segment)} />
              {ORG_SEGMENT_LABEL[segment]}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={hasPhysicalVenue} onCheckedChange={(v) => setHasPhysicalVenue(Boolean(v))} />
            Possuo espaço físico
          </label>
          <div>
            <Label htmlFor="onboarding-locations" className="mb-1 block text-xs font-medium text-black/50">
              Número de unidades (opcional)
            </Label>
            <Input
              id="onboarding-locations"
              type="number"
              min={1}
              value={numberOfLocations}
              onChange={(e) => setNumberOfLocations(e.target.value)}
              className="max-w-40"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleNext} disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Continuar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
