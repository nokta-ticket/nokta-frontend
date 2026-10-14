"use client";

import { useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { UserPayload } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";

const CODE_LENGTH = 6;
const BACKUP_LENGTH = 8;

interface Props {
  open: boolean;
  twoFactorToken: string;
  onClose: () => void;
  onSuccess: (user: UserPayload) => void;
}

/**
 * Segunda etapa do login administrativo: código do app autenticador (6
 * dígitos) ou um código de recuperação (8 caracteres alfanuméricos).
 */
export function TotpVerifyModal({ open, twoFactorToken, onClose, onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (open) {
      setCode("");
      setUseBackup(false);
      setInvalid(false);
    }
  }, [open]);

  const required = useBackup ? BACKUP_LENGTH : CODE_LENGTH;

  const verify = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setInvalid(false);
    try {
      const res = await api.post("/auth/totp/verify", { twoFactorToken, code: trimmed });
      onSuccess(res.data.user);
    } catch (err) {
      toast.error(getErrorMessage(err, "Código inválido"));
      setInvalid(true);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void verify(code);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="shield" size={16} className="text-brand" />
              Verificação em duas etapas
            </DialogTitle>
            <DialogDescription>{useBackup ? "Insira um dos códigos de recuperação." : "Insira o código do seu app autenticador."}</DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-4">
            {useBackup ? (
              <Input
                autoFocus
                inputMode="text"
                autoComplete="one-time-code"
                maxLength={BACKUP_LENGTH}
                placeholder="XXXXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                aria-invalid={invalid || undefined}
                className="text-center font-mono text-lg tracking-[0.3em] md:text-lg"
              />
            ) : (
              <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={loading} invalid={invalid} autoFocus />
            )}
            <button
              type="button"
              onClick={() => {
                setUseBackup((p) => !p);
                setCode("");
                setInvalid(false);
              }}
              className="text-center text-caption font-medium text-brand underline-offset-4 hover:underline"
            >
              {useBackup ? "Usar código do app" : "Usar código de recuperação"}
            </button>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} disabled={code.length < required}>
              {loading ? "Verificando…" : "Verificar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
