"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueAmenityItem } from "@/services/venue-menu";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useUpdateVenueAmenities, useVenueAmenities } from "../_hooks/use-venue-amenities";

/**
 * "Informações úteis" da Home pública (Valet, Wi-Fi, Pet friendly, etc.) —
 * mesma área/permissão da vitrine pública (logo/banner/Instagram/WhatsApp
 * em menu-header.tsx), catálogo FIXO (não dá pra criar/remover item, só
 * ligar/desligar + preencher o texto de cada um).
 */
export function AmenitiesDialog({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: amenities, isLoading } = useVenueAmenities(orgId);
  const update = useUpdateVenueAmenities(orgId);

  // Rascunho local de valor de texto (só grava no blur/debounce simples,
  // não a cada tecla) — o toggle grava na hora.
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (amenities) {
      setDraftValues(Object.fromEntries(amenities.map((item) => [item.key, item.value ?? ""])));
    }
  }, [amenities]);

  const handleToggle = async (item: VenueAmenityItem, enabled: boolean) => {
    try {
      await update.mutateAsync([{ key: item.key, enabled, value: draftValues[item.key] || undefined }]);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível atualizar."));
    }
  };

  const handleValueBlur = async (item: VenueAmenityItem) => {
    const value = draftValues[item.key] ?? "";
    if (value === (item.value ?? "")) return;
    try {
      await update.mutateAsync([{ key: item.key, enabled: item.enabled, value: value || undefined }]);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Informações úteis</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Escolha o que aparece na página inicial pública do seu estabelecimento.
        </p>

        {isLoading || !amenities ? (
          <BlockSkeleton className="h-64" />
        ) : (
          <div className="divide-y divide-black/5">
            {amenities.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`amenity-${item.key}`} className="font-medium">
                    {item.label}
                  </Label>
                  <Input
                    id={`amenity-value-${item.key}`}
                    value={draftValues[item.key] ?? ""}
                    onChange={(e) => setDraftValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    onBlur={() => handleValueBlur(item)}
                    placeholder="Ex.: Gratuito, R$ 30,00…"
                    disabled={!item.enabled}
                    className="mt-2"
                  />
                </div>
                <Switch
                  id={`amenity-${item.key}`}
                  checked={item.enabled}
                  onCheckedChange={(checked) => handleToggle(item, checked)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
