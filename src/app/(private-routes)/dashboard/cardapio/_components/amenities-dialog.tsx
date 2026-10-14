"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { VenueAmenityItem } from "@/services/venue-menu";
import { useUpdateVenueAmenities, useVenueAmenities } from "../_hooks/use-venue-amenities";

/**
 * "Informações úteis" da Home pública (Valet, Wi-Fi, Pet friendly…) —
 * catálogo FIXO: só liga/desliga e preenche o texto de cada item. O toggle
 * grava na hora; o texto grava no blur.
 */
export function AmenitiesDialog({ orgId, open, onOpenChange }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: amenities, isLoading } = useVenueAmenities(orgId);
  const update = useUpdateVenueAmenities(orgId);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (amenities) setDraftValues(Object.fromEntries(amenities.map((item) => [item.key, item.value ?? ""])));
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
      toast.success("Salvo");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Informações úteis</DialogTitle>
          <DialogDescription>Escolha o que aparece na página inicial pública do seu estabelecimento.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-0 pt-1">
          {isLoading || !amenities ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {amenities.map((item) => (
                <li key={item.key} className="flex items-start gap-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`amenity-${item.key}`} className={cn("text-sm font-medium", item.enabled ? "text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </label>
                    {item.enabled ? (
                      <Input
                        id={`amenity-value-${item.key}`}
                        value={draftValues[item.key] ?? ""}
                        onChange={(e) => setDraftValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
                        onBlur={() => handleValueBlur(item)}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        placeholder="Detalhe opcional — ex.: Gratuito, R$ 30 a noite…"
                        className="mt-2"
                      />
                    ) : null}
                  </div>
                  <Switch id={`amenity-${item.key}`} checked={item.enabled} onCheckedChange={(checked) => handleToggle(item, checked)} className="mt-1" />
                </li>
              ))}
            </ul>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
