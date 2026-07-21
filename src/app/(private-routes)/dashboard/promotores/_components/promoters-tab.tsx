"use client";

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { ORG_PROMOTER_STATUS_LABEL, type OrganizationPromoterStatus } from "@/services/promoters";
import { usePromoters, usePromoterMutations } from "../_hooks/use-promoters";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";

function statusTone(status: OrganizationPromoterStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "INVITED") return "neutral" as const;
  if (status === "SUSPENDED") return "warning" as const;
  return "danger" as const;
}

export function PromotersTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: promoters, isLoading, isError, refetch } = usePromoters(orgId);
  const { resendInvite, cancelInvite, suspend, reactivate, remove } = usePromoterMutations(orgId);

  const runAction = async (fn: () => Promise<unknown>, successMessage: string, errorMessage: string) => {
    try {
      await fn();
      toast.success(successMessage);
    } catch (err) {
      toast.error(getErrorMessage(err, errorMessage));
    }
  };

  if (isError) return <ErrorState description="Não foi possível carregar os promoters." onRetry={() => refetch()} />;
  if (isLoading) return <TableSkeleton />;
  if (!promoters || promoters.length === 0) {
    return <EmptyState title="Nenhum promoter ainda" description="Convide promoters para começar a gerar links e códigos de atribuição." />;
  }

  return (
    <div className="space-y-2">
      {promoters.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{p.promoterProfile?.displayName ?? p.inviteEmail}</p>
            <p className="truncate text-xs text-black/50">
              {p.inviteEmail} · convidado por {p.invitedBy.nome}
            </p>
          </div>
          <GenericStatusBadge label={ORG_PROMOTER_STATUS_LABEL[p.status]} tone={statusTone(p.status)} />
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ações">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {p.status === "INVITED" ? (
                  <>
                    <DropdownMenuItem onClick={() => runAction(() => resendInvite.mutateAsync(p.id), "Convite reenviado.", "Não foi possível reenviar o convite.")}>
                      Reenviar convite
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => runAction(() => cancelInvite.mutateAsync(p.id), "Convite cancelado.", "Não foi possível cancelar o convite.")}
                    >
                      Cancelar convite
                    </DropdownMenuItem>
                  </>
                ) : null}
                {p.status === "ACTIVE" ? (
                  <DropdownMenuItem onClick={() => runAction(() => suspend.mutateAsync(p.id), "Promoter suspenso.", "Não foi possível suspender o promoter.")}>
                    Suspender
                  </DropdownMenuItem>
                ) : null}
                {p.status === "SUSPENDED" ? (
                  <DropdownMenuItem onClick={() => runAction(() => reactivate.mutateAsync(p.id), "Promoter reativado.", "Não foi possível reativar o promoter.")}>
                    Reativar
                  </DropdownMenuItem>
                ) : null}
                {p.status !== "REMOVED" ? (
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => runAction(() => remove.mutateAsync(p.id), "Promoter removido.", "Não foi possível remover o promoter.")}
                  >
                    Remover
                  </DropdownMenuItem>
                ) : null}
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
