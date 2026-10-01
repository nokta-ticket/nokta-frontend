"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowRight,
  ChartLine,
  Check,
  Compass,
  MoreHorizontal,
  RotateCw,
  Search,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AssistantProviderKey } from "@/services/assistant";
import { useAssistant, type AssistantEntry } from "./assistant-context";

/**
 * Assistente Nokta — interface de comando da Nokta pela IA do próprio usuário.
 *
 * Dois estados, sempre a partir do backend (nada simulado):
 * 1. Sem IA no workspace: apresenta o que dá para fazer e leva o proprietário/
 *    gerente para Configurações → IA e conexões (onde a chave é conectada);
 *    os demais membros são orientados a pedir ao administrador.
 * 2. Conectado: conversa operacional — cada resposta mostra o que foi consultado
 *    e as telas abertas; "Me leve para Eventos" navega de verdade.
 *
 * Consultar, analisar e navegar funcionam; "Executar" (criar/editar/excluir)
 * ainda não tem ferramenta no backend e aparece como "Em breve".
 */

const PROVIDER_LABEL: Record<AssistantProviderKey, string> = { ANTHROPIC: "Claude", OPENAI: "ChatGPT" };

const CAPABILITIES: { icon: LucideIcon; title: string; example: string; soon?: boolean }[] = [
  { icon: Search, title: "Consultar", example: "Quais produtos estão em falta?" },
  { icon: ChartLine, title: "Analisar", example: "Quanto vendemos nos últimos 7 dias?" },
  { icon: Compass, title: "Navegar", example: "Me leve até a tela de Eventos." },
  { icon: Zap, title: "Executar", example: "Criar uma reserva para amanhã às 20h.", soon: true },
];

const PRESSABLE =
  "transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600";

/* ---------------------------------- Cabeçalho --------------------------------- */

