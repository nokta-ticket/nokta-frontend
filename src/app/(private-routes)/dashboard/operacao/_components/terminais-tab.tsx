"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueDevice, VenueDevicePairingCodeResponse } from "@/services/venue-operation";
import { useVenueDeviceMutations, useVenueDevices } from "../_hooks/use-venue-devices";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Terminal pareado (token válido) sem nenhuma requisição autenticada há mais
// de 60s é "Desconectado", não "Não pareado" — volta a "Conectado" sozinho no
// próximo heartbeat. O polling do hook (10s) acompanha esta janela.
const ONLINE_THRESHOLD_MS = 60 * 1000;

type DeviceStatus = "online" | "offline" | "unpaired" | "pending";

const STATUS_META: Record<DeviceStatus, { label: string; tone: Tone; pulse?: boolean }> = {
  online: { label: "Conectado", tone: "success", pulse: true },
  offline: { label: "Desconectado", tone: "warning" },
  unpaired: { label: "Não pareado", tone: "danger" },
  pending: { label: "Aguardando pareamento", tone: "brand" },
};

// serverNowMs vem SEMPRE do backend (VenueDevicesResponse.serverNow) — comparar
// o relógio do servidor com o do navegador é clock drift na certa.
function resolveStatus(device: VenueDevice, serverNowMs: number): DeviceStatus {
  if (device.revokedAt) return "unpaired";
  if (device.deviceToken !== null) {
    const lastSeenMs = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : null;
    return lastSeenMs !== null && serverNowMs - lastSeenMs < ONLINE_THRESHOLD_MS ? "online" : "offline";
  }
  const pendingExpired = !device.pairingCodeExpiresAt || new Date(device.pairingCodeExpiresAt).getTime() < serverNowMs;
  return pendingExpired ? "unpaired" : "pending";
}

