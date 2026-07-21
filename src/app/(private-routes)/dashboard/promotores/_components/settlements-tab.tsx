"use client";

import { useMemo, useState } from "react";
import { Download, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { SETTLEMENT_STATUS_LABEL, formatCents, promotersApi, type SettlementStatus } from "@/services/promoters";
import { useAvailableCommissionEntries, usePromoterMutations, usePromoters, useSettlements } from "../_hooks/use-promoters";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";

function statusTone(status: SettlementStatus) {
  if (status === "PAID_MANUALLY") return "success" as const;
  if (status === "CONFIRMED") return "warning" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "neutral" as const;
}

export function SettlementsTab({ orgId, canManageSettlements }: { orgId: number; canManageSettlements: boolean }) {
  const { data: promoters } = usePromoters(orgId);
  const eligiblePromoters = useMemo(() => (promoters ?? []).filter((p) => p.status === "ACTIVE" && p.promoterProfile), [promoters]);
  const [promoterProfileId, setPromoterProfileId] = useState<number | undefined>(undefined);

  const { data: available } = useAvailableCommissionEntries(orgId, promoterProfileId ?? null);
  const { data: settlements, isLoading, isError, refetch } = useSettlements(orgId, promoterProfileId);
  const { createSettlementDraft, confirmSettlement, markSettlementPaid, cancelSettlement } = usePromoterMutations(orgId);

  const [selectedEntryIds, setSelectedEntryIds] = useState<number[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [payDialogId, setPayDialogId] = useState<number | null>(null);
  const [payNotes, setPayNotes] = useState("");

  const toggleEntry = (id: number) => setSelectedEntryIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const totalSelectedCents = (available ?? []).filter((e) => selectedEntryIds.includes(e.id)).reduce((sum, e) => sum + e.commissionCents, 0);

  const handleCreateDraft = async () => {
    if (!promoterProfileId || selectedEntryIds.length === 0 || !periodStart || !periodEnd) {
      toast.error("Selecione o promoter, o período e ao menos uma comissão disponível.");
      return;
    }
    try {
      await createSettlementDraft.mutateAsync({ promoterProfileId, periodStart, periodEnd, commissionEntryIds: selectedEntryIds });
      toast.success("Rascunho de acerto criado.");
      setSelectedEntryIds([]);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível criar o rascunho de acerto."));
    }
  };

  const runAction = async (fn: () => Promise<unknown>, successMessage: string, errorMessage: string) => {
    try {
      await fn();
      toast.success(successMessage);
    } catch (err) {
      toast.error(getErrorMessage(err, errorMessage));
    }
  };

  return (
    <div className="space-y-5">
      <div className="w-full max-w-xs space-y-1.5">
        <Label>Promoter</Label>
        <Select value={promoterProfileId ? String(promoterProfileId) : ""} onValueChange={(v) => setPromoterProfileId(Number(v))}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um promoter" /></SelectTrigger>
          <SelectContent>
            {eligiblePromoters.map((p) => (
              <SelectItem key={p.promoterProfile!.id} value={String(p.promoterProfile!.id)}>
                {p.promoterProfile?.displayName ?? p.inviteEmail}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {canManageSettlements && promoterProfileId ? (
        <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm font-medium text-gray-900">Novo acerto (rascunho)</p>
          {!available || available.length === 0 ? (
            <p className="text-sm text-black/50">Nenhuma comissão disponível para acerto neste momento.</p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {available.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={selectedEntryIds.includes(entry.id)} onCheckedChange={() => toggleEntry(entry.id)} />
                  <span>Pedido #{entry.orderId} — {formatCents(entry.commissionCents)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Início do período</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim do período</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
            <p className="text-sm text-black/60">Total selecionado: <strong>{formatCents(totalSelectedCents)}</strong></p>
            <Button onClick={handleCreateDraft} disabled={createSettlementDraft.isPending}>
              {createSettlementDraft.isPending ? "Criando…" : "Criar rascunho"}
            </Button>
          </div>
        </div>
      ) : null}

      {isError ? (
        <ErrorState description="Não foi possível carregar os acertos." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : !settlements || settlements.length === 0 ? (
        <EmptyState title="Nenhum acerto ainda" description="Acertos de comissão criados para promoters aparecem aqui." />
      ) : (
        <div className="space-y-2">
          {settlements.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{formatCents(s.totalCommissionCents)}</p>
                <p className="text-xs text-black/50">
                  {s.periodStart.slice(0, 10)} — {s.periodEnd.slice(0, 10)} · {s._count?.entries ?? 0} comissões
                </p>
              </div>
              <GenericStatusBadge label={SETTLEMENT_STATUS_LABEL[s.status]} tone={statusTone(s.status)} />
              {canManageSettlements ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações"><MoreVertical size={16} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {s.status === "DRAFT" ? (
                      <DropdownMenuItem onClick={() => runAction(() => confirmSettlement.mutateAsync(s.id), "Acerto confirmado.", "Não foi possível confirmar o acerto.")}>
                        Confirmar
                      </DropdownMenuItem>
                    ) : null}
                    {s.status === "CONFIRMED" ? (
                      <DropdownMenuItem onClick={() => setPayDialogId(s.id)}>Marcar como pago manualmente</DropdownMenuItem>
                    ) : null}
                    {s.status !== "PAID_MANUALLY" && s.status !== "CANCELLED" ? (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => runAction(() => cancelSettlement.mutateAsync(s.id), "Acerto cancelado.", "Não foi possível cancelar o acerto.")}
                      >
                        Cancelar
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {promoterProfileId ? (
        <Button variant="outline" onClick={() => window.open(promotersApi.csvUrl(orgId, "settlements"), "_blank")}>
          <Download size={14} /> Exportar acertos (CSV)
        </Button>
      ) : null}

      <Dialog open={payDialogId !== null} onOpenChange={(v) => !v && setPayDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar acerto como pago manualmente</DialogTitle>
            <DialogDescription>
              Isso só registra que o pagamento foi feito por fora do sistema (Pix, transferência etc.) — a Nokta nunca processa esse pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Ex.: Pix enviado em 21/07" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogId(null)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (payDialogId === null) return;
                try {
                  await markSettlementPaid.mutateAsync({ settlementId: payDialogId, notes: payNotes || undefined });
                  toast.success("Acerto marcado como pago.");
                  setPayDialogId(null);
                  setPayNotes("");
                } catch (err) {
                  toast.error(getErrorMessage(err, "Não foi possível marcar o acerto como pago."));
                }
              }}
              disabled={markSettlementPaid.isPending}
            >
              {markSettlementPaid.isPending ? "Salvando…" : "Confirmar pagamento manual"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