function AssistantHeader() {
  const { status, newConversation, entries } = useAssistant();
  const connection = status?.connection ?? null;

  return (
    <div className="flex items-center gap-2.5 border-b border-[#ebe8f2] px-5 py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-100 text-violet-600" aria-hidden="true">
        <Sparkles size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-gray-900">Assistente Nokta</p>
        <p className="truncate text-xs text-black/55">
          {connection ? `Conectado ao ${PROVIDER_LABEL[connection.provider]}` : "Consulte e controle sua operação usando IA"}
        </p>
      </div>
      {connection ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Opções do Assistente"
              className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-black/50 hover:bg-black/[0.05] hover:text-black/80", PRESSABLE)}
            >
              <MoreHorizontal size={18} strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled={entries.length === 0} onSelect={() => newConversation()}>
              Nova conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/* --------------------------------- Desconectado -------------------------------- */

function AssistantSetup() {
  const { status, notifyNavigated } = useAssistant();
  const canManage = !!status?.canManage;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
      <h3 className="text-[17px] font-semibold text-gray-900">Converse com a Nokta</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-black/60">
        Pergunte em linguagem natural sobre vendas, estoque, reservas e financeiro, ou peça para abrir uma tela.
      </p>

      <ul className="mt-6 flex flex-col gap-3.5">
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
              <p className={cn("flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wide", soon ? "text-black/45" : "text-black/60")}>
                {title}
                {soon ? <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10.5px] normal-case tracking-normal text-black/55">Em breve</span> : null}
              </p>
              <p className={cn("mt-0.5 text-[13.5px]", soon ? "text-black/45" : "text-gray-900")}>“{example}”</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        {canManage ? (
          <>
            <Link
              href="/dashboard/configuracoes?tab=ia"
              onClick={notifyNavigated}
              className={cn("flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#1c1a24] text-[14px] font-semibold text-white hover:bg-black", PRESSABLE)}
            >
              Conectar uma IA
              <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
            <p className="pt-1 text-center text-xs text-black/50">Você conecta uma vez e a equipe toda usa, cada um com as próprias permissões.</p>
          </>
        ) : (
          <p className="rounded-[12px] bg-violet-50 px-3 py-2.5 text-[13px] leading-snug text-violet-900">
            O workspace ainda não conectou uma IA. Peça ao proprietário ou a um gerente para conectar em Configurações → IA e conexões.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Conectado ---------------------------------- */

function EntryView({ entry }: { entry: AssistantEntry }) {
  if (entry.role === "user") {
    return (
      <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-[14px] rounded-br-md bg-violet-600 px-3.5 py-2.5 text-[14px] leading-snug text-white">
        {entry.content}
      </div>
    );
  }
  const consulted = (entry.steps ?? []).filter((s) => s.tool !== "navegar");
  return (
    <div className="max-w-[94%] space-y-2">
      {consulted.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" aria-label="O que foi consultado">
          {consulted.map((s, i) => (
            <span
              key={`${s.tool}-${i}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium",
                s.ok ? "bg-black/[0.05] text-black/60" : "bg-[#fcf5f6] text-[#9b1c35]",
              )}
            >
              {s.ok ? <Check size={12} strokeWidth={2} /> : <TriangleAlert size={12} strokeWidth={1.8} />}
              {s.ok ? `Consultou ${s.label}` : `Falhou: ${s.label}`}
            </span>
          ))}
        </div>
      ) : null}
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-900">{entry.content}</p>
      {(entry.actions ?? []).map((a, i) => (
        <Link
          key={`${a.route}-${i}`}
          href={a.route}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[10px] border border-[#e6e2ef] bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-gray-900 hover:border-[#d9cdf6] hover:bg-[#faf8ff]",
            PRESSABLE,
          )}
        >
          <Compass size={14} strokeWidth={1.8} className="text-violet-600" />
          Abriu {a.label}
        </Link>
      ))}
    </div>
  );
}

function AssistantConversation() {
  const { entries, pending, error, send, retry, status } = useAssistant();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [entries.length, pending, error]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [text]);

  function submit(value = text) {
    if (!value.trim() || pending) return;
    send(value);
    setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  const needsReconnect = error?.code === "ASSISTANT_KEY_INVALID" || error?.code === "ASSISTANT_NOT_CONNECTED";

  return (
    <>
      <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5" aria-live="polite">
        {entries.length === 0 ? (
          <div className="my-auto">
            <p className="text-[15px] font-semibold text-gray-900">O que você precisa agora?</p>
            <p className="mt-1 text-[13.5px] text-black/55">Pergunte sobre a operação ou peça para abrir uma tela.</p>
            <div className="mt-4 flex flex-col gap-1.5">
              {CAPABILITIES.filter((c) => !c.soon).map((c) => (
                <button
                  key={c.title}
                  type="button"
                  onClick={() => submit(c.example)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[12px] border border-[#ebe8f2] bg-white px-3 py-2.5 text-left text-[13.5px] text-gray-900 hover:border-[#d9cdf6] hover:bg-[#faf8ff]",
                    PRESSABLE,
                  )}
                >
                  <c.icon size={15} strokeWidth={1.8} className="shrink-0 text-violet-600" />
                  {c.example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          entries.map((e) => <EntryView key={e.id} entry={e} />)
        )}

        {pending ? (
          <div role="status" className="flex items-center gap-2 text-[13px] text-black/55">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
            </span>
            Consultando a Nokta…
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-[12px] border border-[#f0d7dc] bg-[#fcf5f6] px-3 py-2.5 text-[13px] text-[#9b1c35]">
            <p className="flex items-start gap-1.5">
              <TriangleAlert size={15} strokeWidth={1.8} className="mt-px shrink-0" />
              {error.message}
            </p>
            {!needsReconnect ? (
              <button type="button" onClick={retry} className={cn("mt-2 inline-flex items-center gap-1.5 font-semibold hover:underline", PRESSABLE)}>
                <RotateCw size={13} strokeWidth={2} />
                Tentar de novo
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#ebe8f2] p-3">
        <div className="flex items-end gap-2 rounded-[14px] border border-[#e2d6fb] bg-white py-1.5 pl-3 pr-1.5 focus-within:border-violet-500 focus-within:shadow-[0_0_0_3px_#f5f0ff]">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={4000}
            aria-label="Mensagem para o Assistente Nokta"
            placeholder="Pergunte ou peça para abrir uma tela…"
            className="max-h-[132px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-base leading-snug text-gray-900 outline-none placeholder:text-black/40 sm:text-[14px]"
          />
          <button
            type="button"
            onClick={() => submit()}
            disabled={pending || !text.trim()}
            aria-label="Enviar"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300",
              PRESSABLE,
            )}
          >
            <ArrowUp size={16} strokeWidth={2} />
          </button>
        </div>
        <p className="px-1 pt-2 text-center text-[11.5px] text-black/45">
          {status?.connection ? `Usando o ${PROVIDER_LABEL[status.connection.provider]} do workspace, com as suas permissões.` : null}
        </p>
      </div>
    </>
  );
}

/* ----------------------------------- Corpo ------------------------------------ */

function AssistantBody() {
  const { status, loadingStatus } = useAssistant();
  const connected = !!status?.connection;

  if (loadingStatus) {
    return (
      <div className="flex flex-1 flex-col gap-3 px-5 py-6" aria-busy="true">
        <div className="h-5 w-2/3 animate-pulse rounded bg-black/[0.06]" />
        <div className="h-4 w-full animate-pulse rounded bg-black/[0.05]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-black/[0.05]" />
      </div>
    );
  }
  if (connected) return <AssistantConversation />;
  return <AssistantSetup />;
}

/** Painel fixo (Início em telas largas). */
export function AssistantDockedPanel({ className }: { className?: string }) {
  return (
    <aside aria-label="Assistente Nokta" className={cn("flex flex-col overflow-hidden rounded-[20px] border border-[#ebe8f2] bg-[#fbfaff]", className)}>
      <AssistantHeader />
      <AssistantBody />
    </aside>
  );
}

/** Painel lateral aberto pelo "Pergunte à IA" do topo, em qualquer tela do dashboard. */
export function AssistantSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { setNavigateListener } = useAssistant();

  // Depois que a IA abre uma tela, o painel lateral sai da frente para a tela aparecer.
  useEffect(() => {
    if (!open) return;
    setNavigateListener(() => onOpenChange(false));
    return () => setNavigateListener(null);
  }, [open, onOpenChange, setNavigateListener]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 bg-[#fbfaff] p-0 data-[state=closed]:duration-200 data-[state=open]:duration-300 sm:max-w-[420px] [&>button:last-child]:hidden"
      >
        <SheetTitle className="sr-only">Assistente Nokta</SheetTitle>
        <SheetDescription className="sr-only">Consulte e controle sua operação usando IA.</SheetDescription>
        <div className="relative flex h-full flex-col">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
            className={cn("absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-black/45 hover:bg-black/[0.05] hover:text-black/80", PRESSABLE)}
          >
            <X size={17} strokeWidth={1.8} />
          </button>
          <div className="flex min-h-0 flex-1 flex-col pr-0 [&>div:first-child]:pr-12">
            <AssistantHeader />
            <AssistantBody />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
