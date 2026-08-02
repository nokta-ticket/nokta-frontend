"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VenuePublicProfileForm } from "./venue-public-profile-form";

/**
 * Endereço/Instagram/WhatsApp da vitrine pública (logo e banner já saíram
 * daqui — moraram pro cabeçalho do cardápio, ver menu-header.tsx) —
 * configuração secundária, aberta a partir do menu "⋯" da tela de
 * Cardápio.
 */
export function PublicProfileDialog({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vitrine pública</DialogTitle>
        </DialogHeader>
        <VenuePublicProfileForm orgId={orgId} />
      </DialogContent>
    </Dialog>
  );
}
