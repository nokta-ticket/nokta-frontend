"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { ASSIGNMENT_STATUS_LABEL, type EventPromoterAssignment } from "@/services/promoters";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { usePromoterAssignments, usePromoterMutations, usePromoterOrganizationEvents, usePromoters } from "../_hooks/use-promoters";
import { AssignmentDialog } from "./assignment-dialog";
import { ASSIGNMENT_TONE, publicEventUrl } from "./promoter-meta";

export function AssignmentsTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: events } = usePromoterOrganizationEvents(orgId);
  const { data: promoters } = usePromoters(orgId);
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const { data: assignments, isLoading, isError, refetch } = usePromoterAssignments(orgId, eventId);
  const { pauseAssignment, reactivateAssignment, regenerateToken } = usePromoterMutations(orgId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventPromoterAssignment | null>(null);
  const [regenTarget, setRegenTarget] = useState<EventPromoterAssignment | null>(null);

  const runAction = async (fn: () => Promise<unknown>, successMessage: string, errorMessage: string) => {
    try {
      await fn();
      toast.success(successMessage);
    } catch (err) {
      toast.error(getErrorMessage(err, errorMessage));
      throw err;
    }
  };

  const eventName = (id: number) => events?.find((e) => e.id === id)?.nome ?? `Evento #${id}`;
  const promoterName = (a: EventPromoterAssignment) => a.organizationPromoter.promoterProfile?.displayName ?? a.organizationPromoter.inviteEmail;

  const copyLink = async (publicToken: string, evId: number) => {
    const slugOrId = events?.find((e) => e.id === evId)?.slug ?? evId;
    try {
      await navigator.clipboard.writeText(publicEventUrl(publicToken, slugOrId));
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const channels = (a: EventPromoterAssignment) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {a.linkEnabled ? (
        <span className="inline-flex items-center gap-1 rounded-pill bg-surface-2 px-2 py-0.5 text-micro font-semibold text-foreground">
          <Icon name="link" size={9} /> Link
        </span>
      ) : null}
      {a.codeEnabled && a.code ? <span className="rounded-pill bg-brand-soft px-2 py-0.5 font-mono text-micro font-semibold text-brand">{a.code}</span> : null}
      {!a.linkEnabled && !a.codeEnabled ? <span className="text-caption text-subtle-foreground">Nenhum canal</span> : null}
    </div>
  );

  const perks = (a: EventPromoterAssignment) => [a.discountEnabled ? "com desconto" : null, a.commissionEnabled ? "com comissão" : null].filter(Boolean).join(" · ") || "sem desconto nem comissão";

  const actions = (a: EventPromoterAssignment) =>
    canManage ? (
      <>
        <Button variant="subtle" size="icon-sm" aria-label="Editar vínculo" title="Editar" onClick={() => { setEditing(a); setDialogOpen(true); }}>
          <Icon name="edit" size={13} />
        </Button>
        {a.publicToken ? (
          <Button variant="subtle" size="icon-sm" aria-label="Copiar link" title="Copiar link" onClick={() => void copyLink(a.publicToken as string, a.eventId)}>
            <Icon name="copy" size={13} />
          </Button>
        ) : null}
        {a.status === "ACTIVE" ? (
          <Button variant="subtle" size="icon-sm" aria-label="Pausar" title="Pausar" onClick={() => runAction(() => pauseAssignment.mutateAsync(a.id), "Vínculo pausado", "Não foi possível pausar o vínculo.").catch(() => undefined)}>
            <Icon name="ban" size={13} />
          </Button>
        ) : null}
        {a.status === "PAUSED" ? (
          <Button variant="subtle" size="icon-sm" aria-label="Reativar" title="Reativar" onClick={() => runAction(() => reactivateAssignment.mutateAsync(a.id), "Vínculo reativado", "Não foi possível reativar o vínculo.").catch(() => undefined)}>
            <Icon name="rotate" size={13} />
          </Button>
        ) : null}
        <Button variant="subtle" size="icon-sm" aria-label="Regenerar link" title="Regenerar link (o antigo para de funcionar)" onClick={() => setRegenTarget(a)}>
          <Icon name="refresh" size={13} />
        </Button>
      </>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <NativeSelect aria-label="Filtrar por evento" value={eventId ?? "all"} onChange={(e) => setEventId(e.target.value === "all" ? undefined : Number(e.target.value))} className="sm:w-72">
          <option value="all">Todos os eventos</option>
          {(events ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </NativeSelect>
        {canManage ? (
          <Button leftIcon="plus" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            Novo vínculo
          </Button>
        ) : null}
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar os vínculos." onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : !assignments || assignments.length === 0 ? (
        <EmptyState icon="link" title="Nenhum vínculo ainda" description="Vincule um promoter a um evento pra liberar link e código de atribuição." action={canManage ? <Button leftIcon="plus" onClick={() => { setEditing(null); setDialogOpen(true); }}>Novo vínculo</Button> : undefined} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Promoter</DataTableHeadCell>
                  <DataTableHeadCell>Evento</DataTableHeadCell>
                  <DataTableHeadCell>Canais</DataTableHeadCell>
                  <DataTableHeadCell>Regras</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  {canManage ? (
                    <DataTableHeadCell align="right" width={180}>
                      <span className="sr-only">Ações</span>
                    </DataTableHeadCell>
                  ) : null}
                </tr>
              </DataTableHead>
              <DataTableBody>
                {assignments.map((a, i) => (
                  <DataTableRow key={a.id} index={i}>
                    <DataTableCell className="font-semibold">{promoterName(a)}</DataTableCell>
                    <DataTableCell>{eventName(a.eventId)}</DataTableCell>
                    <DataTableCell>{channels(a)}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">{perks(a)}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={ASSIGNMENT_TONE[a.status]}>{ASSIGNMENT_STATUS_LABEL[a.status]}</StatusBadge>
                    </DataTableCell>
                    {canManage ? (
                      <DataTableCell align="right">
                        <div className="flex justify-end gap-0.5">{actions(a)}</div>
                      </DataTableCell>
                    ) : null}
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {assignments.map((a, i) => (
                <MobileCard key={a.id} index={i} title={promoterName(a)} subtitle={eventName(a.eventId)} badge={<StatusBadge tone={ASSIGNMENT_TONE[a.status]}>{ASSIGNMENT_STATUS_LABEL[a.status]}</StatusBadge>} meta={[{ label: "Canais", value: channels(a) }, { label: "Regras", value: perks(a) }]} actions={canManage ? actions(a) : undefined} />
              ))}
            </MobileCardList>
          }
        />
      )}

      <AssignmentDialog orgId={orgId} open={dialogOpen} onOpenChange={setDialogOpen} promoters={promoters ?? []} events={events ?? []} editingAssignment={editing} fixedEventId={eventId} />

      <ConfirmDialog
        open={regenTarget !== null}
        onOpenChange={(o) => (!o ? setRegenTarget(null) : null)}
        icon="refresh"
        title="Regenerar o link deste vínculo?"
        description="Um link novo é gerado e o antigo para de funcionar na hora. Quem já divulgou o link anterior precisa trocar."
        confirmLabel="Regenerar link"
        onConfirm={() => (regenTarget ? runAction(() => regenerateToken.mutateAsync(regenTarget.id), "Link regenerado — o antigo deixou de funcionar.", "Não foi possível regenerar o link.") : undefined)}
      />
    </div>
  );
}
