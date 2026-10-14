"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { initials } from "@/lib/format";
import { ORG_PROMOTER_STATUS_LABEL, type OrganizationPromoter } from "@/services/promoters";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { usePromoterMutations, usePromoters } from "../_hooks/use-promoters";
import { ORG_PROMOTER_TONE, fmtDate } from "./promoter-meta";

export function PromotersTab({ orgId, canManage, onInvite }: { orgId: number; canManage: boolean; onInvite: () => void }) {
  const { data: promoters, isLoading, isError, refetch } = usePromoters(orgId);
  const { resendInvite, cancelInvite, suspend, reactivate, remove } = usePromoterMutations(orgId);
  const [confirm, setConfirm] = useState<{ kind: "remove" | "cancel"; p: OrganizationPromoter } | null>(null);

  const runAction = async (fn: () => Promise<unknown>, successMessage: string, errorMessage: string) => {
    try {
      await fn();
      toast.success(successMessage);
    } catch (err) {
      toast.error(getErrorMessage(err, errorMessage));
      throw err;
    }
  };

  if (isError) return <ErrorState description="Não foi possível carregar os promoters." onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-64 rounded-card" />;
  if (!promoters || promoters.length === 0) {
    return <EmptyState icon="megaphone" title="Nenhum promoter ainda" description="Convide promoters para começar a gerar links e códigos de atribuição." action={canManage ? <Button leftIcon="user-plus" onClick={onInvite}>Convidar promoter</Button> : undefined} />;
  }

  const name = (p: OrganizationPromoter) => p.promoterProfile?.displayName ?? p.inviteEmail;

  const actions = (p: OrganizationPromoter) =>
    canManage ? (
      <>
        {p.status === "INVITED" ? (
          <>
            <Button variant="subtle" size="icon-sm" aria-label="Reenviar convite" title="Reenviar convite" onClick={() => runAction(() => resendInvite.mutateAsync(p.id), "Convite reenviado", "Não foi possível reenviar o convite.").catch(() => undefined)}>
              <Icon name="send" size={13} />
            </Button>
            <Button variant="subtle" size="icon-sm" aria-label="Cancelar convite" title="Cancelar convite" className="hover:bg-danger-bg hover:text-danger" onClick={() => setConfirm({ kind: "cancel", p })}>
              <Icon name="x-circle" size={13} />
            </Button>
          </>
        ) : null}
        {p.status === "ACTIVE" ? (
          <Button variant="subtle" size="icon-sm" aria-label="Suspender" title="Suspender" onClick={() => runAction(() => suspend.mutateAsync(p.id), "Promoter suspenso", "Não foi possível suspender o promoter.").catch(() => undefined)}>
            <Icon name="ban" size={13} />
          </Button>
        ) : null}
        {p.status === "SUSPENDED" ? (
          <Button variant="subtle" size="icon-sm" aria-label="Reativar" title="Reativar" onClick={() => runAction(() => reactivate.mutateAsync(p.id), "Promoter reativado", "Não foi possível reativar o promoter.").catch(() => undefined)}>
            <Icon name="rotate" size={13} />
          </Button>
        ) : null}
        {p.status !== "REMOVED" ? (
          <Button variant="subtle" size="icon-sm" aria-label="Remover" title="Remover" className="hover:bg-danger-bg hover:text-danger" onClick={() => setConfirm({ kind: "remove", p })}>
            <Icon name="trash" size={13} />
          </Button>
        ) : null}
      </>
    ) : null;

  return (
    <>
      <DataTableShell
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Promoter</DataTableHeadCell>
                <DataTableHeadCell>Convidado por</DataTableHeadCell>
                <DataTableHeadCell>Desde</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                {canManage ? (
                  <DataTableHeadCell align="right" width={140}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                ) : null}
              </tr>
            </DataTableHead>
            <DataTableBody>
              {promoters.map((p, i) => (
                <DataTableRow key={p.id} index={i}>
                  <DataTableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-caption font-semibold text-brand">{initials(name(p).split(" ")[0], name(p).split(" ")[1])}</span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name(p)}</p>
                        <p className="truncate text-caption text-muted-foreground">{p.inviteEmail}</p>
                      </div>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">{p.invitedBy.nome}</DataTableCell>
                  <DataTableCell className="tnum">{fmtDate(p.acceptedAt ?? p.invitedAt)}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone={ORG_PROMOTER_TONE[p.status]}>{ORG_PROMOTER_STATUS_LABEL[p.status]}</StatusBadge>
                  </DataTableCell>
                  {canManage ? (
                    <DataTableCell align="right">
                      <div className="flex justify-end gap-0.5">{actions(p)}</div>
                    </DataTableCell>
                  ) : null}
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        }
        mobile={
          <MobileCardList>
            {promoters.map((p, i) => (
              <MobileCard key={p.id} index={i} title={name(p)} subtitle={`${p.inviteEmail} · convidado por ${p.invitedBy.nome}`} badge={<StatusBadge tone={ORG_PROMOTER_TONE[p.status]}>{ORG_PROMOTER_STATUS_LABEL[p.status]}</StatusBadge>} actions={canManage ? actions(p) : undefined} />
            ))}
          </MobileCardList>
        }
      />

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => (!o ? setConfirm(null) : null)}
        danger
        icon={confirm?.kind === "cancel" ? "x-circle" : "trash"}
        title={confirm?.kind === "cancel" ? `Cancelar o convite de ${confirm.p.inviteEmail}?` : `Remover ${confirm ? name(confirm.p) : ""}?`}
        description={confirm?.kind === "cancel" ? "O link do convite para de funcionar. Você pode convidar de novo depois." : "Os vínculos com eventos deixam de atribuir vendas. Comissões já geradas continuam no histórico."}
        confirmLabel={confirm?.kind === "cancel" ? "Cancelar convite" : "Remover"}
        cancelLabel="Voltar"
        onConfirm={() => {
          if (!confirm) return;
          return confirm.kind === "cancel" ? runAction(() => cancelInvite.mutateAsync(confirm.p.id), "Convite cancelado", "Não foi possível cancelar o convite.") : runAction(() => remove.mutateAsync(confirm.p.id), "Promoter removido", "Não foi possível remover o promoter.");
        }}
      />
    </>
  );
}
