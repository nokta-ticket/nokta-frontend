"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

type TotpStatus = "loading" | "disabled" | "enabled";

export default function SegurancaPage() {
  const [status, setStatus] = useState<TotpStatus>("loading");

  const [setupOpen, setSetupOpen] = useState(false);
  const [otpauthUri, setOtpauthUri] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupOpen, setBackupOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const { data } = await api.get("/auth/me");
      setStatus(data.totpEnabled ? "enabled" : "disabled");
    } catch {
      setStatus("disabled");
    }
  }

  async function startSetup() {
    try {
      const { data } = await api.post("/auth/totp/setup");
      setOtpauthUri(data.otpauthUri);
      setSetupCode("");
      setSetupOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao iniciar configuração 2FA."));
    }
  }

  async function confirmSetup() {
    if (setupCode.length !== 6) return;
    setSetupLoading(true);
    try {
      const { data } = await api.post("/auth/totp/verify-setup", { code: setupCode });
      setSetupOpen(false);
      setBackupCodes(data.backupCodes);
      setBackupOpen(true);
      setStatus("enabled");
      toast.success("2FA ativado com sucesso!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Código inválido."));
      setSetupCode("");
    } finally {
      setSetupLoading(false);
    }
  }

  function copyBackupCodes() {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Segurança</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie a autenticação de dois fatores da sua conta administrativa.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <Shield className="h-6 w-6 text-violet-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Autenticação de dois fatores (2FA)</h2>
              <Badge
                className={
                  status === "enabled"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {status === "enabled" ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {status === "enabled"
                ? "Sua conta está protegida com autenticação de dois fatores via app autenticador (Google Authenticator, Authy, etc)."
                : "Ative a verificação em duas etapas para proteger sua conta administrativa. Você precisará de um app autenticador como Google Authenticator ou Authy."}
            </p>

            <div className="mt-4">
              {status === "enabled" ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                  2FA ativo — a cada login será solicitado o código do app
                </div>
              ) : (
                <Button
                  onClick={startSetup}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Ativar 2FA
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar 2FA</DialogTitle>
            <DialogDescription>
              Escaneie o QR code abaixo com seu app autenticador e insira o código de 6 dígitos para confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {otpauthUri && (
              <div className="rounded-lg border bg-white p-4">
                <QRCode value={otpauthUri} size={200} />
              </div>
            )}

            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))}
              className="max-w-[180px] text-center text-lg font-mono tracking-[0.3em]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmSetup}
              disabled={setupLoading || setupCode.length !== 6}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {setupLoading ? "Verificando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Modal */}
      <Dialog open={backupOpen} onOpenChange={(v) => { if (!v) setBackupOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Códigos de recuperação</DialogTitle>
            <DialogDescription>
              Guarde estes códigos em um local seguro. Cada código pode ser usado uma única vez caso você perca acesso ao app autenticador.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div
                  key={i}
                  className="rounded bg-white px-3 py-1.5 text-center font-mono text-sm border"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={copyBackupCodes}>
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
            <Button
              onClick={() => setBackupOpen(false)}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              Já guardei os códigos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
