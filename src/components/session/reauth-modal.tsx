"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import api from "@/lib/axios";

/**
 * Overlay bloqueante sobre a tela atual — nunca navega. A rota atual, filtros
 * e formulário em andamento por trás nunca se perdem porque a página nunca
 * desmonta. Chamado pelo AuthContext quando o timer de aviso de expiração
 * dispara (ver useSessionTimers).
 */
export function ReauthModal({
  open,
  email,
  onSuccess,
}: {
  open: boolean;
  email: string;
  onSuccess: (sessionExpiresAt: string | null) => void;
}) {
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

  const handleSubmit = async () => {
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

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Sua sessão está prestes a expirar</DialogTitle>
          <DialogDescription>
            {requires2fa
              ? "Confirme o código do seu aplicativo autenticador para continuar."
              : "Confirme sua senha para continuar de onde parou, sem perder o que você estava fazendo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!requires2fa ? (
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Código do autenticador</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="000000"
                inputMode="numeric"
                maxLength={8}
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || (!requires2fa && !senha) || (requires2fa && !code)} className="w-full">
            {submitting ? "Confirmando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
