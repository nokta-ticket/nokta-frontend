"use client";

import { useState } from "react";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { formatDateBR } from "@/lib/format";
import { INVITATION_STATUS_LABEL, VENUE_ROLE_LABEL, type InvitationStatus, type VenueRoleKey, type VenueTeamInvitation } from "@/services/venue-team";
import { useVenueTeamInvitations, useVenueTeamMutations } from "../_hooks/use-venue-team";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";

const STATUS_TONE: Record<InvitationStatus, Tone> = { PENDING: "warning", ACCEPTED: "success", REVOKED: "danger", EXPIRED: "neutral" };

export function InvitationsTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: invitations, isLoading, isError, refetch } = useVenueTeamInvitations(orgId);
  const { resendInvitation, revokeInvitation } = useVenueTeamMutations(orgId);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<VenueTeamInvitation | null>(null);

  const handleResend = async (id: number) => {
    setResendingId(id);
    try {
      await resendInvitation.mutateAsync(id);
      toast.success("Convite reenviado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível reenviar o convite."));
    } finally {
      setResendingId(null);
    }
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) return;
    try {
      await revokeInvitation.mutateAsync(confirmRevoke.id);
      toast.success("Convite revogado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível revogar o convite."));
      throw err;
    }
  };

  if (isError) return <ErrorState description="Não foi possível carregar os convites." onRetry={() => refetch()} />;
  if (isLoading) return <RowsSkeleton rows={3} />;
  if (!invitations || invitations.length === 0) {
    return <EmptyState icon="mail" title="Nenhum convite ainda" description="Convites enviados aparecem aqui, com status até serem aceitos ou expirarem." />;
  }

  const roleLabel = (inv: VenueTeamInvitation) => VENUE_ROLE_LABEL[inv.roleKey as VenueRoleKey] ?? inv.roleKey;

  const rowActions = (inv: VenueTeamInvitation) =>
    canManage && inv.status === "PENDING" ? (
      <>
        <Button variant="subtle" size="icon-sm" aria-label={`Reenviar convite para ${inv.email}`} title="Reenviar" loading={resendingId === inv.id} onClick={() => handleResend(inv.id)}>
          <Icon name="send" size={14} />
        </Button>
        <Button variant="subtle" size="icon-sm" aria-label={`Revogar convite de ${inv.email}`} title="Revogar" onClick={() => setConfirmRevoke(inv)} className="hover:bg-danger-bg hover:text-danger">
          <Icon name="ban" size={14} />
        </Button>
      </>
    ) : null;

  return (
    <>
      <DataTableShell
        maxHeight="calc(100dvh - 26rem)"
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>E-mail</DataTableHeadCell>
                <DataTableHeadCell>Papel</DataTableHeadCell>
                <DataTableHeadCell>Convidado por</DataTableHeadCell>
                <DataTableHeadCell>Expira em</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell align="right">Ações</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {invitations.map((inv, i) => (
                <DataTableRow key={inv.id} index={i}>
                  <DataTableCell className="font-medium">{inv.email}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">{roleLabel(inv)}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">{inv.invitedBy.nome}</DataTableCell>
                  <DataTableCell className="text-muted-foreground tnum">{formatDateBR(inv.expiresAt)}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone={STATUS_TONE[inv.status]}>{INVITATION_STATUS_LABEL[inv.status]}</StatusBadge>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-0.5">{rowActions(inv)}</div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        }
        mobile={
          <MobileCardList>
            {invitations.map((inv, i) => (
              <MobileCard
                key={inv.id}
                index={i}
                title={inv.email}
                subtitle={`Convidado por ${inv.invitedBy.nome}`}
                badge={<StatusBadge tone={STATUS_TONE[inv.status]}>{INVITATION_STATUS_LABEL[inv.status]}</StatusBadge>}
                meta={[
                  { label: "Papel", value: roleLabel(inv) },
                  { label: "Expira em", value: formatDateBR(inv.expiresAt), num: true },
                ]}
                actions={rowActions(inv)}
              />
            ))}
          </MobileCardList>
        }
      />

      <ConfirmDialog
        open={confirmRevoke !== null}
        onOpenChange={(v) => !v && setConfirmRevoke(null)}
        danger
        icon="ban"
        title="Revogar este convite?"
        description={`${confirmRevoke?.email ?? "A pessoa"} não vai mais conseguir aceitar o convite. Você pode convidar de novo depois.`}
        confirmLabel="Revogar"
        onConfirm={handleRevoke}
      />
    </>
  );
}
