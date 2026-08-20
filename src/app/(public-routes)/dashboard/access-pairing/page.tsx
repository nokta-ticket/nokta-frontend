"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { redeemPairingCode } from "@/lib/access/sync";
import { saveDeviceConfig } from "@/lib/access/db";

/**
 * Tela de pareamento do PRÓPRIO dispositivo de check-in — sem sessão de
 * usuário (o scanner físico nunca tem login). Troca o código de 6 dígitos
 * gerado na tela "Nokta Access" do produtor pelo deviceToken definitivo, e
 * salva no IndexedDB local (device-config, ver src/lib/access/db.ts).
 */
export default function AccessPairingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    if (code.length !== 6) {
      toast.error("Digite o código de 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const config = await redeemPairingCode(code);
      await saveDeviceConfig(config);
      toast.success(`Dispositivo "${config.label}" pareado com sucesso.`);
      router.push("/dashboard/check-in");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível parear este dispositivo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-10 w-10 text-violet-600" />
          <h1 className="text-xl font-semibold">Conectar à operação</h1>
          <p className="text-sm text-muted-foreground">
            Digite o código de 6 dígitos exibido na tela do produtor, ou escaneie o QR de pareamento.
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

        <Button onClick={handleRedeem} disabled={loading || code.length !== 6} className="w-full bg-violet-600 text-white hover:bg-violet-700">
          {loading ? "Conectando..." : "Conectar"}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <QrCode className="h-3.5 w-3.5" />
          Leitura de QR de pareamento chega numa fase seguinte — por ora, digite o código manualmente.
        </p>
      </div>
    </div>
  );
}
