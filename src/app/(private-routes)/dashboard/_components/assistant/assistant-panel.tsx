"use client";

import { useState } from "react";
import { ChartLine, Compass, MessageCircle, Search, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Assistente Nokta — interface de comando da Nokta via IA do próprio usuário
 * (Claude ou ChatGPT), não um chatbot: consultar, analisar, navegar e, mais
 * adiante, executar ações.
 *
 * A conexão ainda não existe (depende do servidor MCP da Nokta — ver
 * PENDENCIAS_FUTURAS.md), então os botões de conectar só avisam que ela está
 * sendo liberada; nada de fluxo simulado. Quando a conexão existir, este
 * painel ganha o estado de conversa.
 */

type Provider = "claude" | "chatgpt";

const PROVIDER_LABEL: Record<Provider, string> = { claude: "Claude", chatgpt: "ChatGPT" };

const CAPABILITIES: { icon: LucideIcon; title: string; example: string; soon?: boolean }[] = [
  { icon: Search, title: "Consultar", example: "“Quais produtos estão em falta?”" },
  { icon: ChartLine, title: "Analisar", example: "“Quanto vendemos nos últimos 7 dias?”" },
  { icon: Compass, title: "Navegar", example: "“Me leve até a tela de Eventos.”" },
  { icon: Zap, title: "Executar", example: "“Crie uma reserva para amanhã às 20h.”", soon: true },
];

const PRESSABLE =
  "transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600";

function AssistantHeader() {
  return (
    <div className="flex items-center gap-2.5 border-b border-[#ebe8f2] px-5 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-violet-100 text-violet-600" aria-hidden="true">
        <Sparkles size={16} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[15px] font-semibold text-gray-900">Assistente Nokta</p>
        <p className="text-xs text-black/55">Consulte e controle sua operação usando IA</p>
      </div>
    </div>
  );
}

function AssistantSetup() {
  const [requested, setRequested] = useState<Provider | null>(null);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
      <h3 className="text-[17px] font-semibold text-gray-900">Conecte sua IA à Nokta</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-black/60">
        Use o Claude ou o ChatGPT para interagir com a sua operação em linguagem natural: consultar dados e navegar pela Nokta.
      </p>

      <p className="mt-6 text-[13px] font-semibold text-black/70">O que você poderá fazer</p>
      <ul className="mt-3 flex flex-col gap-3">
        {CAPABILITIES.map(({ icon: Icon, title, example, soon }) => (
          <li key={title} className="flex gap-3">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white shadow-[inset_0_0_0_1px_#ebe8f2]",
                soon ? "text-black/35" : "text-violet-600",
              )}
              aria-hidden="true"
            >
              <Icon size={16} strokeWidth={1.8} />
            </span>
            <div>
              <p className={cn("flex items-center gap-2 text-[14px] font-medium", soon ? "text-black/60" : "text-gray-900")}>
                {title}
                {soon ? <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-black/55">Em breve</span> : null}
              </p>
              <p className={cn("text-[13px]", soon ? "text-black/45" : "text-black/55")}>{example}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <button
          type="button"
          onClick={() => setRequested("claude")}
          className={cn("flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#1c1a24] text-[14px] font-semibold text-white hover:bg-black", PRESSABLE)}
        >
          <Sparkles size={16} strokeWidth={1.8} />
          Conectar Claude
        </button>
        <button
          type="button"
          onClick={() => setRequested("chatgpt")}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-[12px] border border-[#e6e2ef] bg-white text-[14px] font-semibold text-gray-900 hover:border-[#d9cdf6] hover:bg-[#faf8ff]",
            PRESSABLE,
          )}
        >
          <MessageCircle size={16} strokeWidth={1.8} />
          Conectar ChatGPT
        </button>
        {requested ? (
          <p role="status" className="rounded-[12px] bg-violet-50 px-3 py-2.5 text-[13px] leading-snug text-violet-900">
            A conexão com o {PROVIDER_LABEL[requested]} está sendo liberada. Assim que estiver disponível, este botão passa a funcionar.
          </p>
        ) : (
          <p className="pt-1 text-center text-xs text-black/50">A IA acessa só o que o seu usuário pode ver na Nokta.</p>
        )}
      </div>
    </div>
  );
}

/** Painel fixo (Início em telas largas). */
export function AssistantDockedPanel({ className }: { className?: string }) {
  return (
    <aside aria-label="Assistente Nokta" className={cn("flex flex-col overflow-hidden rounded-[20px] border border-[#ebe8f2] bg-[#fbfaff]", className)}>
      <AssistantHeader />
      <AssistantSetup />
    </aside>
  );
}

/** Painel lateral aberto pelo "Pergunte à IA" do topo, em qualquer tela do dashboard. */
export function AssistantSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 bg-[#fbfaff] p-0 data-[state=closed]:duration-200 data-[state=open]:duration-300 sm:max-w-[400px]"
      >
        <SheetTitle className="sr-only">Assistente Nokta</SheetTitle>
        <SheetDescription className="sr-only">Conecte sua IA à Nokta para consultar e controlar sua operação.</SheetDescription>
        <AssistantHeader />
        <AssistantSetup />
      </SheetContent>
    </Sheet>
  );
}
