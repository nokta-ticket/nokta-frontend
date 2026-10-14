"use client";

import { useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/lib/toast";
import api, { getErrorMessage } from "@/lib/axios";

/**
 * Overlay bloqueante sobre a tela atual — nunca navega. A rota atual, filtros
 * e formulário em andamento por trás nunca se perdem porque a página nunca
 * desmonta. Chamado pelo AuthContext quando o timer de aviso de expiração
 * dispara (5min antes do fim absoluto da sessão).
 */
export function ReauthModal({ open, email, onSuccess }: { open: boolean; email: string; onSuccess: (sessionExpiresAt: string | null) => void }) {
  const [senha, setSenha] = useState("");
  const [code, setCode] = useState("");
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSenha("");
    setCode("");
    setRequires2fa(false);
    setTwoFactorToken("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (requires2fa) {
        const res = await api.post("/auth/totp/verify", { twoFactorToken, code });
        toast.success("Sessão renovada.");
        reset();
        onSuccess(res.data?.sessionExpiresAt ?? null);
        return;
      }

      const res = await api.post("/auth/reauthenticate", { email, senha });
      if (res.data?.requires2fa) {
        setRequires2fa(true);
        setTwoFactorToken(res.data.twoFactorToken);
        return;
      }
      toast.success("Sessão renovada.");
      reset();
      onSuccess(res.data?.sessionExpiresAt ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível confirmar sua identidade."));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = requires2fa ? code.length >= 6 : senha.length > 0;

  return (
    <Dialog open={open}>
      <DialogContent size="sm" showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pr-5 sm:pr-6">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icon name="clock" size={18} />
            </span>
            <DialogTitle>Sua sessão está quase expirando</DialogTitle>
            <DialogDescription>{requires2fa ? "Confirme o código do seu aplicativo autenticador para continuar." : "Confirme sua senha para continuar de onde parou, sem perder o que você estava fazendo."}</DialogDescription>
          </DialogHeader>

          <DialogBody className="pt-1">
            {!requires2fa ? (
              <Field label="Senha" htmlFor="reauth-senha" hint={email}>
                <PasswordInput id="reauth-senha" leftIcon="lock" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} autoFocus />
              </Field>
            ) : (
              <Field label="Código do autenticador">
                <OtpInput value={code} onChange={setCode} onComplete={() => handleSubmit()} disabled={submitting} autoFocus />
              </Field>
            )}
          </DialogBody>

          <DialogFooter className="border-t-0 pt-0">
            <Button type="submit" size="full" loading={submitting} disabled={!canSubmit}>
              {submitting ? "Confirmando…" : "Continuar conectado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