function PairingCodeDialog({ result, devices, onOpenChange }: { result: VenueDevicePairingCodeResponse | null; devices: VenueDevice[]; onOpenChange: (v: boolean) => void }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!result) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [result]);

  // Pareou enquanto o diálogo estava aberto: fecha sozinho.
  useEffect(() => {
    if (!result) return;
    const device = devices.find((d) => d.id === result.id);
    if (device?.deviceToken) onOpenChange(false);
  }, [result, devices, onOpenChange]);

  const expiresAt = result ? new Date(result.expiresAt).getTime() : 0;
  const remainingMs = expiresAt - now;
  const expired = result !== null && remainingMs <= 0;

  return (
    <Dialog open={result !== null} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Código de pareamento</DialogTitle>
          <DialogDescription>No app Nokta POS do terminal, digite este código na tela de pareamento.</DialogDescription>
        </DialogHeader>
        <DialogBody className="items-center text-center">
          <p className={cn("font-display text-hero tracking-[0.18em] text-foreground tnum", expired && "opacity-30")} aria-live="polite">
            {result?.pairingCode ?? ""}
          </p>
          {expired ? <StatusBadge tone="danger">Código expirado — gere um novo</StatusBadge> : <StatusBadge tone="brand" pulse>Expira em {formatRemaining(remainingMs)}</StatusBadge>}
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewDeviceDialog({ open, onOpenChange, onSubmit, loading }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (label: string) => void; loading: boolean }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (open) setLabel("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Novo terminal</DialogTitle>
          <DialogDescription>Gera um código de 6 dígitos pra conectar o app Nokta POS.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Identificação" htmlFor="terminal-label">
            <Input id="terminal-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: Maquininha do caixa, Terminal balcão" autoFocus />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={!label.trim()} loading={loading} leftIcon="qr" onClick={() => onSubmit(label.trim())}>
            Gerar código
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeviceCard({ device, serverNowMs, index, onRevoke, onShowCode, onRegenerateCode, onDelete, regenerating }: { device: VenueDevice; serverNowMs: number; index: number; onRevoke: () => void; onShowCode: () => void; onRegenerateCode: () => void; onDelete: () => void; regenerating: boolean }) {
  const status = resolveStatus(device, serverNowMs);
  const meta = STATUS_META[status];
  const paired = device.deviceToken !== null;

  return (
    <article className="row-in flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between" style={{ ["--i" as string]: index } as never}>
      <div className="flex min-w-0 items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", status === "online" ? "bg-success-bg text-success" : "bg-surface-2 text-muted-foreground")}>
          <Icon name="tablet" size={16} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-foreground">{device.label}</p>
            <StatusBadge tone={meta.tone} pulse={meta.pulse}>
              {meta.label}
            </StatusBadge>
          </div>
          <p className="mt-1 text-caption text-muted-foreground">
            {paired && device.lastSeenAt ? `Visto por último em ${new Date(device.lastSeenAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : paired ? "Nunca usado desde o pareamento" : status === "pending" ? "Código gerado, aguardando o app" : "Vínculo encerrado"}
            {" · "}
            <span className="tnum">Cadastrado em {new Date(device.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        {status === "pending" ? (
          <Button size="sm" variant="outline" leftIcon="qr" onClick={onShowCode}>
            Ver código
          </Button>
        ) : null}
        {status === "unpaired" || status === "offline" ? (
          <Button size="sm" variant="outline" leftIcon="refresh" loading={regenerating} onClick={onRegenerateCode}>
            Novo código
          </Button>
        ) : null}
        {status !== "unpaired" ? (
          <Button size="sm" variant="subtle" className="hover:bg-danger-bg hover:text-danger" leftIcon="ban" onClick={onRevoke}>
            Revogar
          </Button>
        ) : null}
        {status === "unpaired" ? (
          <Button size="icon-sm" variant="subtle" className="hover:bg-danger-bg hover:text-danger" aria-label="Excluir terminal" onClick={onDelete}>
            <Icon name="trash" size={13} />
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function TerminaisTab({ orgId, locationId, formOpen, onFormOpenChange }: { orgId: number; locationId: number; formOpen: boolean; onFormOpenChange: (v: boolean) => void }) {
  const { data, isLoading } = useVenueDevices(orgId, locationId);
  const { createPairingCode, revoke, regeneratePairingCode, deleteDevice } = useVenueDeviceMutations(orgId, locationId);
  const [pairingResult, setPairingResult] = useState<VenueDevicePairingCodeResponse | null>(null);
  const [revokeDeviceId, setRevokeDeviceId] = useState<number | null>(null);
  const [deleteDeviceId, setDeleteDeviceId] = useState<number | null>(null);

  const list = data?.devices ?? [];
  // Só pro instante antes do primeiro fetch (coberto pelo skeleton).
  const serverNowMs = data ? new Date(data.serverNow).getTime() : Date.now();
  const online = list.filter((d) => resolveStatus(d, serverNowMs) === "online").length;

  if (isLoading) return <RowsSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <EmptyState
          icon="tablet"
          title="Nenhum terminal pareado"
          description="Gere um código de pareamento pra conectar o app Nokta POS numa maquininha ou tablet."
          action={
            <Button leftIcon="plus" onClick={() => onFormOpenChange(true)}>
              Novo terminal
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-caption text-muted-foreground tnum">
            {online} de {list.length} {list.length === 1 ? "terminal conectado" : "terminais conectados"} agora
          </p>
          <div className="space-y-2.5">
            {list.map((device, i) => (
              <DeviceCard
                key={device.id}
                device={device}
                serverNowMs={serverNowMs}
                index={i}
                onRevoke={() => setRevokeDeviceId(device.id)}
                onShowCode={() => {
                  if (!device.pairingCode || !device.pairingCodeExpiresAt) return;
                  setPairingResult({ id: device.id, pairingCode: device.pairingCode, expiresAt: device.pairingCodeExpiresAt });
                }}
                onRegenerateCode={() =>
                  regeneratePairingCode.mutate(device.id, {
                    onSuccess: (result) => setPairingResult(result),
                    onError: (err) => toast.error(getErrorMessage(err, "Não foi possível gerar um novo código de pareamento.")),
                  })
                }
                onDelete={() => setDeleteDeviceId(device.id)}
                regenerating={regeneratePairingCode.isPending && regeneratePairingCode.variables === device.id}
              />
            ))}
          </div>
        </>
      )}

      <NewDeviceDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        loading={createPairingCode.isPending}
        onSubmit={(label) =>
          createPairingCode.mutate(
            { locationId, label },
            {
              onSuccess: (result) => {
                onFormOpenChange(false);
                setPairingResult(result);
              },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível gerar o código de pareamento.")),
            },
          )
        }
      />

      <PairingCodeDialog result={pairingResult} devices={list} onOpenChange={(v) => !v && setPairingResult(null)} />

      <ConfirmDialog
        open={revokeDeviceId !== null}
        onOpenChange={(v) => !v && setRevokeDeviceId(null)}
        danger
        title="Revogar terminal"
        description="O terminal perde o acesso na hora e vai precisar de um novo código pra parear de novo."
        confirmLabel="Revogar"
        onConfirm={async () => {
          if (revokeDeviceId === null) return;
          try {
            await revoke.mutateAsync(revokeDeviceId);
            toast.success("Terminal revogado.");
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível revogar o terminal."));
          }
        }}
      />

      <ConfirmDialog
        open={deleteDeviceId !== null}
        onOpenChange={(v) => !v && setDeleteDeviceId(null)}
        danger
        icon="trash"
        title="Excluir terminal"
        description="Remove este terminal da lista de vez. Se precisar dele de novo, crie um terminal novo."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (deleteDeviceId === null) return;
          try {
            await deleteDevice.mutateAsync(deleteDeviceId);
            toast.success("Terminal excluído.");
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível excluir o terminal."));
          }
        }}
      />
    </div>
  );
}
