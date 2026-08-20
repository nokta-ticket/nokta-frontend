"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, ShieldCheck, Wifi } from "lucide-react";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { redeemPairingCode } from "@/lib/access/sync";
import { getDeviceConfig, saveDeviceConfig } from "@/lib/access/db";

/**
 * Tela de pareamento do PRÓPRIO dispositivo de check-in — sem sessão de
 * usuário (o scanner físico nunca tem login).
 *
 * Aceita DOIS QRs distintos no mesmo leitor:
 * - Código de 6 dígitos (texto ou QR do produtor, `/access/pairing/redeem`):
 *   troca por deviceToken definitivo — precisa acontecer primeiro, com
 *   internet disponível.
 * - URL do Access Hub (`http://IP:porta`, QR "Conectar a este Hub" exibido
 *   na tela `/` do próprio Hub): grava/atualiza `pairedHubUrl` no
 *   deviceConfig já existente — passo OPCIONAL e posterior, só depois de
 *   já ter um deviceToken (o Hub reusa a mesma autenticação, só muda o
 *   baseURL das chamadas — ver src/lib/access/sync.ts).
 */
export default function AccessPairingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  async function redeemDeviceCode(rawCode: string) {
    setLoading(true);
    try {
      const config = await redeemPairingCode(rawCode);
      await saveDeviceConfig(config);
      toast.success(`Dispositivo "${config.label}" pareado com sucesso.`);
      router.push("/dashboard/check-in");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível parear este dispositivo.");
    } finally {
      setLoading(false);
    }
  }

  async function connectToHub(hubUrl: string) {
    const existing = await getDeviceConfig();
    if (!existing) {
      toast.error("Pareie este dispositivo com o código de 6 dígitos primeiro, depois conecte a um Hub.");
      return;
    }
    setLoading(true);
    try {
      await saveDeviceConfig({ ...existing, pairedHubUrl: hubUrl });
      toast.success("Conectado ao Access Hub — as sincronizações agora passam pela rede local.");
      router.push("/dashboard/check-in");
    } finally {
      setLoading(false);
    }
  }

  async function handleScan(results: IDetectedBarcode[]) {
    const raw = results[0]?.rawValue?.trim();
    if (!raw) return;
    setIsScanning(false);

    if (/^\d{6}$/.test(raw)) {
      await redeemDeviceCode(raw);
      return;
    }
    if (/^https?:\/\//i.test(raw)) {
      await connectToHub(raw);
      return;
    }
    toast.error("QR não reconhecido — esperado um código de 6 dígitos ou o QR do Access Hub.");
  }

  async function handleManualSubmit() {
    if (code.length !== 6) {
      toast.error("Digite o código de 6 dígitos.");
      return;
    }
    await redeemDeviceCode(code);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-10 w-10 text-violet-600" />
          <h1 className="text-xl font-semibold">Conectar à operação</h1>
          <p className="text-sm text-muted-foreground">
            Digite o código de 6 dígitos exibido na tela do produtor, ou escaneie um QR — de pareamento ou de um Access Hub local.
          </p>
        </div>

        <Input
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="text-center text-2xl font-mono tracking-widest h-14"
          inputMode="numeric"
          maxLength={6}
        />

        <Button onClick={handleManualSubmit} disabled={loading || code.length !== 6} className="w-full bg-violet-600 text-white hover:bg-violet-700">
          {loading ? "Conectando..." : "Conectar"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setIsScanning((v) => !v)}
        >
          <QrCode className="w-4 h-4" />
          {isScanning ? "Fechar câmera" : "Escanear QR"}
        </Button>

        {isScanning && (
          <div className="rounded-lg overflow-hidden">
            <Scanner sound={false} onScan={handleScan} />
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Wifi className="h-3.5 w-3.5" />
          Conectar a um Access Hub é opcional — só necessário se este evento usa um Hub local para operar sem internet.
        </p>
      </div>
    </div>
  );
}
