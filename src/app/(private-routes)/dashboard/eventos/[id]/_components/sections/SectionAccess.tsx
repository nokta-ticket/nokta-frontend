"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Wifi, WifiOff, AlertTriangle, Smartphone, QrCode as QrCodeIcon, Trash2 } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
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

const STATE_META: Record<AccessState, { icon: typeof ShieldCheck; label: string; color: string; bg: string }> = {
  ONLINE: { icon: Wifi, label: "Online", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  OFFLINE_READY: { icon: ShieldCheck, label: "Offline preparado", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  ATTENTION: { icon: AlertTriangle, label: "Atenção", color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

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
  const [removeLoading, setRemoveLoading] = useState(false);

  async function fetchStatus() {
    try {
      const { data } = await api.get<AccessStatus>(`/access/events/${event.id}/status`);
      setStatus(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao carregar status do Nokta Access."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchStatus();
    // Dashboard ao vivo: polling leve — volume de atualização é baixo o
    // suficiente pra não justificar WebSocket do lado do produtor (isso
    // fica reservado à comunicação Hub↔Scanner na rede local do evento).
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [event.id]);

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
      const { data } = await api.post(`/access/events/${event.id}/devices/pairing-code`, {
        kind: pairKind,
        label: pairLabel.trim(),
      });
      setPairResult({ pairingCode: data.pairingCode, expiresAt: data.expiresAt });
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível gerar o código de pareamento."));
    } finally {
      setPairLoading(false);
    }
  }

  async function handleRemoveDevice() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await api.delete(`/access/events/${event.id}/devices/${removeTarget.id}`);
      toast.success("Dispositivo removido.");
      setRemoveTarget(null);
      await fetchStatus();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover o dispositivo."));
    } finally {
      setRemoveLoading(false);
    }
  }

  function closePairDialog() {
    setPairOpen(false);
    setPairLabel("");
    setPairResult(null);
  }

  if (loading) {
    return <p className="py-12 text-center text-muted-foreground">Carregando...</p>;
  }

  const meta = STATE_META[status?.state ?? "ONLINE"];
  const StateIcon = meta.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Nokta Access — Controle de acesso
          </h2>
          <p className="text-sm text-muted-foreground">
            Prepare a operação para continuar validando ingressos mesmo sem internet no dia do evento.
          </p>
        </div>
        <Button onClick={handlePrepare} disabled={preparing} className="bg-violet-600 text-white hover:bg-violet-700">
          {preparing ? "Preparando..." : "Preparar operação offline"}
        </Button>
      </div>

      {/* Estado — sempre calculado pelo backend, nunca decidido aqui */}
      <div className={`rounded-xl border p-5 flex items-center gap-3 ${meta.bg}`}>
        <StateIcon className={`h-6 w-6 ${meta.color}`} />
        <div>
          <p className={`font-semibold ${meta.color}`}>{meta.label}</p>
          <p className="text-sm text-muted-foreground">
            {status?.state === "ONLINE" && "Nenhuma operação offline armada — o check-in valida direto contra o servidor, como sempre."}
            {status?.state === "OFFLINE_READY" && `Snapshot v${status.snapshot?.version} pronto com ${status.snapshot?.ticketCount} ingressos. Todos os dispositivos sincronizados.`}
            {status?.state === "ATTENTION" && "Algum dispositivo está sem sincronizar há um tempo, ou o snapshot falhou — verifique abaixo."}
          </p>
        </div>
      </div>

      {status?.snapshot && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-white p-4 text-center">
            <p className="text-2xl font-semibold">{status.counters.accepted}</p>
            <p className="text-xs text-muted-foreground">Entradas aceitas</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <p className="text-2xl font-semibold">{status.counters.rejected}</p>
            <p className="text-xs text-muted-foreground">Negadas</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <p className="text-2xl font-semibold">{status.counters.conflicts}</p>
            <p className="text-xs text-muted-foreground">Conflitos</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Dispositivos pareados</h3>
        <Button variant="outline" size="sm" onClick={() => setPairOpen(true)}>
          <QrCodeIcon className="mr-2 h-4 w-4" />
          Parear novo dispositivo
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {!status?.devices.length ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Smartphone className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-muted-foreground">Nenhum dispositivo pareado ainda.</p>
          </div>
        ) : (
          <div className="divide-y">
            {status.devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {d.pending ? (
                    <QrCodeIcon className="h-4 w-4 text-amber-500" />
                  ) : d.online ? (
                    <Wifi className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{d.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.kind === "HUB" ? "Access Hub" : "Scanner"} ·{" "}
                      {d.pending
                        ? "aguardando pareamento (código ainda não usado)"
                        : d.lastSyncAt
                          ? `sincronizado ${new Date(d.lastSyncAt).toLocaleTimeString("pt-BR")}`
                          : "nunca sincronizou"}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setRemoveTarget(d)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de pareamento */}
      <Dialog open={pairOpen} onOpenChange={(v) => (v ? setPairOpen(true) : closePairDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parear novo dispositivo</DialogTitle>
            <DialogDescription>
              Gere um código de pareamento e escaneie no scanner (ou digite o código de 6 dígitos manualmente). Válido por 10 minutos.
            </DialogDescription>
          </DialogHeader>

          {!pairResult ? (
            <>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={pairKind === "SCANNER" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPairKind("SCANNER")}
                >
                  Scanner
                </Button>
                <Button
                  type="button"
                  variant={pairKind === "HUB" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPairKind("HUB")}
                >
                  Access Hub
                </Button>
              </div>
              <Input
                placeholder="Nome do dispositivo (ex.: Portão A)"
                value={pairLabel}
                onChange={(e) => setPairLabel(e.target.value)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={closePairDialog}>Cancelar</Button>
                <Button
                  onClick={handleGeneratePairing}
                  disabled={pairLoading || !pairLabel.trim()}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  {pairLoading ? "Gerando..." : "Gerar código"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="bg-white p-3 rounded-lg border">
                <QRCode value={pairResult.pairingCode} size={160} />
              </div>
              <p className="text-3xl font-mono font-bold tracking-widest">{pairResult.pairingCode}</p>
              <p className="text-xs text-muted-foreground text-center">
                Válido até {new Date(pairResult.expiresAt).toLocaleTimeString("pt-BR")}. No dispositivo, digite este código ou escaneie o QR na tela de pareamento.
              </p>
              <DialogFooter className="w-full">
                <Button variant="outline" onClick={() => { void fetchStatus(); closePairDialog(); }} className="w-full">
                  Concluído
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog remover dispositivo */}
      <Dialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover dispositivo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{removeTarget?.label}</strong>? Ele não conseguirá mais sincronizar ou validar ingressos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancelar</Button>
            <Button onClick={handleRemoveDevice} disabled={removeLoading} className="bg-red-600 text-white hover:bg-red-700">
              {removeLoading ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
