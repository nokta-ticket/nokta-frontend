"use client";

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { INVITATION_STATUS_LABEL, VENUE_ROLE_LABEL, type InvitationStatus, type VenueRoleKey } from "@/services/venue-team";
import { useVenueTeamInvitations, useVenueTeamMutations } from "../_hooks/use-venue-team";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";

function statusTone(status: InvitationStatus) {
  if (status === "ACCEPTED") return "success" as const;
  if (status === "PENDING") return "neutral" as const;
  return "danger" as const;
}

export function InvitationsTab({ orgId }: { orgId: number }) {
  const { data: invitations, isLoading, isError, refetch } = useVenueTeamInvitations(orgId);
  const { resendInvitation, revokeInvitation } = useVenueTeamMutations(orgId);

  const handleResend = async (id: number) => {
    try {
      await resendInvitation.mutateAsync(id);
      toast.success("Convite reenviado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível reenviar o convite."));
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      await revokeInvitation.mutateAsync(id);
      toast.success("Convite revogado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível revogar o convite."));
    }
  };

  if (isError) return <ErrorState description="Não foi possível carregar os convites." onRetry={() => refetch()} />;
  if (isLoading) return <TableSkeleton />;
  if (!invitations || invitations.length === 0) {
    return <EmptyState title="Nenhum convite ainda" description="Convites enviados aparecerão aqui, com status até serem aceitos ou expirarem." />;
  }

  return (
    <div className="space-y-2">
      {invitations.map((inv) => (
        <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{inv.email}</p>
            <p className="truncate text-xs text-black/50">
              {VENUE_ROLE_LABEL[inv.roleKey as VenueRoleKey] ?? inv.roleKey} · convidado por {inv.invitedBy.nome}
            </p>
          </div>
          <GenericStatusBadge label={INVITATION_STATUS_LABEL[inv.status]} tone={statusTone(inv.status)} />
          {inv.status === "PENDING" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ações">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleResend(inv.id)}>Reenviar</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => handleRevoke(inv.id)}>Revogar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="w-9" />
          )}
        </div>
      ))}
    </div>
  );
}
