"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Aviso de que a Nokta funciona dentro do Claude (conector MCP, configurado em
 * Configurações → IA e conexões). Não existe chat dentro da Nokta: a conversa
 * acontece no Claude do usuário, usando a assinatura dele.
 *
 * Dispensável e lembrado por navegador (conveniência local, nada crítico). Não
 * renderiza até ler essa preferência, para nunca piscar para quem já fechou.
 */

const DISMISS_KEY = "nokta:claude-connector-notice:dismissed";

const PRESSABLE =
  "transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600";

export function ClaudeConnectorNotice({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Sem armazenamento (aba anônima etc.): o aviso só some nesta visita.
    }
  }

  return (
    <aside
      aria-label="Nokta no Claude"
      className={cn(
        "flex flex-col gap-3 rounded-[14px] border border-[#e6dcfa] bg-[#faf7ff] py-3 pl-3 pr-2 sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-100 text-violet-600" aria-hidden="true">
          <Sparkles size={16} strokeWidth={1.8} />
        </span>
        <p className="min-w-0 text-[13.5px] leading-snug text-black/65">
          <span className="font-semibold text-gray-900">A Nokta funciona dentro do Claude.</span>{" "}
          Pergunte quanto vendeu, o que está acabando no estoque ou peça para criar uma reserva, direto na conversa.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 pl-11 sm:pl-0">
        <Link
          href="/dashboard/configuracoes?tab=ia"
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-[10px] bg-[#1c1a24] px-3 text-[13px] font-semibold text-white hover:bg-black",
            PRESSABLE,
          )}
        >
          Conectar ao Claude
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar aviso"
          className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] text-black/45 hover:bg-black/[0.05] hover:text-black/75", PRESSABLE)}
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
