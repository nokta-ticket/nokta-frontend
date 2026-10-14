"use client";

import { useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { UserPayload } from "@/context/AuthContext";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { OtpInput } from "@/components/ui/otp-input";
import { useResendCooldown } from "@/components/auth/use-resend-cooldown";

interface ConfirmEmailModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  /** Telefone da conta (vem do 403 ACCOUNT_NOT_CONFIRMED do login) — só pro rate limit de tentativas. */
  phone?: string;
  /** Recebe o usuário já autenticado: confirmar-telefone grava o cookie de sessão. */
  onConfirm: (user: UserPayload | null | undefined) => void;
}

/**
 * Conta criada mas nunca confirmada: o login devolve ACCOUNT_NOT_CONFIRMED
 * (e já reenvia o código pro WhatsApp). Aqui a pessoa digita o código e sai
 * autenticada — `POST /auth/confirmar-telefone` grava o cookie de sessão.
 */
export function ConfirmEmailModal({ open, onClose, email, phone, onConfirm }: ConfirmEmailModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const cooldown = useResendCooldown(60);

  useEffect(() => {
    if (open) {
      setCode("");
      setInvalid(false);
      cooldown.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = async (value: string) => {
    setLoading(true);
    setInvalid(false);
    try {
      const res = await api.post("/auth/confirmar-telefone", phone ? { token: value, phone } : { token: value });
      onConfirm(res.data?.user);
    } catch {
      setInvalid(true);
      setCode("");
      toast.error("Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!cooldown.canResend) return;
    try {
      await api.post("/auth/reenviar-confirmacao", { email });
      toast.success("Novo código enviado!");
      cooldown.startCooldown(cooldown.sendCount + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao reenviar o código."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="whatsapp" size={18} className="text-success" />
            Confirma seu número
          </DialogTitle>
          <DialogDescription>Mandamos um código de 6 dígitos pro WhatsApp da sua conta.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-5 pb-6">
          <OtpInput value={code} onChange={setCode} onComplete={handleConfirm} disabled={loading} invalid={invalid} autoFocus />

          <p className="flex min-h-5 items-center justify-center gap-2 text-center text-caption text-muted-foreground">
            {loading ? (
              <>
                <Icon name="loader" size={12} className="animate-spin" /> Verificando…
              </>
            ) : cooldown.secondsLeft > 0 ? (
              <>
                Reenviar em <span className="tnum font-semibold text-foreground">{cooldown.formatTime(cooldown.secondsLeft)}</span>
              </>
            ) : (
              <>
                Não recebeu?{" "}
                <button type="button" onClick={handleResend} className="font-semibold text-brand underline-offset-4 hover:underline">
                  Reenviar código
                </button>
              </>
            )}
          </p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
