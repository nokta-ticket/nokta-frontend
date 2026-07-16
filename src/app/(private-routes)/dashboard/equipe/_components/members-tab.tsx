"use client";

import { useState } from "react";
import { MoreVertical, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GenericStatusBadge } from "../../venue/estoque/_components/stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { MEMBER_STATUS_LABEL, VENUE_ROLE_LABEL, type MemberStatus, type VenueTeamMember } from "@/services/venue-team";
import { useVenueTeamMembers, useVenueTeamMutations } from "../_hooks/use-venue-team";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";

function statusTone(status: MemberStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "warning" as const;
  if (status === "REMOVED") return "danger" as const;
  return "neutral" as const;
}

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function MembersTab({ orgId, onOpenMember }: { orgId: number; onOpenMember: (memberId: number) => void }) {
  const { data: members, isLoading, isError, refetch } = useVenueTeamMembers(orgId);
  const { updateStatus, removeMember } = useVenueTeamMutations(orgId);
  const [confirmRemove, setConfirmRemove] = useState<VenueTeamMember | null>(null);

  const handleStatus = async (member: VenueTeamMember, status: "ACTIVE" | "SUSPENDED") => {
    try {
      await updateStatus.mutateAsync({ memberId: member.memberId, status });
      toast.success(status === "SUSPENDED" ? "Membro suspenso." : "Membro reativado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível atualizar o status."));
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    try {
      await removeMember.mutateAsync(confirmRemove.memberId);
      toast.success("Membro removido.");
      setConfirmRemove(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover o membro."));
    }
  };

  if (isError) return <ErrorState description="Não foi possível carregar a equipe." onRetry={() => refetch()} />;
  if (isLoading) return <TableSkeleton />;
  if (!members || members.length === 0) {
    return <EmptyState title="Nenhum membro ainda" description="Convide alguém para começar a montar a equipe desta organização." />;
  }

  return (
    <>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.memberId} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials(m.nome)}</AvatarFallback>
            </Avatar>

            <button className="min-w-0 flex-1 text-left" onClick={() => onOpenMember(m.memberId)}>
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-gray-900">{m.nome}</p>
                {m.isOrgOwner ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-violet-700">
                    <ShieldCheck size={12} /> Proprietário
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs text-black/50">{m.email}</p>
            </button>

            <div className="hidden shrink-0 sm:block">{m.venueRole ? VENUE_ROLE_LABEL[m.venueRole] : "Sem papel"}</div>
            <GenericStatusBadge label={MEMBER_STATUS_LABEL[m.status]} tone={statusTone(m.status)} />

            {!m.isOrgOwner ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Ações">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpenMember(m.memberId)}>Ver acesso</DropdownMenuItem>
                  {m.status === "ACTIVE" ? (
                    <DropdownMenuItem onClick={() => handleStatus(m, "SUSPENDED")}>Suspender</DropdownMenuItem>
                  ) : m.status === "SUSPENDED" ? (
                    <DropdownMenuItem onClick={() => handleStatus(m, "ACTIVE")}>Reativar</DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={() => setConfirmRemove(m)}>
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="w-9" />
            )}
          </div>
        ))}
      </div>

      <Dialog open={confirmRemove !== null} onOpenChange={(v) => !v && setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover {confirmRemove?.nome}?</DialogTitle>
            <DialogDescription>
              O acesso é revogado imediatamente. O histórico de ações continua preservado — a pessoa pode ser convidada de novo no futuro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
