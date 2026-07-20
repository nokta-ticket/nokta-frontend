"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { centsToBRL } from "@/services/venue-menu";
import {
  VENUE_CASH_MOVEMENT_TYPE_LABEL,
  VENUE_PAYMENT_METHOD_LABEL,
  type VenueCashMovementType,
  type VenueCashRegister,
} from "@/services/venue-operation";
import {
  useVenueCashRegisterMutations,
  useVenueCashRegisters,
  useVenueCashSession,
  useVenueCashSessionMutations,
} from "../_hooks/use-venue-cash";
import { MoneyField } from "../../cardapio/_components/money-field";
import { ConfirmDialog } from "../../cardapio/_components/confirm-dialog";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";

function RegisterFormDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (nome: string) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState("");
  useEffect(() => {
    if (open) setNome("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo caixa</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="caixa-nome">Nome</Label>
          <Input id="caixa-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Caixa principal, Caixa bar" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button disabled={loading || !nome.trim()} onClick={() => onSubmit(nome.trim())}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpenSessionDialog({
  register,
  onOpenChange,
  orgId,
  locationId,
}: {
  register: VenueCashRegister | null;
  onOpenChange: (v: boolean) => void;
  orgId: number;
  locationId: number;
}) {
  const { open } = useVenueCashSessionMutations(orgId, locationId);
  const [openingCents, setOpeningCents] = useState(0);

  useEffect(() => {
    if (register !== null) setOpeningCents(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register?.id]);

  return (
    <Dialog open={register !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Abrir caixa — {register?.nome}</DialogTitle></DialogHeader>
        <MoneyField label="Valor inicial" cents={openingCents} onChange={setOpeningCents} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={open.isPending}>Cancelar</Button>
          <Button
            disabled={open.isPending}
            onClick={() => {
              if (!register) return;
              open.mutate(
                { registerId: register.id, payload: { openingAmountCents: openingCents } },
                {
                  onSuccess: () => { toast.success("Caixa aberto."); onOpenChange(false); },
                  onError: (err) => toast.error(getErrorMessage(err, "Não foi possível abrir o caixa.")),
                },
              );
            }}
          >
            {open.isPending ? "Abrindo…" : "Abrir caixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({
  sessionId,
  onOpenChange,
  orgId,
  locationId,
}: {
  sessionId: number | null;
  onOpenChange: (v: boolean) => void;
  orgId: number;
  locationId: number;
}) {
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
      <DialogContent>
        <DialogHeader><DialogTitle>Movimentação de caixa</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as VenueCashMovementType)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VENUE_CASH_MOVEMENT_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <MoneyField label="Valor" cents={amountCents} onChange={setAmountCents} />
          <div className="space-y-2">
            <Label htmlFor="mov-motivo">Motivo</Label>
            <Textarea id="mov-motivo" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addMovement.isPending}>Cancelar</Button>
          <Button
            disabled={addMovement.isPending || !reason.trim() || amountCents === 0}
            onClick={() => {
              if (!sessionId) return;
              addMovement.mutate(
                { sessionId, payload: { type, amountCents, reason: reason.trim() } },
                {
                  onSuccess: () => { toast.success("Movimentação registrada."); onOpenChange(false); },
                  onError: (err) => toast.error(getErrorMessage(err, "Não foi possível registrar a movimentação.")),
                },
              );
            }}
          >
            {addMovement.isPending ? "Salvando…" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CloseSessionDialog({
  sessionId,
  expectedCents,
  onOpenChange,
  orgId,
  locationId,
}: {
  sessionId: number | null;
  expectedCents: number;
  onOpenChange: (v: boolean) => void;
  orgId: number;
  locationId: number;
}) {
  const { close } = useVenueCashSessionMutations(orgId, locationId);
  const [countedCents, setCountedCents] = useState(expectedCents);
  const difference = countedCents - expectedCents;

  useEffect(() => {
    if (sessionId !== null) setCountedCents(expectedCents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <Dialog open={sessionId !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Fechar caixa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-black/60">Esperado: <span className="font-semibold text-gray-900">{centsToBRL(expectedCents)}</span></p>
          <MoneyField label="Dinheiro contado" cents={countedCents} onChange={setCountedCents} />
          <p className={`text-sm font-medium ${difference === 0 ? "text-emerald-600" : "text-amber-600"}`}>
            Diferença: {centsToBRL(difference)}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={close.isPending}>Cancelar</Button>
          <Button
            disabled={close.isPending}
            onClick={() => {
              if (!sessionId) return;
              close.mutate(
                { sessionId, payload: { countedCashCents: countedCents } },
                {
                  onSuccess: () => { toast.success("Caixa fechado."); onOpenChange(false); },
                  onError: (err) => toast.error(getErrorMessage(err, "Não foi possível fechar o caixa.")),
                },
              );
            }}
          >
            {close.isPending ? "Fechando…" : "Confirmar fechamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegisterCard({ orgId, locationId, register }: { orgId: number; locationId: number; register: VenueCashRegister }) {
  const { data: session } = useVenueCashSession(orgId, register.openSession?.id ?? null);
  const [opening, setOpening] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [closingConfirm, setClosingConfirm] = useState(false);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-900">{register.nome}</p>
        {register.openSession ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Aberto</span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Fechado</span>
        )}
      </div>

      {register.openSession && session ? (
        <div className="mt-3 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-1 text-black/70">
            <span>Aberto às</span>
            <span className="text-right">{new Date(session.openedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            <span>Valor inicial</span>
            <span className="text-right">{centsToBRL(session.openingAmountCents)}</span>
            {Object.entries(session.paymentsByMethod).map(([method, cents]) => (
              <Fragment key={method}>
                <span>{VENUE_PAYMENT_METHOD_LABEL[method as keyof typeof VENUE_PAYMENT_METHOD_LABEL] ?? method}</span>
                <span className="text-right">{centsToBRL(cents)}</span>
              </Fragment>
            ))}
            <span className="font-semibold">Esperado em dinheiro</span>
            <span className="text-right font-semibold">{centsToBRL(session.expectedCashCents)}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setMovementOpen(true)}>
              <Plus size={14} /> Movimentação
            </Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => setClosingConfirm(true)}>
              Fechar caixa
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" className="mt-3" onClick={() => setOpening(true)}>
          Abrir caixa
        </Button>
      )}

      <OpenSessionDialog register={opening ? register : null} onOpenChange={setOpening} orgId={orgId} locationId={locationId} />
      <MovementDialog
        sessionId={movementOpen ? (register.openSession?.id ?? null) : null}
        onOpenChange={setMovementOpen}
        orgId={orgId}
        locationId={locationId}
      />
      <CloseSessionDialog
        sessionId={closingConfirm ? (register.openSession?.id ?? null) : null}
        expectedCents={session?.expectedCashCents ?? register.openSession?.expectedCashCents ?? 0}
        onOpenChange={setClosingConfirm}
        orgId={orgId}
        locationId={locationId}
      />
    </div>
  );
}

export function CaixaTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data: registers, isLoading } = useVenueCashRegisters(orgId, locationId);
  const { create } = useVenueCashRegisterMutations(orgId, locationId);
  const [formOpen, setFormOpen] = useState(false);

  const list = registers ?? [];

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Novo caixa
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum caixa cadastrado"
          description="Cadastre um caixa (ex.: Caixa principal) para começar a registrar vendas e movimentações."
          actionLabel="Novo caixa"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((register) => (
            <RegisterCard key={register.id} orgId={orgId} locationId={locationId} register={register} />
          ))}
        </div>
      )}

      <RegisterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        loading={create.isPending}
        onSubmit={(nome) =>
          create.mutate(
            { nome },
            {
              onSuccess: () => { toast.success("Caixa criado."); setFormOpen(false); },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar o caixa.")),
            },
          )
        }
      />
    </div>
  );
}
