"use client";

import { useState } from "react";
import { MoreVertical, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { ASSIGNMENT_STATUS_LABEL, type AssignmentStatus, type EventPromoterAssignment } from "@/services/promoters";
import { usePromoterAssignments, usePromoterOrganizationEvents, usePromoters, usePromoterMutations } from "../_hooks/use-promoters";
import { AssignmentDialog } from "./assignment-dialog";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";

function statusTone(status: AssignmentStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "PAUSED") return "warning" as const;
  return "neutral" as const;
}

function publicEventUrl(publicToken: string, eventId: number) {
  return `https://www.noktatickets.com.br/eventos/${eventId}?ref=${publicToken}`;
}

export function AssignmentsTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: events } = usePromoterOrganizationEvents(orgId);
  const { data: promoters } = usePromoters(orgId);
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const { data: assignments, isLoading, isError, refetch } = usePromoterAssignments(orgId, eventId);
  const { pauseAssignment, reactivateAssignment, regenerateToken } = usePromoterMutations(orgId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventPromoterAssignment | null>(null);

  const runAction = async (fn: () => Promise<unknown>, successMessage: string, errorMessage: string) => {
    try {
      await fn();
      toast.success(successMessage);
    } catch (err) {
      toast.error(getErrorMessage(err, errorMessage));
    }
  };

  const copyLink = (publicToken: string, evId: number) => {
    navigator.clipboard.writeText(publicEventUrl(publicToken, evId));
    toast.success("Link copiado.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-xs">
          <Select value={eventId ? String(eventId) : "all"} onValueChange={(v) => setEventId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Filtrar por evento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {(events ?? []).map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage ? (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus size={16} /> Novo vínculo
          </Button>
        ) : null}
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar os vínculos." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : !assignments || assignments.length === 0 ? (
        <EmptyState title="Nenhum vínculo ainda" description="Crie um vínculo entre um promoter e um evento para liberar link/código de atribuição." />
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => {
            const publicToken = a.publicToken;
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {a.organizationPromoter.promoterProfile?.displayName ?? a.organizationPromoter.inviteEmail}
                  </p>
                  <p className="truncate text-xs text-black/50">
                    {a.codeEnabled && a.code ? `Código: ${a.code}` : null}
                    {a.linkEnabled && a.codeEnabled && a.code ? " · " : null}
                    {a.linkEnabled ? "Link exclusivo ativo" : null}
                    {a.discountEnabled ? " · com desconto" : ""}
                    {a.commissionEnabled ? " · com comissão" : ""}
                  </p>
                </div>
                <GenericStatusBadge label={ASSIGNMENT_STATUS_LABEL[a.status]} tone={statusTone(a.status)} />
                {canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(a); setDialogOpen(true); }}>Editar</DropdownMenuItem>
                      {publicToken ? (
                        <DropdownMenuItem onClick={() => copyLink(publicToken, a.eventId)}>
                          <Copy size={14} className="mr-2" /> Copiar link
                        </DropdownMenuItem>
                      ) : null}
                      {a.status === "ACTIVE" ? (
                        <DropdownMenuItem onClick={() => runAction(() => pauseAssignment.mutateAsync(a.id), "Vínculo pausado.", "Não foi possível pausar o vínculo.")}>
                          Pausar
                        </DropdownMenuItem>
                      ) : null}
                      {a.status === "PAUSED" ? (
                        <DropdownMenuItem onClick={() => runAction(() => reactivateAssignment.mutateAsync(a.id), "Vínculo reativado.", "Não foi possível reativar o vínculo.")}>
                          Reativar
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onClick={() =>
                          runAction(() => regenerateToken.mutateAsync(a.id), "Link regenerado — o link antigo deixa de funcionar.", "Não foi possível regenerar o link.")
                        }
                      >
                        Regenerar link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <AssignmentDialog
        orgId={orgId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promoters={promoters ?? []}
        events={events ?? []}
        editingAssignment={editing}
        fixedEventId={eventId}
      />
    </div>
  );
}
