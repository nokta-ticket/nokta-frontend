"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { type VenueDevice, type VenueDevicePairingCodeResponse } from "@/services/venue-operation";
import { useVenueDeviceMutations, useVenueDevices } from "../_hooks/use-venue-devices";
import { ConfirmDialog } from "../../cardapio/_components/confirm-dialog";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function PairingCodeDialog({
  result,
  onOpenChange,
}: {
  result: VenueDevicePairingCodeResponse | null;
  onOpenChange: (v: boolean) => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!result) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [result]);

  const expiresAt = result ? new Date(result.expiresAt).getTime() : 0;
  const remainingMs = expiresAt - now;
  const expired = result !== null && remainingMs <= 0;

  return (
    <Dialog open={result !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Código de pareamento</DialogTitle></DialogHeader>
        <div className="space-y-3 text-center">
          <p className="text-sm text-black/60">
            No app Nokta POS do terminal, digite este código na tela de pareamento.
          </p>
          <p className="text-4xl font-bold tracking-[0.3em] text-gray-900">
            {result?.pairingCode ?? ""}
          </p>
          <p className={`text-sm font-medium ${expired ? "text-red-600" : "text-black/60"}`}>
            {expired ? "Código expirado — gere um novo." : `Expira em ${formatRemaining(remainingMs)}`}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewDeviceDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (label: string) => void;
  loading: boolean;
}) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (open) setLabel("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo terminal</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="terminal-label">Identificação</Label>
          <Input
            id="terminal-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex.: Maquininha do caixa, Terminal balcão"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button disabled={loading || !label.trim()} onClick={() => onSubmit(label.trim())}>
            {loading ? "Gerando…" : "Gerar código"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeviceRow({
  device,
  onRevoke,
  onShowCode,
}: {
  device: VenueDevice;
  onRevoke: () => void;
  onShowCode: () => void;
}) {
  const paired = device.deviceToken !== null;
  const pendingExpired =
    !paired && (!device.pairingCodeExpiresAt || new Date(device.pairingCodeExpiresAt).getTime() < Date.now());

  return (
    <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4">
      <div>
        <p className="font-semibold text-gray-900">{device.label}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {paired ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Pareado</span>
          ) : pendingExpired ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Código expirado</span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Aguardando pareamento</span>
          )}
          {paired && device.lastSeenAt ? (
            <span className="text-xs text-black/50">
              Visto por último em {new Date(device.lastSeenAt).toLocaleString("pt-BR")}
            </span>
          ) : paired ? (
            // Pareado mas nunca fez nenhuma requisição autenticada desde
            // então — sinal de que o app pode ter sido reinstalado/trocado
            // logo depois do pareamento, ou nunca chegou a ser usado de
            // verdade. Revogado automaticamente após 15 dias assim (ver
            // VenueDeviceExpirationService, backend).
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
              Nunca usado desde o pareamento
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-black/40">
          Pareado em {new Date(device.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!paired && !pendingExpired ? (
          <Button size="sm" variant="outline" onClick={onShowCode}>
            Ver código
          </Button>
        ) : null}
        <Button size="sm" variant="outline" className="text-red-600" onClick={onRevoke}>
          Revogar
        </Button>
      </div>
    </div>
  );
}

export function TerminaisTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data: devices, isLoading } = useVenueDevices(orgId, locationId);
  const { createPairingCode, revoke } = useVenueDeviceMutations(orgId, locationId);
  const [formOpen, setFormOpen] = useState(false);
  const [pairingResult, setPairingResult] = useState<VenueDevicePairingCodeResponse | null>(null);
  const [revokeDeviceId, setRevokeDeviceId] = useState<number | null>(null);

  const list = devices ?? [];

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Novo terminal
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum terminal pareado"
          description="Gere um código de pareamento para conectar o app Nokta POS numa maquininha ou terminal físico."
          actionLabel="Novo terminal"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="space-y-2">
          {list.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              onRevoke={() => setRevokeDeviceId(device.id)}
              onShowCode={() => {
                if (!device.pairingCode || !device.pairingCodeExpiresAt) return;
                setPairingResult({
                  id: device.id,
                  pairingCode: device.pairingCode,
                  expiresAt: device.pairingCodeExpiresAt,
                });
              }}
            />
          ))}
        </div>
      )}

      <NewDeviceDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        loading={createPairingCode.isPending}
        onSubmit={(label) =>
          createPairingCode.mutate(
            { locationId, label },
            {
              onSuccess: (result) => {
                setFormOpen(false);
                setPairingResult(result);
              },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível gerar o código de pareamento.")),
            },
          )
        }
      />

      <PairingCodeDialog result={pairingResult} onOpenChange={(v) => !v && setPairingResult(null)} />

      <ConfirmDialog
        open={revokeDeviceId !== null}
        onOpenChange={(v) => !v && setRevokeDeviceId(null)}
        title="Revogar terminal"
        description="O terminal perderá acesso imediatamente e precisará de um novo código para parear novamente."
        confirmLabel="Revogar"
        loading={revoke.isPending}
        onConfirm={() => {
          if (revokeDeviceId === null) return;
          revoke.mutate(revokeDeviceId, {
            onSuccess: () => { toast.success("Terminal revogado."); setRevokeDeviceId(null); },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível revogar o terminal.")),
          });
        }}
      />
    </div>
  );
}
