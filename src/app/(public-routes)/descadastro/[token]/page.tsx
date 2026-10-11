"use client";

import { use, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { crmMarketingApi } from "@/services/crm-marketing";

type State = { phase: "loading" } | { phase: "invalid" } | { phase: "ready" | "done"; organizationName: string; channel: "EMAIL" | "WHATSAPP" };

/**
 * Página que o cliente de um produtor abre ao clicar em "não quero mais
 * receber". Sem login e sem marca de produto no caminho: mostra quem enviou
 * e resolve em um toque. Cobre o site inteiro (mesmo padrão das outras
 * telas públicas de tela cheia) para o cabeçalho da bilheteria não aparecer.
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
    <main className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#f4f2f8] px-4 py-10 font-sans text-[#1c1a24]">
      <div className="w-full max-w-[460px] rounded-[20px] border border-[#ebe8f2] bg-white p-7 sm:p-9">
        {state.phase === "loading" ? (
          <p className="flex items-center gap-2 text-[15px] text-[#5f5c6b]">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            Carregando
          </p>
        ) : state.phase === "invalid" ? (
          <>
            <h1 className="text-[22px] font-semibold leading-tight">Este link não é válido</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5f5c6b]">Ele pode ter sido copiado pela metade. Abra de novo a mensagem que você recebeu e toque no link para sair da lista.</p>
          </>
        ) : state.phase === "ready" ? (
          <>
            <h1 className="text-[22px] font-semibold leading-tight">Parar de receber {channel} de {state.organizationName}?</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5f5c6b]">
              Você deixa de receber divulgação de {state.organizationName}. Avisos sobre ingressos que você comprou continuam chegando normalmente.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void confirm()}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#1c1a24] px-5 text-[15px] font-semibold text-white outline-none transition-transform duration-150 ease-out hover:bg-[#2b2838] focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
              Não quero mais receber
            </button>
          </>
        ) : (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Check size={22} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-[22px] font-semibold leading-tight">Pronto, você saiu da lista</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5f5c6b]">
              {state.organizationName} não envia mais {channel} de divulgação para você. Pode fechar esta página.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
