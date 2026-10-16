"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ChoiceCard } from "@/components/ui/choice-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import type { Tone } from "@/components/ui/badge";
import { SectionCard } from "../section-ui";
import type { SectionProps } from "../types";

type AccessState = "ONLINE" | "OFFLINE_READY" | "ATTENTION";

interface DeviceStatus {
  id: number;
  kind: "SCANNER" | "HUB";
  label: string;
  lastSeenAt: string | null;
  lastSyncAt: string | null;
  /** Código de pareamento gerado, ainda não resgatado pelo dispositivo físico. */
  pending: boolean;
  online: boolean;
}

interface AccessStatus {
  state: AccessState;
  checkinFreezeStatus: string | null;
  snapshot: { version: number; ticketCount: number; isFreezeFinal: boolean } | null;
  devices: DeviceStatus[];
  counters: { accepted: number; rejected: number; conflicts: number };
}

const STATE_META: Record<AccessState, { icon: IconName; label: string; tone: Tone }> = {
  ONLINE: { icon: "globe", label: "Online", tone: "success" },
  OFFLINE_READY: { icon: "shield", label: "Offline preparado", tone: "warning" },
  ATTENTION: { icon: "warning", label: "Atenção", tone: "danger" },
};

/** Nokta Access (check-in offline). Sem aba na UI — ver section-registry.ts. */
export default function SectionAccess({ event }: SectionProps) {
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);

  const [pairOpen, setPairOpen] = useState(false);
  const [pairLabel, setPairLabel] = useState("");
  const [pairKind, setPairKind] = useState<"SCANNER" | "HUB">("SCANNER");
  const [pairLoading, setPairLoading] = useState(false);
  const [pairResult, setPairResult] = useState<{ pairingCode: string; expiresAt: string } | null>(null);

  const [removeTarget, setRemoveTarget] = useState<DeviceStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get<AccessStatus>(`/access/events/${event.id}/status`);
      setStatus(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao carregar status do Nokta Access."));
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void fetchStatus();
    // Dashboard ao vivo: polling leve — volume de atualização é baixo o
    // suficiente pra não justificar WebSocket do lado do produtor (isso
    // fica reservado à comunicação Hub↔Scanner na rede local do evento).
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handlePrepare() {
    setPreparing(true);
    try {
      await api.post(`/access/events/${event.id}/prepare`);
      toast.success("Operação offline preparada — snapshot gerado.");
      await fetchStatus();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível preparar a operação offline."));
    } finally {
      setPreparing(false);
    }
  }

  async function handleGeneratePairing() {
    if (!pairLabel.trim()) return;
    setPairLoading(true);
    try {
      const { data } = await api.post(`/access/events/${event.id}/devices/pairing-code`, { kind: pairKind, label: pairLabel.trim() });
      setPairResult({ pairingCode: data.pairingCode, expiresAt: data.expiresAt });
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível gerar o código de pareamento."));
    } finally {
      setPairLoading(false);
    }
  }

  async function handleRemoveDevice() {
    if (!removeTarget) return;
    try {
      await api.delete(`/access/events/${event.id}/devices/${removeTarget.id}`);
      toast.success("Dispositivo removido.");
      await fetchStatus();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover o dispositivo."));
      throw err;
    }
  }

  function closePairDialog() {
    setPairOpen(false);
    setPairLabel("");
    setPairResult(null);
  }

  if (loading) return <RowsSkeleton rows={4} />;

  const meta = STATE_META[status?.state ?? "ONLINE"];

  return (
    <div className="space-y-4">
      <SectionCard
        title="Nokta Access — controle de acesso"
        description="Prepare a operação pra continuar validando ingressos mesmo sem internet no dia do evento."
        action={
          <Button leftIcon="shield" size="sm" onClick={handlePrepare} loading={preparing}>
            Preparar operação offline
          </Button>
        }
      >
        {/* Estado — sempre calculado pelo backend, nunca decidido aqui */}
        <Callout tone={meta.tone} icon={meta.icon} title={meta.label}>
          {status?.state === "ONLINE" && "Nenhuma operação offline armada — o check-in valida direto contra o servidor, como sempre."}
          {status?.state === "OFFLINE_READY" && `Snapshot v${status.snapshot?.version} pronto com ${status.snapshot?.ticketCount} ingressos. Todos os dispositivos sincronizados.`}
          {status?.state === "ATTENTION" && "Algum dispositivo está sem sincronizar há um tempo, ou o snapshot falhou — verifique abaixo."}
        </Callout>

        {status?.snapshot ? (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Entradas aceitas" icon="check-circle" value={status.counters.accepted} />
            <StatCard label="Negadas" icon="x-circle" value={status.counters.rejected} />
            <StatCard label="Conflitos" icon="warning" value={status.counters.conflicts} />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Dispositivos pareados"
        action={
          <Button variant="outline" size="sm" leftIcon="qr" onClick={() => setPairOpen(true)}>
            Parear dispositivo
          </Button>
        }
        contentClassName="py-3"
      >
        {!status?.devices.length ? (
          <EmptyState compact icon="mobile" title="Nenhum dispositivo pareado" description="Gere um código e escaneie no scanner da portaria." />
        ) : (
          <ul className="divide-y divide-border">
            {status.devices.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <Icon name={d.pending ? "qr" : d.online ? "globe" : "plug"} size={14} className={cn(d.pending ? "text-warning" : d.online ? "text-success" : "text-subtle-foreground")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{d.label}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {d.kind === "HUB" ? "Access Hub" : "Scanner"} · {d.pending ? "aguardando pareamento (código ainda não usado)" : d.lastSyncAt ? `sincronizado ${new Date(d.lastSyncAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "nunca sincronizou"}
                  </p>
                </div>
                <Button variant="subtle" size="icon-sm" aria-label={`Remover ${d.label}`} title="Remover" className="hover:bg-danger-bg hover:text-danger" onClick={() => setRemoveTarget(d)}>
                  <Icon name="trash" size={13} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog open={pairOpen} onOpenChange={(v) => (v ? setPairOpen(true) : closePairDialog())}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Parear novo dispositivo</DialogTitle>
            <DialogDescription>Gere um código de pareamento e escaneie no scanner (ou digite o código de 6 dígitos). Vale por 10 minutos.</DialogDescription>
          </DialogHeader>
          {!pairResult ? (
            <>
              <DialogBody>
                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                  <ChoiceCard selected={pairKind === "SCANNER"} onSelect={() => setPairKind("SCANNER")} icon="mobile" title="Scanner" />
                  <ChoiceCard selected={pairKind === "HUB"} onSelect={() => setPairKind("HUB")} icon="desktop" title="Access Hub" />
                </div>
                <Field label="Nome do dispositivo" htmlFor="pair-label">
                  <Input id="pair-label" placeholder="Ex.: Portão A" value={pairLabel} onChange={(e) => setPairLabel(e.target.value)} />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" onClick={closePairDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleGeneratePairing} loading={pairLoading} disabled={!pairLabel.trim()}>
                  Gerar código
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogBody className="items-center text-center">
                <div className="rounded-card border border-border bg-white p-3">
                  <QRCode value={pairResult.pairingCode} size={160} />
                </div>
                <p className="font-mono text-stat font-medium tracking-[0.3em] text-foreground">{pairResult.pairingCode}</p>
                <p className="text-caption text-muted-foreground">Válido até {new Date(pairResult.expiresAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}. No dispositivo, digite este código ou escaneie o QR na tela de pareamento.</p>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    void fetchStatus();
                    closePairDialog();
                  }}
                >
                  Concluído
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!removeTarget} onOpenChange={(v) => (!v ? setRemoveTarget(null) : null)} danger icon="mobile" title={`Remover ${removeTarget?.label}?`} description="Ele não conseguirá mais sincronizar nem validar ingressos." confirmLabel="Remover" onConfirm={handleRemoveDevice} />
    </div>
  );
}
