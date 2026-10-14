"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { VENUE_CASH_MOVEMENT_TYPE_LABEL, VENUE_PAYMENT_METHOD_LABEL, type VenueCashMovementType, type VenueCashRegister, type VenueCashSession, type VenuePaymentMethod } from "@/services/venue-operation";
import { useVenueCashRegisterMutations, useVenueCashRegisters, useVenueCashSession, useVenueCashSessionMutations, useVenueCashSessions } from "../_hooks/use-venue-cash";
import { formatClock, formatDay, formatElapsed } from "../_lib/time";
import { MoneyInput } from "./money-input";
import { PAYMENT_METHOD_ICON } from "./payment-dialog";

const MOVEMENT_OPTIONS = (Object.keys(VENUE_CASH_MOVEMENT_TYPE_LABEL) as VenueCashMovementType[]).map((value) => ({ value, label: VENUE_CASH_MOVEMENT_TYPE_LABEL[value] }));
const MOVEMENT_IN: Record<VenueCashMovementType, boolean> = { SUPPLY: true, ADJUSTMENT: true, WITHDRAWAL: false, EXPENSE: false };

function RegisterFormDialog({ open, onOpenChange, onSubmit, loading }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (nome: string) => void; loading: boolean }) {
  const [nome, setNome] = useState("");
  useEffect(() => {
    if (open) setNome("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Novo caixa</DialogTitle>
          <DialogDescription>Um caixa por ponto de cobrança (balcão, bar, salão).</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="caixa-nome">
            <Input id="caixa-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Caixa principal, Caixa do bar" autoFocus />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={!nome.trim()} loading={loading} onClick={() => onSubmit(nome.trim())}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpenSessionDialog({ register, onOpenChange, orgId, locationId }: { register: VenueCashRegister | null; onOpenChange: (v: boolean) => void; orgId: number; locationId: number }) {
  const { open } = useVenueCashSessionMutations(orgId, locationId);
  const [openingCents, setOpeningCents] = useState(0);

  useEffect(() => {
    if (register !== null) setOpeningCents(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register?.id]);

  return (
    <Dialog open={register !== null} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Abrir {register?.nome ?? "caixa"}</DialogTitle>
          <DialogDescription>Informe o troco que já está na gaveta antes da primeira venda.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Fundo de troco" htmlFor="caixa-abertura" hint="Pode deixar R$ 0,00 se não usam fundo fixo.">
            <MoneyInput id="caixa-abertura" cents={openingCents} onChange={setOpeningCents} autoFocus />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={open.isPending}>
            Cancelar
          </Button>
          <Button
            loading={open.isPending}
            leftIcon="lock-open"
            onClick={() => {
              if (!register) return;
              open.mutate(
                { registerId: register.id, payload: { openingAmountCents: openingCents } },
                {
                  onSuccess: () => {
                    toast.success("Caixa aberto.");
                    onOpenChange(false);
                  },
                  onError: (err) => toast.error(getErrorMessage(err, "Não foi possível abrir o caixa.")),
                },
              );
            }}
          >
            Abrir caixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({ sessionId, onOpenChange, orgId, locationId }: { sessionId: number | null; onOpenChange: (v: boolean) => void; orgId: number; locationId: number }) {
  const { addMovement } = useVenueCashSessionMutations(orgId, locationId);
  const [type, setType] = useState<VenueCashMovementType>("SUPPLY");
  const [amountCents, setAmountCents] = useState(0);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (sessionId !== null) {
      setType("SUPPLY");
      setAmountCents(0);
      setReason("");
    }
  }, [sessionId]);

  return (
    <Dialog open={sessionId !== null} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Movimentação de caixa</DialogTitle>
          <DialogDescription>Suprimento e ajuste entram na gaveta; retirada e despesa saem.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Tipo">
            <SegmentedControl fullWidth size="sm" value={type} onChange={setType} options={MOVEMENT_OPTIONS} />
          </Field>
          <Field label="Valor" htmlFor="mov-valor">
            <MoneyInput id="mov-valor" cents={amountCents} onChange={setAmountCents} />
          </Field>
          <Field label="Motivo" htmlFor="mov-motivo">
            <Textarea id="mov-motivo" rows={2} className="min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: sangria pra troco do bar" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={addMovement.isPending}>
            Cancelar
          </Button>
          <Button
            disabled={!reason.trim() || amountCents === 0}
            loading={addMovement.isPending}
            onClick={() => {
              if (!sessionId) return;
              addMovement.mutate(
                { sessionId, payload: { type, amountCents, reason: reason.trim() } },
                {
                  onSuccess: () => {
                    toast.success("Movimentação registrada.");
                    onOpenChange(false);
                  },
                  onError: (err) => toast.error(getErrorMessage(err, "Não foi possível registrar a movimentação.")),
                },
              );
            }}
          >
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CloseSessionDialog({ sessionId, expectedCents, onOpenChange, orgId, locationId }: { sessionId: number | null; expectedCents: number; onOpenChange: (v: boolean) => void; orgId: number; locationId: number }) {
  const { close } = useVenueCashSessionMutations(orgId, locationId);
  const [countedCents, setCountedCents] = useState(expectedCents);
  const difference = countedCents - expectedCents;

  useEffect(() => {
    if (sessionId !== null) setCountedCents(expectedCents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <Dialog open={sessionId !== null} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Fechar caixa</DialogTitle>
          <DialogDescription>Conte o dinheiro da gaveta e confira com o esperado.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="surface-inset rounded-xl px-4 py-3">
              <p className="text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Esperado</p>
              <p className="mt-1 text-lg font-semibold text-foreground tnum">{formatBRLCents(expectedCents)}</p>
            </div>
            <div className="surface-inset rounded-xl px-4 py-3">
              <p className="text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Diferença</p>
              <p className={cn("mt-1 text-lg font-semibold tnum", difference === 0 ? "text-money-in" : difference < 0 ? "text-money-out" : "text-money-pending")}>
                {difference > 0 ? "+" : ""}
                {formatBRLCents(difference)}
              </p>
            </div>
          </div>
          <Field label="Dinheiro contado" htmlFor="caixa-contado">
            <MoneyInput id="caixa-contado" cents={countedCents} onChange={setCountedCents} autoFocus />
          </Field>
          {difference !== 0 ? <Callout tone="warning">A diferença fica registrada na sessão. Confira sangrias e trocos antes de confirmar.</Callout> : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={close.isPending}>
            Cancelar
          </Button>
          <Button
            variant={difference === 0 ? "primary" : "destructive"}
            loading={close.isPending}
            leftIcon="lock"
            onClick={() => {
              if (!sessionId) return;
              close.mutate(
                { sessionId, payload: { countedCashCents: countedCents } },
                {
                  onSuccess: () => {
                    toast.success("Caixa fechado.");
                    onOpenChange(false);
                  },
                  onError: (err) => toast.error(getErrorMessage(err, "Não foi possível fechar o caixa.")),
                },
              );
            }}
          >
            Confirmar fechamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Um caixa: sessão aberta (números + movimentações) ou botão de abrir. */
function RegisterPanel({ orgId, locationId, register, single }: { orgId: number; locationId: number; register: VenueCashRegister; single: boolean }) {
  const { data: session, isLoading } = useVenueCashSession(orgId, register.openSession?.id ?? null);
  const [opening, setOpening] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [closingConfirm, setClosingConfirm] = useState(false);
  const isOpen = register.openSession !== null;

  const salesCents = session ? Object.values(session.paymentsByMethod).reduce((s, v) => s + v, 0) : 0;
  const movements = session?.movements ?? [];

  return (
    <Card accent={isOpen} className="gap-0">
      <CardHeader className="items-center">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-10 items-center justify-center rounded-full", isOpen ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted-foreground")}>
            <Icon name="wallet" size={16} />
          </span>
          <div>
            <CardTitle>{register.nome}</CardTitle>
            <p className="text-caption text-muted-foreground tnum">{isOpen && register.openSession ? `Aberto às ${formatClock(register.openSession.openedAt)} · ${formatElapsed(register.openSession.openedAt)}` : single ? "Caixa desta unidade" : "Fechado"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={isOpen ? "success" : "neutral"} pulse={isOpen}>
            {isOpen ? "Aberto" : "Fechado"}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isOpen ? (
          isLoading || !session ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-card" />
              <Skeleton className="h-24 rounded-card" />
              <Skeleton className="h-24 rounded-card" />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Abertura" icon="lock-open" value={session.openingAmountCents / 100} format="currency" hint="fundo de troco" className="p-4" />
                <StatCard label="Vendas na sessão" icon="receipt" value={salesCents / 100} format="currency" hint="todas as formas" className="p-4" />
                <StatCard label="Esperado na gaveta" icon="money" value={session.expectedCashCents / 100} format="currency" hint="só dinheiro" className="p-4" />
              </div>

              {Object.keys(session.paymentsByMethod).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(session.paymentsByMethod).map(([method, cents]) => (
                    <span key={method} className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-3 py-1.5 text-caption font-medium text-foreground">
                      <Icon name={PAYMENT_METHOD_ICON[method as VenuePaymentMethod] ?? "coins"} size={11} className="text-muted-foreground" />
                      {VENUE_PAYMENT_METHOD_LABEL[method as VenuePaymentMethod] ?? method}
                      <span className="tnum text-muted-foreground">{formatBRLCents(cents)}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" leftIcon="plus" onClick={() => setMovementOpen(true)}>
                  Movimentação
                </Button>
                <Button variant="destructive-soft" leftIcon="lock" onClick={() => setClosingConfirm(true)}>
                  Fechar caixa
                </Button>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold text-foreground">Movimentações</h4>
                <DataTableShell
                  maxHeight="none"
                  table={
                    <DataTable>
                      <DataTableHead>
                        <tr>
                          <DataTableHeadCell>Hora</DataTableHeadCell>
                          <DataTableHeadCell>Tipo</DataTableHeadCell>
                          <DataTableHeadCell>Motivo</DataTableHeadCell>
                          <DataTableHeadCell align="right">Valor</DataTableHeadCell>
                        </tr>
                      </DataTableHead>
                      <DataTableBody>
                        {movements.length === 0 ? (
                          <DataTableEmpty colSpan={4} icon="money-transfer" title="Nenhuma movimentação" description="Sangrias, suprimentos e despesas desta sessão aparecem aqui." />
                        ) : (
                          movements.map((m, i) => (
                            <DataTableRow key={m.id} index={i}>
                              <DataTableCell className="tnum text-muted-foreground">{formatClock(m.createdAt)}</DataTableCell>
                              <DataTableCell>
                                <StatusBadge tone={MOVEMENT_IN[m.type] ? "success" : "warning"}>{VENUE_CASH_MOVEMENT_TYPE_LABEL[m.type]}</StatusBadge>
                              </DataTableCell>
                              <DataTableCell>{m.reason}</DataTableCell>
                              <DataTableCell num className={cn("font-semibold", MOVEMENT_IN[m.type] ? "text-money-in" : "text-money-out")}>
                                {MOVEMENT_IN[m.type] ? "+" : "−"}
                                {formatBRLCents(m.amountCents)}
                              </DataTableCell>
                            </DataTableRow>
                          ))
                        )}
                      </DataTableBody>
                    </DataTable>
                  }
                  mobile={
                    movements.length === 0 ? (
                      <EmptyState compact icon="money-transfer" title="Nenhuma movimentação" />
                    ) : (
                      <MobileCardList>
                        {movements.map((m, i) => (
                          <MobileCard key={m.id} index={i} title={VENUE_CASH_MOVEMENT_TYPE_LABEL[m.type]} subtitle={`${formatClock(m.createdAt)} · ${m.reason}`} badge={<span className={cn("text-sm font-semibold tnum", MOVEMENT_IN[m.type] ? "text-money-in" : "text-money-out")}>{`${MOVEMENT_IN[m.type] ? "+" : "−"}${formatBRLCents(m.amountCents)}`}</span>} />
                        ))}
                      </MobileCardList>
                    )
                  }
                />
              </div>
            </>
          )
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-body text-muted-foreground">Nenhuma venda pode ser cobrada com o caixa fechado. Abra no início do turno informando o troco da gaveta.</p>
            <Button size="lg" leftIcon="lock-open" onClick={() => setOpening(true)}>
              Abrir caixa
            </Button>
          </div>
        )}
      </CardContent>

      <OpenSessionDialog register={opening ? register : null} onOpenChange={setOpening} orgId={orgId} locationId={locationId} />
      <MovementDialog sessionId={movementOpen ? (register.openSession?.id ?? null) : null} onOpenChange={setMovementOpen} orgId={orgId} locationId={locationId} />
      <CloseSessionDialog sessionId={closingConfirm ? (register.openSession?.id ?? null) : null} expectedCents={session?.expectedCashCents ?? register.openSession?.expectedCashCents ?? 0} onOpenChange={setClosingConfirm} orgId={orgId} locationId={locationId} />
    </Card>
  );
}

function SessionsHistory({ sessions, registers }: { sessions: VenueCashSession[]; registers: VenueCashRegister[] }) {
  const closed = sessions.filter((s) => s.status === "CLOSED");
  const registerName = (id: number) => registers.find((r) => r.id === id)?.nome ?? "Caixa";
  const diffClass = (d: number | null) => (d === null ? "" : d === 0 ? "text-money-in" : d < 0 ? "text-money-out" : "text-money-pending");
  const diffLabel = (d: number | null) => (d === null ? "—" : `${d > 0 ? "+" : ""}${formatBRLCents(d)}`);
  return (
    <section className="space-y-3">
      <SectionHeader title="Sessões anteriores" />
      <DataTableShell
        maxHeight="none"
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Caixa</DataTableHeadCell>
                <DataTableHeadCell>Período</DataTableHeadCell>
                <DataTableHeadCell align="right">Abertura</DataTableHeadCell>
                <DataTableHeadCell align="right">Esperado</DataTableHeadCell>
                <DataTableHeadCell align="right">Contado</DataTableHeadCell>
                <DataTableHeadCell align="right">Diferença</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {closed.length === 0 ? (
                <DataTableEmpty colSpan={6} icon="history" title="Nenhuma sessão fechada ainda" />
              ) : (
                closed.map((s, i) => (
                  <DataTableRow key={s.id} index={i}>
                    <DataTableCell className="font-semibold">{registerName(s.cashRegisterId)}</DataTableCell>
                    <DataTableCell className="tnum text-muted-foreground">
                      {formatDay(s.openedAt)} · {formatClock(s.openedAt)}
                      {s.closedAt ? ` – ${formatClock(s.closedAt)}` : ""}
                    </DataTableCell>
                    <DataTableCell num>{formatBRLCents(s.openingAmountCents)}</DataTableCell>
                    <DataTableCell num>{formatBRLCents(s.expectedCashCents)}</DataTableCell>
                    <DataTableCell num>{s.countedCashCents === null ? "—" : formatBRLCents(s.countedCashCents)}</DataTableCell>
                    <DataTableCell num className={cn("font-semibold", diffClass(s.differenceCents))}>
                      {diffLabel(s.differenceCents)}
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>
        }
        mobile={
          closed.length === 0 ? (
            <EmptyState compact icon="history" title="Nenhuma sessão fechada ainda" />
          ) : (
            <MobileCardList>
              {closed.map((s, i) => (
                <MobileCard
                  key={s.id}
                  index={i}
                  title={registerName(s.cashRegisterId)}
                  subtitle={`${formatDay(s.openedAt)} · ${formatClock(s.openedAt)}${s.closedAt ? ` – ${formatClock(s.closedAt)}` : ""}`}
                  badge={<span className={cn("text-sm font-semibold tnum", diffClass(s.differenceCents))}>{diffLabel(s.differenceCents)}</span>}
                  meta={[
                    { label: "Abertura", value: formatBRLCents(s.openingAmountCents), num: true },
                    { label: "Esperado", value: formatBRLCents(s.expectedCashCents), num: true },
                    { label: "Contado", value: s.countedCashCents === null ? "—" : formatBRLCents(s.countedCashCents), num: true },
                  ]}
                />
              ))}
            </MobileCardList>
          )
        }
      />
    </section>
  );
}

export function CaixaTab({ orgId, locationId, formOpen, onFormOpenChange }: { orgId: number; locationId: number; formOpen: boolean; onFormOpenChange: (v: boolean) => void }) {
  const { data: registers, isLoading } = useVenueCashRegisters(orgId, locationId);
  const { data: sessions } = useVenueCashSessions(orgId, locationId);
  const { create } = useVenueCashRegisterMutations(orgId, locationId);
  const list = registers ?? [];

  const formDialog = (
    <RegisterFormDialog
      open={formOpen}
      onOpenChange={onFormOpenChange}
      loading={create.isPending}
      onSubmit={(nome) =>
        create.mutate(
          { nome },
          {
            onSuccess: () => {
              toast.success("Caixa criado.");
              onFormOpenChange(false);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar o caixa.")),
          },
        )
      }
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <>
        <EmptyState
          icon="wallet"
          title="Nenhum caixa cadastrado"
          description="Cadastre o caixa desta unidade pra começar a registrar vendas e movimentações."
          action={
            <Button leftIcon="plus" onClick={() => onFormOpenChange(true)}>
              Cadastrar caixa
            </Button>
          }
        />
        {formDialog}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn("grid gap-4", list.length > 1 && "xl:grid-cols-2")}>
        {list.map((register) => (
          <RegisterPanel key={register.id} orgId={orgId} locationId={locationId} register={register} single={list.length === 1} />
        ))}
      </div>
      {sessions ? <SessionsHistory sessions={sessions} registers={list} /> : null}
      {formDialog}
    </div>
  );
}
