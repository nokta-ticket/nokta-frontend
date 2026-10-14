"use client";

import { useState } from "react";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { MEMBER_STATUS_LABEL, VENUE_ROLE_LABEL, type MemberStatus, type VenueTeamMember } from "@/services/venue-team";
import { useVenueTeamMembers, useVenueTeamMutations } from "../_hooks/use-venue-team";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";

const STATUS_TONE: Record<MemberStatus, Tone> = { ACTIVE: "success", INVITED: "neutral", SUSPENDED: "warning", REMOVED: "danger" };

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function MemberAvatar({ nome }: { nome: string }) {
  return (
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-caption font-semibold text-brand">
      {initials(nome)}
    </span>
  );
}

function MemberIdentity({ member }: { member: VenueTeamMember }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <MemberAvatar nome={member.nome} />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
          <span className="truncate">{member.nome}</span>
          {member.isOrgOwner ? <Icon name="crown" size={11} className="shrink-0 text-warning" aria-label="Proprietário" /> : null}
        </p>
        <p className="truncate text-caption text-muted-foreground">{member.email}</p>
      </div>
    </div>
  );
}

export function MembersTab({ orgId, canManage, onOpenMember }: { orgId: number; canManage: boolean; onOpenMember: (memberId: number) => void }) {
  const { data: members, isLoading, isError, refetch } = useVenueTeamMembers(orgId);
  const { updateStatus, removeMember } = useVenueTeamMutations(orgId);
  const [confirmRemove, setConfirmRemove] = useState<VenueTeamMember | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);

  const handleStatus = async (member: VenueTeamMember, status: "ACTIVE" | "SUSPENDED") => {
    setPendingStatusId(member.memberId);
    try {
      await updateStatus.mutateAsync({ memberId: member.memberId, status });
      toast.success(status === "SUSPENDED" ? "Membro suspenso." : "Membro reativado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível atualizar o status."));
    } finally {
      setPendingStatusId(null);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    try {
      await removeMember.mutateAsync(confirmRemove.memberId);
      toast.success("Membro removido.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover o membro."));
      throw err;
    }
  };

  if (isError) return <ErrorState description="Não foi possível carregar a equipe." onRetry={() => refetch()} />;
  if (isLoading) return <RowsSkeleton rows={4} />;
  if (!members || members.length === 0) {
    return <EmptyState icon="users" title="Nenhum membro ainda" description="Convide alguém para começar a montar a equipe desta organização." />;
  }

  const rowActions = (m: VenueTeamMember) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label={`Ver acesso de ${m.nome}`} title="Ver acesso" onClick={() => onOpenMember(m.memberId)}>
        <Icon name="eye" size={14} />
      </Button>
      {canManage && !m.isOrgOwner ? (
        <>
          {m.status === "ACTIVE" ? (
            <Button variant="subtle" size="icon-sm" aria-label={`Suspender ${m.nome}`} title="Suspender" loading={pendingStatusId === m.memberId} onClick={() => handleStatus(m, "SUSPENDED")} className="hover:text-warning">
              <Icon name="ban" size={14} />
            </Button>
          ) : m.status === "SUSPENDED" ? (
            <Button variant="subtle" size="icon-sm" aria-label={`Reativar ${m.nome}`} title="Reativar" loading={pendingStatusId === m.memberId} onClick={() => handleStatus(m, "ACTIVE")} className="hover:text-success">
              <Icon name="check" size={14} />
            </Button>
          ) : null}
          <Button variant="subtle" size="icon-sm" aria-label={`Remover ${m.nome}`} title="Remover" onClick={() => setConfirmRemove(m)} className="hover:bg-danger-bg hover:text-danger">
            <Icon name="trash" size={14} />
          </Button>
        </>
      ) : null}
    </>
  );

  return (
    <>
      <DataTableShell
        maxHeight="calc(100dvh - 26rem)"
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Membro</DataTableHeadCell>
                <DataTableHeadCell>Papel</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell align="right">Ações</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {members.map((m, i) => (
                <DataTableRow key={m.memberId} index={i} onClick={() => onOpenMember(m.memberId)}>
                  <DataTableCell>
                    <MemberIdentity member={m} />
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">{m.isOrgOwner ? "Proprietário" : m.venueRole ? VENUE_ROLE_LABEL[m.venueRole] : "Sem papel"}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone={STATUS_TONE[m.status]}>{MEMBER_STATUS_LABEL[m.status]}</StatusBadge>
                  </DataTableCell>
                  <DataTableCell align="right" stopPropagation>
                    <div className="flex items-center justify-end gap-0.5">{rowActions(m)}</div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        }
        mobile={
          <MobileCardList>
            {members.map((m, i) => (
              <MobileCard
                key={m.memberId}
                index={i}
                leading={<MemberAvatar nome={m.nome} />}
                title={m.nome}
                subtitle={m.email}
                badge={<StatusBadge tone={STATUS_TONE[m.status]}>{MEMBER_STATUS_LABEL[m.status]}</StatusBadge>}
                meta={[{ label: "Papel", value: m.isOrgOwner ? "Proprietário" : m.venueRole ? VENUE_ROLE_LABEL[m.venueRole] : "Sem papel" }]}
                onClick={() => onOpenMember(m.memberId)}
                actions={rowActions(m)}
              />
            ))}
          </MobileCardList>
        }
      />

      <ConfirmDialog
        open={confirmRemove !== null}
        onOpenChange={(v) => !v && setConfirmRemove(null)}
        danger
        icon="trash"
        title={`Remover ${confirmRemove?.nome ?? "membro"}?`}
        description="O acesso é revogado imediatamente. O histórico de ações continua preservado — a pessoa pode ser convidada de novo no futuro."
        confirmLabel="Remover"
        onConfirm={handleRemove}
      />
    </>
  );
}
