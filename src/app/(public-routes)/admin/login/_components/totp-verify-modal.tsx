"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CODE_LENGTH = 6;

interface Props {
  open: boolean;
  twoFactorToken: string;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function TotpVerifyModal({ open, twoFactorToken, onClose, onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCode("");
      setUseBackup(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/totp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken, code: code.trim() }),
        // Fase 5: sessão é cookie HttpOnly.
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(" ")
          : data.message || "Código inválido";
        throw new Error(msg);
      }

      onSuccess(data.user);
    } catch (err: any) {
      toast.error(err.message || "Erro na verificação 2FA");
      setCode("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[360px] bg-[#1C1D21] border-white/10 text-white">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/20">
            <ShieldCheck className="h-6 w-6 text-violet-400" />
          </div>
          <DialogTitle className="text-white">Verificação 2FA</DialogTitle>
          <DialogDescription className="text-white/50">
            {useBackup
              ? "Insira um dos códigos de recuperação"
              : "Insira o código do seu app autenticador"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 pt-2">
          <input
            ref={inputRef}
            type="text"
            inputMode={useBackup ? "text" : "numeric"}
            autoComplete="one-time-code"
            maxLength={useBackup ? 8 : CODE_LENGTH}
            placeholder={useBackup ? "XXXXXXXX" : "000000"}
            value={code}
            onChange={(e) => {
              const val = useBackup
                ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                : e.target.value.replace(/\D/g, "");
              setCode(val);
            }}
            className="h-12 w-full rounded-xl border border-white/10 bg-white/5 text-center text-lg font-mono tracking-[0.3em] text-white placeholder:text-white/20 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
          />

          <button
            type="submit"
            disabled={loading || code.length < (useBackup ? 8 : CODE_LENGTH)}
            className="h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verificando…
              </span>
            ) : (
              "Verificar"
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setUseBackup((p) => !p);
            setCode("");
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="mt-1 w-full text-center text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          {useBackup ? "Usar código do app" : "Usar código de recuperação"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
