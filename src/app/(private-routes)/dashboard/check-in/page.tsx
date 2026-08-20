"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, CheckCircle2, XCircle, WifiOff, RefreshCw } from "lucide-react";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { validateOffline } from "@/lib/access/validate-offline";
import { getDeviceConfig, getPendingCheckins, CheckinOutcome } from "@/lib/access/db";
import { syncPendingCheckins } from "@/lib/access/sync";
import { registerAccessServiceWorker } from "@/lib/access/register-sw";

type ScanEntry = {
  codigo: string;
  outcome: CheckinOutcome | "válido" | "inválido"; // "válido"/"inválido" cobre o caminho online legado
  mensagem: string;
  origem: "online" | "offline";
  synced: boolean;
};

const ONLINE_TIMEOUT_MS = 3000;

function outcomeIsPositive(outcome: ScanEntry["outcome"]): boolean {
  return outcome === "válido" || outcome === "ACCEPTED";
}

export default function ValidarIngressoPage() {
  const [codigo, setCodigo] = useState("");
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [deviceEventId, setDeviceEventId] = useState<number | null>(null);

  useEffect(() => {
    registerAccessServiceWorker();
  }, []);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    getDeviceConfig().then((config) => {
      if (config) setDeviceEventId(config.eventId);
    });
  }, []);

  useEffect(() => {
    if (!deviceEventId) return;
    refreshPendingCount(deviceEventId);
  }, [deviceEventId]);

  async function refreshPendingCount(eventId: number) {
    const pending = await getPendingCheckins(eventId);
    setPendingCount(pending.length);
  }

  async function trySync() {
    if (!deviceEventId) return;
    try {
      const { sent, conflicts } = await syncPendingCheckins(deviceEventId);
      if (sent > 0) {
        toast.success(`${sent} check-in(s) sincronizado(s)${conflicts > 0 ? ` — ${conflicts} conflito(s) detectado(s)` : ""}.`);
        await refreshPendingCount(deviceEventId);
      }
    } catch {
      // Sem internet ainda — silencioso, tenta de novo na próxima
      // oportunidade (próxima validação, ou o próximo clique manual).
    }
  }

  const validarIngresso = async (code: string) => {
    if (!code.trim()) {
      toast.error("Digite o código do ingresso");
      return;
    }

    setLoading(true);
    try {
      // Caminho feliz: tenta online primeiro, com timeout curto — só cai
      // pro offline se a REDE falhar (timeout, sem conexão), nunca por um
      // 400 de negócio (ingresso inválido/bloqueado/já usado), que
      // continua tratado como erro normal, igual sempre foi.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ONLINE_TIMEOUT_MS);
      try {
        const res = await api.post("/tickets/validar", { code }, { signal: controller.signal });
        clearTimeout(timeoutId);
        setScans((prev) => [{ codigo: code, outcome: "válido", mensagem: res.data.eventName, origem: "online", synced: true }, ...prev]);
        setCodigo("");
        return;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof AxiosError && error.response) {
          // Erro de NEGÓCIO (o backend respondeu) — não é caso de fallback offline.
          toast.error(error.response.data?.message ?? "Ingresso inválido.");
          setScans((prev) => [{ codigo: code, outcome: "inválido", mensagem: error.response?.data?.message ?? "Ingresso inválido.", origem: "online", synced: true }, ...prev]);
          setCodigo("");
          return;
        }
        // Sem resposta do servidor (rede caiu, timeout) — cai para offline.
      }

      const config = await getDeviceConfig();
      if (!config) {
        toast.error("Sem conexão e nenhum dispositivo offline pareado — não é possível validar agora.");
        return;
      }

      const result = await validateOffline(config.eventId, code);
      setScans((prev) => [{ codigo: code, outcome: result.outcome, mensagem: result.message, origem: "offline", synced: false }, ...prev]);
      setCodigo("");
      await refreshPendingCount(config.eventId);
      void trySync(); // tenta sincronizar em background, sem bloquear a próxima leitura
    } finally {
      setLoading(false);
    }
  };

  const handleToogleScan = () => {
    setIsScanning((prev) => !prev);
  };

  async function scanResult(result: IDetectedBarcode[]) {
    if (result[0]) {
      const rawValue = result[0].rawValue;
      setIsScanning(false);
      validarIngresso(rawValue);
    }
  }

  return (
    <PageContainer>
      {/* Next hoisted este <link> para o <head> automaticamente — escopado
          só a esta página, nunca vira link global do site. */}
      <link rel="manifest" href="/access-manifest.json" />
      <PageHeader
        title="Check-in"
        description="Escaneie o QR Code ou digite o código para validar o ingresso."
      />

      <div className="flex items-center justify-between gap-3 text-sm">
        <div className={`flex items-center gap-1.5 ${isOnline ? "text-muted-foreground" : "text-amber-600"}`}>
          {!isOnline && <WifiOff className="w-4 h-4" />}
          {isOnline ? "Conectado" : "Sem internet — validando offline"}
        </div>
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={trySync}
            className="flex items-center gap-1.5 text-amber-600 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {pendingCount} pendente(s) de sincronização
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Código do ingresso"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="bg-white"
        />
        <Button onClick={() => validarIngresso(codigo)} disabled={loading}>
          {loading ? "Validando..." : "Validar"}
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleToogleScan}
      >
        <QrCode className="w-5 h-5" />
        Escanear QR Code
      </Button>

      {isScanning && (
        <div className="w-xl mx-auto">
          <Scanner sound={false} onScan={scanResult} />
        </div>
      )}

      <div className="space-y-3">
        {scans.map((scan, idx) => {
          const ok = outcomeIsPositive(scan.outcome);
          return (
            <div
              key={`${scan.codigo}-${idx}`}
              className={`p-5 rounded-lg border shadow-sm ${
                ok ? "border-green-500 bg-green-50 text-green-700" : "border-red-500 bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2 text-xl font-semibold">
                {ok ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                {ok ? "Ingresso Válido" : "Ingresso Inválido"}
                {scan.origem === "offline" && (
                  <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-white/60 border">
                    {scan.synced ? "sincronizado" : "offline · pendente"}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <strong>{ok ? "Evento" : "Motivo"}:</strong> {scan.mensagem}
                </p>
                <p>
                  <strong>Código:</strong> {scan.codigo}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
