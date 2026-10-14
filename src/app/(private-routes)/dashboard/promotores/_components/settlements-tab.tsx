"use client";

import { useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { SETTLEMENT_STATUS_LABEL, formatCents, promotersApi, type PromoterSettlement, type SettlementStatus } from "@/services/promoters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { useAvailableCommissionEntries, usePromoterMutations, usePromoters, useSettlements } from "../_hooks/use-promoters";
import { SETTLEMENT_TONE, fmtDay } from "./promoter-meta";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : undefined);

export function settlementSteps(status: SettlementStatus, s: PromoterSettlement): StepperStep[] {
  if (status === "CANCELLED") {
    return [
      { label: "Rascunho", status: "done", timestamp: when(s.createdAt) },
      { label: "Cancelado", status: "failed" },
      { label: "Pago", status: "upcoming" },
    ];
  }
  const idx = status === "DRAFT" ? 0 : status === "CONFIRMED" ? 1 : 2;
  const st = (i: number): StepperStep["status"] => (i < idx ? "done" : i === idx ? (idx === 2 ? "done" : "current") : "upcoming");
  return [
    { label: "Rascunho", status: st(0), timestamp: when(s.createdAt) },
    { label: "Confirmado", status: st(1), timestamp: when(s.confirmedAt) },
    { label: "Pago por fora", status: st(2), timestamp: when(s.paidAt) },
  ];
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
  const [cancelTarget, setCancelTarget] = useState<PromoterSettlement | null>(null);

  const toggleEntry = (id: number) => setSelectedEntryIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const totalSelectedCents = (available ?? []).filter((e) => selectedEntryIds.includes(e.id)).reduce((sum, e) => sum + e.commissionCents, 0);

  const handleCreateDraft = async () => {
    if (!promoterProfileId || selectedEntryIds.length === 0 || !periodStart || !periodEnd) {
      toast.error("Selecione o promoter, o período e ao menos uma comissão disponível.");
      return;
    }
    try {
      await createSettlementDraft.mutateAsync({ promoterProfileId, periodStart, periodEnd, commissionEntryIds: selectedEntryIds });
      toast.success("Rascunho de acerto criado");
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
      throw err;
    }
  };

  const promoterName = (s: PromoterSettlement) => s.promoterProfile?.displayName ?? eligiblePromoters.find((p) => p.promoterProfile?.id === s.promoterProfileId)?.promoterProfile?.displayName ?? `Promoter #${s.promoterProfileId}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <NativeSelect aria-label="Promoter" value={promoterProfileId ?? ""} onChange={(e) => setPromoterProfileId(e.target.value ? Number(e.target.value) : undefined)} className="sm:w-72">
          <option value="">Todos os promoters</option>
          {eligiblePromoters.map((p) => (
            <option key={p.promoterProfile!.id} value={p.promoterProfile!.id}>
              {p.promoterProfile?.displayName ?? p.inviteEmail}
            </option>
          ))}
        </NativeSelect>
        {promoterProfileId ? (
          <Button variant="outline" size="sm" leftIcon="download" onClick={() => window.open(promotersApi.csvUrl(orgId, "settlements"), "_blank")}>
            Exportar acertos (CSV)
          </Button>
        ) : null}
      </div>

      {canManageSettlements && promoterProfileId ? (
        <Card className="fade-up">
          <CardHeader>
            <div>
              <CardTitle>Novo acerto</CardTitle>
              <CardDescription>Escolha as comissões disponíveis e o período. O acerto nasce como rascunho.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!available || available.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma comissão disponível pra acerto neste momento.</p>
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                {available.map((entry) => {
                  const checked = selectedEntryIds.includes(entry.id);
                  return (
                    <li key={entry.id}>
                      <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors", checked ? "border-brand-ring bg-brand-soft/60" : "surface-inset hover:border-border-strong")}>
                        <Checkbox checked={checked} onCheckedChange={() => toggleEntry(entry.id)} />
                        <span className="min-w-0 flex-1">
                          <span className={cn("block font-medium", entry.type === "ADJUSTMENT" ? "text-danger" : "text-foreground")}>{entry.type === "ADJUSTMENT" ? `Ajuste · Pedido #${entry.orderId}` : `Pedido #${entry.orderId}`}</span>
                          {entry.reason ? <span className="block text-caption text-muted-foreground">{entry.reason}</span> : null}
                        </span>
                        <span className={cn("shrink-0 font-semibold tnum", entry.commissionCents < 0 ? "text-money-out" : "text-money-in")}>{formatCents(entry.commissionCents)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <FieldGroup columns={2}>
              <Field label="Início do período" htmlFor="acerto-inicio">
                <Input id="acerto-inicio" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </Field>
              <Field label="Fim do período" htmlFor="acerto-fim">
                <Input id="acerto-fim" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-sm text-muted-foreground">
              Total selecionado: <strong className="text-foreground tnum">{formatCents(totalSelectedCents)}</strong>
            </p>
            <Button leftIcon="plus" onClick={handleCreateDraft} loading={createSettlementDraft.isPending} disabled={selectedEntryIds.length === 0}>
              Criar rascunho
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {isError ? (
        <ErrorState description="Não foi possível carregar os acertos." onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : !settlements || settlements.length === 0 ? (
        <EmptyState icon="hand-dollar" title="Nenhum acerto ainda" description="Acertos de comissão criados para promoters aparecem aqui." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {settlements.map((s, i) => (
            <Card key={s.id} className="fade-up" style={{ ["--i" as string]: i } as never}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="tnum">{formatCents(s.totalCommissionCents)}</CardTitle>
                  <CardDescription>
                    {promoterName(s)} · {fmtDay(s.periodStart)} — {fmtDay(s.periodEnd)} · {s._count?.entries ?? 0} {(s._count?.entries ?? 0) === 1 ? "comissão" : "comissões"}
                  </CardDescription>
                </div>
                <StatusBadge tone={SETTLEMENT_TONE[s.status]}>{SETTLEMENT_STATUS_LABEL[s.status]}</StatusBadge>
              </CardHeader>
              <CardContent className="pt-4">
                <Stepper steps={settlementSteps(s.status, s)} orientation="horizontal" />
                {s.notes ? (
                  <p className="mt-2 flex items-start gap-1.5 text-caption text-muted-foreground">
                    <Icon name="file-lines" size={11} className="mt-0.5" />
                    {s.notes}
                  </p>
                ) : null}
              </CardContent>
              {canManageSettlements && s.status !== "PAID_MANUALLY" && s.status !== "CANCELLED" ? (
                <CardFooter className="justify-end gap-2">
                  <Button variant="subtle" size="sm" className="hover:bg-danger-bg hover:text-danger" onClick={() => setCancelTarget(s)}>
                    Cancelar
                  </Button>
                  {s.status === "DRAFT" ? (
                    <Button size="sm" leftIcon="check" onClick={() => runAction(() => confirmSettlement.mutateAsync(s.id), "Acerto confirmado", "Não foi possível confirmar o acerto.").catch(() => undefined)} loading={confirmSettlement.isPending}>
                      Confirmar
                    </Button>
                  ) : null}
                  {s.status === "CONFIRMED" ? (
                    <Button size="sm" leftIcon="pix" onClick={() => setPayDialogId(s.id)}>
                      Marcar como pago
                    </Button>
                  ) : null}
                </CardFooter>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={payDialogId !== null} onOpenChange={(v) => !v && setPayDialogId(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Marcar acerto como pago</DialogTitle>
            <DialogDescription>Isso só registra que o pagamento foi feito por fora (Pix, transferência etc.) — a Nokta nunca processa esse pagamento.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Observações" htmlFor="acerto-notas" optional>
              <Input id="acerto-notas" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Ex.: Pix enviado em 21/07" />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayDialogId(null)}>
              Cancelar
            </Button>
            <Button
              leftIcon="check-circle"
              loading={markSettlementPaid.isPending}
              onClick={async () => {
                if (payDialogId === null) return;
                try {
                  await markSettlementPaid.mutateAsync({ settlementId: payDialogId, notes: payNotes || undefined });
                  toast.success("Acerto marcado como pago");
                  setPayDialogId(null);
                  setPayNotes("");
                } catch (err) {
                  toast.error(getErrorMessage(err, "Não foi possível marcar o acerto como pago."));
                }
              }}
            >
              Confirmar pagamento manual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={cancelTarget !== null} onOpenChange={(o) => (!o ? setCancelTarget(null) : null)} danger icon="ban" title="Cancelar este acerto?" description="As comissões voltam a ficar disponíveis pra um próximo acerto." confirmLabel="Cancelar acerto" cancelLabel="Voltar" onConfirm={() => (cancelTarget ? runAction(() => cancelSettlement.mutateAsync(cancelTarget.id), "Acerto cancelado", "Não foi possível cancelar o acerto.") : undefined)} />
    </div>
  );
}
