"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, CheckCircle2, XCircle, WifiOff, RefreshCw, ArrowLeft } from "lucide-react";
import { getApiBaseUrl } from "@/lib/surfaces";
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

/**
 * Tela do scanner de check-in — vive em (public-routes) DE PROPÓSITO: o
 * dispositivo físico pareado (via /dashboard/access-pairing) nunca tem
 * sessão de usuário, então esta página não pode depender do layout do
 * dashboard (OrganizationProvider etc. chamam a API autenticada via axios,
 * cujo interceptor de 401 redireciona pro login). A validação ONLINE usa
 * `fetch` direto com a sessão SE ela existir (operador logado); sem sessão
 * (401/403), cai pro fluxo offline do dispositivo pareado — nunca desloga
 * nem redireciona.
 */
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

  async function validarOffline(code: string): Promise<boolean> {
    const config = await getDeviceConfig();
    if (!config) return false;
    const result = await validateOffline(config.eventId, code);
    setScans((prev) => [{ codigo: code, outcome: result.outcome, mensagem: result.message, origem: "offline", synced: false }, ...prev]);
    setCodigo("");
    await refreshPendingCount(config.eventId);
    void trySync(); // tenta sincronizar em background, sem bloquear a próxima leitura
    return true;
  }

  const validarIngresso = async (code: string) => {
    if (!code.trim()) {
      toast.error("Digite o código do ingresso");
      return;
    }

    setLoading(true);
    try {
      // Caminho feliz: tenta online primeiro, com timeout curto. `fetch`
      // direto (nunca o axios `api`): o interceptor global de 401 do axios
      // redireciona pro login, o que destruiria a tela num dispositivo
      // pareado sem sessão. Aqui, 401/403 significa "sem sessão de usuário"
      // e cai pro fluxo offline do dispositivo; só erro de NEGÓCIO com
      // sessão válida (400 etc.) é tratado como rejeição online normal.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ONLINE_TIMEOUT_MS);
      try {
        const res = await fetch(`${getApiBaseUrl()}/tickets/validar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setScans((prev) => [{ codigo: code, outcome: "válido", mensagem: data.eventName ?? "Validado online", origem: "online", synced: true }, ...prev]);
          setCodigo("");
          return;
        }

        if (res.status === 401 || res.status === 403) {
          // Sem sessão de usuário (ou sem permissão de sessão) — dispositivo
          // pareado valida offline; sem pareamento, não há o que fazer.
          const handled = await validarOffline(code);
          if (!handled) {
            toast.error("Sem sessão e nenhum dispositivo pareado — faça login ou pareie este dispositivo em /dashboard/access-pairing.");
          }
          return;
        }

        // Erro de NEGÓCIO (o backend respondeu) — não é caso de fallback offline.
        const body = await res.json().catch(() => ({}));
        const mensagem = body?.message ?? "Ingresso inválido.";
        toast.error(mensagem);
        setScans((prev) => [{ codigo: code, outcome: "inválido", mensagem, origem: "online", synced: true }, ...prev]);
        setCodigo("");
        return;
      } catch {
        clearTimeout(timeoutId);
        // Sem resposta do servidor (rede caiu, timeout) — cai para offline.
      }

      const handled = await validarOffline(code);
      if (!handled) {
        toast.error("Sem conexão e nenhum dispositivo offline pareado — não é possível validar agora.");
      }
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
    // Shell próprio (mesmo padrão fixed inset-0 do dashboard) — cobre o
    // header/footer públicos do RootLayout sem depender do layout privado.
    <main className="fixed inset-0 overflow-y-auto bg-[#faf9fd] text-foreground">
      {/* Next hoisted este <link> para o <head> automaticamente — escopado
          só a esta página, nunca vira link global do site. */}
      <link rel="manifest" href="/access-manifest.json" />
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Check-in</h1>
            <p className="mt-1 text-sm text-black/60">Escaneie o QR Code ou digite o código para validar o ingresso.</p>
          </div>
          <Link href="/dashboard/inicio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
        </div>

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
            className="bg-white text-base"
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
      </div>
    </main>
  );
}
