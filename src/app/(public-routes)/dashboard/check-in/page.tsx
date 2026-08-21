"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { getApiBaseUrl } from "@/lib/surfaces";

type ScanEntry = {
  codigo: string;
  outcome: "válido" | "inválido";
  mensagem: string;
};

/**
 * Tela de check-in — valida ingressos contra a API (POST /tickets/validar)
 * usando a sessão do operador logado. Fica em (public-routes) porque
 * historicamente também servia um fluxo offline sem sessão (Nokta Access,
 * desativado em 2026-08-21 — exigia roteador Wi-Fi físico dedicado no
 * local do evento, infraestrutura considerada gambiarra demais frente a
 * alternativas mais simples em avaliação). O código do modo offline/Hub
 * (src/lib/access/*, nokta-access-hub/) foi mantido no repositório, só
 * removido desta tela.
 */
export default function ValidarIngressoPage() {
  const [codigo, setCodigo] = useState("");
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const validarIngresso = async (code: string) => {
    if (!code.trim()) {
      toast.error("Digite o código do ingresso");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/tickets/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const mensagem = data.eventName ?? "Validado";
        toast.success(`Ingresso válido — ${mensagem}`);
        setScans((prev) => [{ codigo: code, outcome: "válido", mensagem }, ...prev]);
        setCodigo("");
        return;
      }

      const body = await res.json().catch(() => ({}));
      const mensagem = body?.message ?? "Ingresso inválido.";
      toast.error(mensagem);
      setScans((prev) => [{ codigo: code, outcome: "inválido", mensagem }, ...prev]);
      setCodigo("");
    } catch {
      toast.error("Sem conexão com o servidor — tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleToogleScan = () => {
    setIsScanning((prev) => !prev);
  };

  function handleScanError(error: unknown) {
    // Sem isso, permissão de câmera negada / sem câmera disponível falhava
    // completamente em silêncio — a tela ficava com a área do scanner
    // parada, sem nenhum indício do que deu errado.
    setIsScanning(false);
    const message = error instanceof Error ? error.message : "Não foi possível acessar a câmera.";
    toast.error(`Câmera indisponível — ${message}`);
  }

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
          <div className="mx-auto w-full max-w-sm aspect-square overflow-hidden rounded-lg">
            <Scanner sound={false} onScan={scanResult} onError={handleScanError} />
          </div>
        )}

        <div className="space-y-3">
          {scans.map((scan, idx) => {
            const ok = scan.outcome === "válido";
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
