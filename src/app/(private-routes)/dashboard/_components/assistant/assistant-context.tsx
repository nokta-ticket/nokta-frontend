"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/context/OrganizationContext";
import {
  assistantApi,
  type AssistantConnectionStatus,
  type AssistantNavigateAction,
  type AssistantStep,
} from "@/services/assistant";

/**
 * Estado do Assistente Nokta, compartilhado entre o painel fixo da Início e o
 * painel lateral aberto pelo "Pergunte à IA" — a mesma conversa nos dois.
 *
 * Nada aqui simula a IA: toda resposta vem de POST .../assistant/turn, que
 * chama a IA conectada pelo workspace (Configurações → IA e conexões) com as
 * ferramentas que as permissões de quem pergunta liberam. A conversa vive só na memória da aba (some ao recarregar) e é
 * zerada ao trocar de organização.
 */

export interface AssistantEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AssistantStep[];
  actions?: AssistantNavigateAction[];
}

export interface AssistantTurnError {
  code: string | null;
  message: string;
}

interface AssistantContextValue {
  status: AssistantConnectionStatus | undefined;
  loadingStatus: boolean;
  entries: AssistantEntry[];
  pending: boolean;
  error: AssistantTurnError | null;
  send: (text: string) => void;
  retry: () => void;
  newConversation: () => void;
  /** Chamado depois de cada navegação (pela IA ou por um link do painel): o painel lateral se fecha. */
  setNavigateListener: (fn: (() => void) | null) => void;
  notifyNavigated: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

/** Prefixo invalidado também por Configurações → IA e conexões ao conectar/desconectar. */
export const ASSISTANT_STATUS_KEY = ["assistant", "connection"] as const;

function readError(error: unknown): AssistantTurnError {
  if (isAxiosError(error)) {
    const data = error.response?.data as { code?: string; message?: string | string[] } | undefined;
    const message = Array.isArray(data?.message) ? data?.message[0] : data?.message;
    if (error.response?.status === 429 && !data?.code) {
      return { code: "RATE_LIMITED", message: "Muitas mensagens em pouco tempo. Aguarde um instante." };
    }
    return { code: data?.code ?? null, message: message || "Não foi possível falar com o Assistente agora." };
  }
  return { code: null, message: "Não foi possível falar com o Assistente agora." };
}

let entrySeq = 0;
const nextId = () => `a${++entrySeq}`;

export function AssistantProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganizations();
  const orgId = currentOrg?.id ?? null;
  const [entries, setEntries] = useState<AssistantEntry[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AssistantTurnError | null>(null);
  const navigateListener = useRef<(() => void) | null>(null);
  const turnSeq = useRef(0);

  const statusQuery = useQuery({
    queryKey: [...ASSISTANT_STATUS_KEY, orgId],
    queryFn: () => assistantApi.getConnection(orgId as number),
    enabled: orgId !== null,
    staleTime: 5 * 60_000,
  });

  // Conversa pertence à organização: trocar de organização começa do zero.
  useEffect(() => {
    turnSeq.current++;
    setEntries([]);
    setError(null);
    setPending(false);
  }, [orgId]);

  const runTurn = useCallback(
    async (history: AssistantEntry[]) => {
      if (orgId === null) return;
      const seq = ++turnSeq.current;
      setPending(true);
      setError(null);
      try {
        const res = await assistantApi.turn(
          orgId,
          history.map(({ role, content }) => ({ role, content })),
        );
        if (seq !== turnSeq.current) return;
        setEntries((prev) => [...prev, { id: nextId(), role: "assistant", content: res.reply, steps: res.steps, actions: res.actions }]);
        const navigate = res.actions.find((a) => a.type === "navigate");
        if (navigate) {
          router.push(navigate.route);
          navigateListener.current?.();
        }
      } catch (err) {
        if (seq !== turnSeq.current) return;
        const parsed = readError(err);
        setError(parsed);
        // Chave revogada/conta desconectada: atualiza o estado para o painel voltar ao passo de conectar.
        if (parsed.code === "ASSISTANT_KEY_INVALID" || parsed.code === "ASSISTANT_NOT_CONNECTED") {
          queryClient.invalidateQueries({ queryKey: ASSISTANT_STATUS_KEY });
        }
      } finally {
        if (seq === turnSeq.current) setPending(false);
      }
    },
    [orgId, router, queryClient],
  );

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || pending) return;
      const next = [...entries, { id: nextId(), role: "user" as const, content }];
      setEntries(next);
      void runTurn(next);
    },
    [entries, pending, runTurn],
  );

  const retry = useCallback(() => {
    if (pending || entries.length === 0 || entries[entries.length - 1].role !== "user") return;
    void runTurn(entries);
  }, [entries, pending, runTurn]);

  const newConversation = useCallback(() => {
    turnSeq.current++;
    setEntries([]);
    setError(null);
    setPending(false);
  }, []);

  const value = useMemo<AssistantContextValue>(
    () => ({
      status: statusQuery.data,
      loadingStatus: statusQuery.isLoading,
      entries,
      pending,
      error,
      send,
      retry,
      newConversation,
      setNavigateListener: (fn) => {
        navigateListener.current = fn;
      },
      notifyNavigated: () => navigateListener.current?.(),
    }),
    [statusQuery.data, statusQuery.isLoading, entries, pending, error, send, retry, newConversation],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant deve ser usado dentro de AssistantProvider");
  return ctx;
}
