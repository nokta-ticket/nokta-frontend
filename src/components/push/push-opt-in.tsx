"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import { enablePush, pushPermission, pushSupport } from "@/lib/push";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const DISMISS_KEY = "nk_push_optin_dismissed_at";
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < DISMISS_FOR_MS;
  } catch {
    return false;
  }
}

/**
 * Convite para ativar as notificações. Só aparece para quem está logado, num
 * aparelho que suporta push, e ainda não respondeu ao pedido do navegador.
 * O pedido de permissão só sai do toque em "Ativar" (o navegador bloqueia
 * pedido sem gesto, e pedir ao abrir a página irrita).
 */
export function PushOptIn({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVisible(isAuthenticated && pushSupport() === "supported" && pushPermission() === "default" && !dismissedRecently());
  }, [isAuthenticated]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* sem armazenamento: volta a aparecer na próxima visita */
    }
    setVisible(false);
  };

  const activate = async () => {
    setBusy(true);
    try {
      const result = await enablePush({ ask: true });
      if (result === "enabled") toast.success("Notificações ativadas neste celular.");
      else if (result === "denied") toast.info("Notificações bloqueadas. Dá para liberar depois nas configurações do celular.");
      else toast.error("Não deu para ativar as notificações agora.");
      setVisible(false);
    } catch {
      toast.error("Não deu para ativar as notificações agora.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex items-start gap-3 rounded-card border border-border bg-surface-2 p-4", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon name="bell" size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Saiba na hora quando seu ingresso for liberado</p>
        <p className="mt-0.5 text-caption text-muted-foreground">Ative as notificações para receber o aviso do QR, o lembrete no dia do evento e novidades dos produtores dos seus eventos.</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" shape="pill" loading={busy} onClick={activate}>
            Ativar notificações
          </Button>
          <Button size="sm" shape="pill" variant="ghost" onClick={dismiss} disabled={busy}>
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}
