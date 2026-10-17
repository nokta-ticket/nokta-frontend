"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { getErrorMessage } from "@/lib/axios";
import { clearPendingInvite, readPendingInvite } from "@/lib/pending-invite";
import { toast } from "@/lib/toast";
import { venueTeamApi, VENUE_ROLE_LABEL, type VenueInvitationPreview, type VenueRoleKey } from "@/services/venue-team";

/**
 * Convite de equipe aberto neste navegador e ainda não aceito (ver
 * lib/pending-invite.ts). Quem foi convidado não precisa criar workspace:
 * aceita aqui e entra direto no workspace de quem convidou. Quem quiser o
 * próprio workspace continua podendo criar logo abaixo.
 */
export function PendingInviteCallout({ onAccepted, className }: { onAccepted: () => void; className?: string }) {
  const [token] = useState(() => readPendingInvite());
  const [preview, setPreview] = useState<VenueInvitationPreview | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    venueTeamApi
      .previewInvitation(token)
      .then((data) => {
        if (active) setPreview(data);
      })
      // Expirado, revogado ou já aceito: some daqui e do navegador.
      .catch(() => clearPendingInvite(token));
    return () => {
      active = false;
    };
  }, [token]);

  if (!token || !preview) return null;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await venueTeamApi.acceptInvitation(token);
      clearPendingInvite(token);
      toast.success("Convite aceito! Bem-vindo(a) à equipe.");
      onAccepted();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível aceitar o convite."));
      setAccepting(false);
    }
  };

  const role = VENUE_ROLE_LABEL[preview.roleKey as VenueRoleKey] ?? preview.roleLabel;

  return (
    <Callout
      className={className}
      tone="info"
      icon="user-plus"
      title={`Você foi convidado(a) para a equipe de ${preview.organizationNome}`}
      action={
        <Button size="sm" shape="pill" loading={accepting} onClick={handleAccept}>
          Aceitar convite
        </Button>
      }
    >
      Função: {role}. Não precisa criar um workspace: aceite e entre direto no de quem te convidou.
    </Callout>
  );
}
