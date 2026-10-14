"use client";

import { use, useEffect, useState } from "react";
import { crmMarketingApi } from "@/services/crm-marketing";
import { AuthShell } from "@/components/shell/auth-shell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";

type State = { phase: "loading" } | { phase: "invalid" } | { phase: "ready" | "done"; organizationName: string; channel: "EMAIL" | "WHATSAPP" };

/**
 * Página que o cliente de um produtor abre ao clicar em "não quero mais
 * receber". Sem login: mostra quem enviou e resolve em um toque, dentro da
 * moldura canônica de auth (card sobre fundo abstrato; X/Esc/fora → home).
 */
export default function DescadastroPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<State>({ phase: "loading" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    crmMarketingApi
      .unsubscribeInfo(token)
      .then((info) => active && setState({ phase: info.unsubscribed ? "done" : "ready", organizationName: info.organizationName, channel: info.channel }))
      .catch(() => active && setState({ phase: "invalid" }));
    return () => {
      active = false;
    };
  }, [token]);

  async function confirm() {
    if (state.phase !== "ready") return;
    setSaving(true);
    try {
      await crmMarketingApi.unsubscribe(token);
      setState({ ...state, phase: "done" });
    } catch {
      setState({ phase: "invalid" });
    } finally {
      setSaving(false);
    }
  }

  const channel = state.phase === "ready" || state.phase === "done" ? (state.channel === "EMAIL" ? "e-mails" : "mensagens de WhatsApp") : "";

  return (
    <AuthShell size="sm">
      {state.phase === "loading" ? (
        <div className="space-y-3">
          <div className="skeleton-shimmer h-7 w-3/4 rounded-md" />
          <div className="skeleton-shimmer h-4 w-full rounded-md" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded-md" />
          <div className="skeleton-shimmer mt-4 h-12 w-full rounded-input" />
        </div>
      ) : state.phase === "invalid" ? (
        <>
          <h1 className="text-title font-semibold tracking-tight text-foreground">Este link não é válido</h1>
          <p className="mt-3 text-body leading-relaxed text-muted-foreground">Ele pode ter sido copiado pela metade. Abra de novo a mensagem que você recebeu e toque no link para sair da lista.</p>
        </>
      ) : state.phase === "ready" ? (
        <>
          <h1 className="text-title font-semibold tracking-tight text-foreground">
            Parar de receber {channel} de {state.organizationName}?
          </h1>
          <p className="mt-3 text-body leading-relaxed text-muted-foreground">Você deixa de receber divulgação de {state.organizationName}. Avisos sobre ingressos que você comprou continuam chegando normalmente.</p>
          <Button size="full" variant="contrast" className="mt-6" loading={saving} onClick={() => void confirm()}>
            Não quero mais receber
          </Button>
        </>
      ) : (
        <>
          <span className="flex size-11 items-center justify-center rounded-full bg-success-bg text-success ring-1 ring-inset ring-success-ring">
            <Icon name="check" size={18} />
          </span>
          <h1 className="mt-4 text-title font-semibold tracking-tight text-foreground">Pronto, você saiu da lista</h1>
          <Callout tone="success" className="mt-4">
            {state.organizationName} não envia mais {channel} de divulgação para você. Pode fechar esta página.
          </Callout>
        </>
      )}
    </AuthShell>
  );
}
