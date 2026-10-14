"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
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
 *   já ter um deviceToken (ver src/lib/access/sync.ts).
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <BrandLogo variant="nokta" height={24} className="mb-8 text-foreground" />
      <Card accent className="w-full max-w-sm gap-6 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon name="shield" size={24} />
          </span>
          <h1 className="text-title font-semibold tracking-tight">Conectar à operação</h1>
          <p className="text-body text-muted-foreground">Digite o código de 6 dígitos exibido na tela do produtor, ou escaneie um QR — de pareamento ou de um Access Hub local.</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleManualSubmit();
          }}
        >
          <Field label="Código de pareamento" htmlFor="pairing-code">
            <Input id="pairing-code" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-14 text-center font-mono text-2xl tracking-[0.4em] md:h-14 md:text-2xl" inputMode="numeric" maxLength={6} autoComplete="one-time-code" />
          </Field>

          <Button type="submit" size="full" loading={loading} disabled={code.length !== 6} leftIcon="plug">
            Conectar
          </Button>
        </form>

        <Button type="button" variant="outline" size="full" onClick={() => setIsScanning((v) => !v)} leftIcon={isScanning ? "close" : "qr"}>
          {isScanning ? "Fechar câmera" : "Escanear QR"}
        </Button>

        {isScanning ? (
          <div className="aspect-square overflow-hidden rounded-card border border-border bg-surface-2">
            <Scanner sound={false} onScan={handleScan} styles={{ container: { width: "100%", height: "100%" } }} />
          </div>
        ) : null}

        <p className="flex items-start gap-2 text-caption text-muted-foreground">
          <Icon name="info" size={12} className="mt-0.5 shrink-0" />
          Conectar a um Access Hub é opcional — só necessário se este evento usa um Hub local pra operar sem internet.
        </p>
      </Card>
    </div>
  );
}
