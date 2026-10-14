"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

type TotpStatus = "loading" | "disabled" | "enabled";

export default function SegurancaPage() {
  const [status, setStatus] = useState<TotpStatus>("loading");

  const [setupOpen, setSetupOpen] = useState(false);
  const [otpauthUri, setOtpauthUri] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupOpen, setBackupOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const { data } = await api.get<{ totpEnabled?: boolean }>("/auth/me");
      setStatus(data.totpEnabled ? "enabled" : "disabled");
    } catch {
      setStatus("disabled");
    }
  }

  async function startSetup() {
    setStarting(true);
    try {
      const { data } = await api.post<{ otpauthUri: string }>("/auth/totp/setup");
      setOtpauthUri(data.otpauthUri);
      setSetupCode("");
      setSetupOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível iniciar a configuração do 2FA."));
    } finally {
      setStarting(false);
    }
  }

  async function confirmSetup() {
    if (setupCode.length !== 6) return;
    setSetupLoading(true);
    try {
      const { data } = await api.post<{ backupCodes: string[] }>("/auth/totp/verify-setup", { code: setupCode });
      setSetupOpen(false);
      setBackupCodes(data.backupCodes);
      setBackupOpen(true);
      setStatus("enabled");
      toast.success("2FA ativado");
    } catch (err) {
      toast.error(getErrorMessage(err, "Código inválido."));
      setSetupCode("");
    } finally {
      setSetupLoading(false);
    }
  }

  async function copyBackupCodes() {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Anote os códigos manualmente.");
    }
  }

  const enabled = status === "enabled";

  return (
    <div className="space-y-6">
      <PageHeader title="Segurança" description="Autenticação de dois fatores da sua conta administrativa." />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {status === "loading" ? (
          <Skeleton className="h-56 rounded-card" />
        ) : (
          <Card accent={!enabled}>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="shield" size={15} />
                  Autenticação de dois fatores (2FA)
                </CardTitle>
                <CardDescription>{enabled ? "Sua conta está protegida com um app autenticador (Google Authenticator, Authy etc.). A cada login é pedido o código do app." : "Ative a verificação em duas etapas pra proteger sua conta administrativa. Você vai precisar de um app autenticador como Google Authenticator ou Authy."}</CardDescription>
              </div>
              <StatusBadge tone={enabled ? "success" : "danger"}>{enabled ? "Ativo" : "Inativo"}</StatusBadge>
            </CardHeader>
            <CardContent className="pt-4">
              {enabled ? (
                <p className="inline-flex items-center gap-2 text-sm text-success">
                  <Icon name="check-circle" size={14} />
                  2FA ativo — a cada login é pedido o código do app
                </p>
              ) : (
                <Button onClick={() => void startSetup()} loading={starting} leftIcon="shield">
                  Ativar 2FA
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Callout tone="info" title="Por que isso importa" className="self-start">
          Ações sensíveis do painel (bloquear recebedor, trocar credenciais de adquirente) exigem o código do autenticador mesmo com a sessão aberta.
        </Callout>
      </div>

      {/* Configuração */}
      <Dialog open={setupOpen} onOpenChange={(o) => (!setupLoading ? setSetupOpen(o) : null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Configurar 2FA</DialogTitle>
            <DialogDescription>Escaneie o QR code com seu app autenticador e digite o código de 6 dígitos pra confirmar.</DialogDescription>
          </DialogHeader>
          <DialogBody className="items-center">
            {otpauthUri ? (
              <div className="rounded-card bg-white p-4 shadow-card">
                <QRCode value={otpauthUri} size={180} />
              </div>
            ) : null}
            <Field label="Código do app" htmlFor="totp-code" className="w-full max-w-[220px]">
              <Input id="totp-code" type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={setupCode} onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => (e.key === "Enter" ? void confirmSetup() : null)} className="text-center font-mono text-lg tracking-[0.3em]" autoFocus />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSetupOpen(false)} disabled={setupLoading}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmSetup()} disabled={setupCode.length !== 6} loading={setupLoading}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Códigos de recuperação */}
      <Dialog open={backupOpen} onOpenChange={(v) => (!v ? setBackupOpen(false) : null)}>
        <DialogContent size="sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Códigos de recuperação</DialogTitle>
            <DialogDescription>Guarde estes códigos num lugar seguro. Cada um vale uma única vez, caso você perca o acesso ao app autenticador.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code) => (
                <div key={code} className="surface-inset rounded-lg px-3 py-2 text-center font-mono text-sm tracking-wider text-foreground">
                  {code}
                </div>
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => void copyBackupCodes()} leftIcon={copied ? "check" : "copy"}>
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button onClick={() => setBackupOpen(false)}>Já guardei os códigos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
