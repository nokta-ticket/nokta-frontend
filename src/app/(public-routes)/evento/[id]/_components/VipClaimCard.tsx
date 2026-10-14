"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/auth/login-modal";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { CpfGate } from "../checkout/_components/cpf-gate";

// Lista VIP dentro da página do evento. Só aparece para quem chegou pelo
// link do produtor (`/vip/nome-do-evento`): a lista não existe entre os
// ingressos à venda. Quem coloca o nome recebe o ingresso com QR na conta.

type VipStatus = "ABERTA" | "ENCERRADA" | "ESGOTADA" | "INDISPONIVEL";

interface VipList {
  token: string;
  nome: string | null;
  ate: string | null;
  status: VipStatus;
  naLista: number;
  total: number;
}

interface VipListResponse {
  evento: { id: number };
  listas: VipList[];
}

const STATUS_META: Record<VipStatus, { label: string; tone: Tone }> = {
  ABERTA: { label: "Aberta", tone: "success" },
  ENCERRADA: { label: "Encerrada", tone: "neutral" },
  ESGOTADA: { label: "Esgotada", tone: "danger" },
  INDISPONIVEL: { label: "Indisponível", tone: "warning" },
};

const CLOSED_MESSAGE: Record<Exclude<VipStatus, "ABERTA">, string> = {
  ENCERRADA: "O prazo pra colocar o nome acabou.",
  ESGOTADA: "Todos os nomes da lista já foram preenchidos.",
  INDISPONIVEL: "Indisponível no momento.",
};

const CLOSED_LABEL: Record<Exclude<VipStatus, "ABERTA">, string> = {
  ENCERRADA: "Lista encerrada",
  ESGOTADA: "Lista esgotada",
  INDISPONIVEL: "Lista indisponível",
};

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const zone = "America/Sao_Paulo";
  const day = d.toLocaleDateString("pt-BR", { timeZone: zone, day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("pt-BR", { timeZone: zone, hour: "2-digit", minute: "2-digit" });
  return `${day} às ${time}`;
}

export function VipClaimCard({
  vipKey,
  eventId,
  returnPath,
  onActiveChange,
}: {
  /** Endereço do evento (ou o código de uma lista, nos primeiros links). */
  vipKey: string;
  eventId: number;
  /** Para onde o cadastro devolve a pessoa. */
  returnPath: string;
  /** true enquanto há VIP para retirar ou já retirado: a página esconde os lotes pagos. */
  onActiveChange?: (active: boolean) => void;
}) {
  const { isAuthenticated, user } = useAuth();
  const [lists, setLists] = useState<VipList[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [claimingToken, setClaimingToken] = useState<string | null>(null);
  /** Lista que a pessoa tentou retirar e ficou esperando login ou CPF. */
  const [pending, setPending] = useState<{ token: string; step: "login" | "cpf" } | null>(null);
  const [results, setResults] = useState<Record<string, "claimed" | "already">>({});
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api
      .get<VipListResponse>(`/lista-vip/${encodeURIComponent(vipKey)}`)
      .then((res) => {
        // Link de outro evento não mostra nada aqui.
        if (active && res.data.evento.id === eventId) setLists(res.data.listas ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [vipKey, eventId]);

  // Enquanto o link carrega conta como ativo, para os lotes pagos não
  // piscarem na tela antes de sumir.
  const active = !loaded || lists.some((l) => l.status === "ABERTA" || results[l.token]);
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // Quem chegou pelo link veio buscar o VIP: a página rola até ele.
  useEffect(() => {
    if (lists.length > 0) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [lists.length]);

  const claim = useCallback(async (token: string) => {
    setClaimingToken(token);
    try {
      const res = await api.post<{ claimed: boolean; alreadyClaimed: boolean }>(`/lista-vip/${token}/retirar`);
      setResults((prev) => ({ ...prev, [token]: res.data.alreadyClaimed ? "already" : "claimed" }));
      if (res.data.claimed) {
        setLists((prev) => prev.map((l) => (l.token === token ? { ...l, naLista: l.naLista + 1 } : l)));
      }
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "CPF_REQUIRED") setPending({ token, step: "cpf" });
      else toast.error(getErrorMessage(err, "Não foi possível colocar seu nome na lista. Tente de novo."));
    } finally {
      setClaimingToken(null);
    }
  }, []);

  if (lists.length === 0) return null;

  const handleClick = (token: string) => {
    if (!isAuthenticated) return setPending({ token, step: "login" });
    if (user && !user.cpf) return setPending({ token, step: "cpf" });
    claim(token);
  };

  return (
    <div ref={cardRef} id="vip" className="scroll-mt-24">
      <h2 className="mb-3 text-title font-semibold tracking-tight text-foreground lg:hidden">Lista VIP</h2>
      <Card accent className="overflow-hidden">
        <div className="hidden items-center justify-between px-5 pt-5 lg:flex">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Lista VIP</h2>
          <Icon name="crown" size={16} className="text-brand" />
        </div>

        <ul className="divide-y divide-border lg:mt-3 lg:border-t lg:border-border">
          {lists.map((lista) => {
            const result = results[lista.token];
            const open = lista.status === "ABERTA";
            const meta = STATUS_META[lista.status];
            return (
              <li key={lista.token} className="px-4 py-4 lg:px-5">
                {result ? (
                  <div className="vip-confirm flex items-center gap-3">
                    <Icon name="check-circle" size={22} className="shrink-0 text-success" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug text-foreground">{result === "claimed" ? "Seu nome está na lista" : "Seu nome já estava na lista"}</p>
                      <p className="mt-0.5 text-caption text-muted-foreground">O ingresso com QR code está na sua conta.</p>
                    </div>
                    <Button asChild variant="contrast" size="sm" shape="pill" className="shrink-0">
                      <Link href="/meus-ingressos">Ver ingresso</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-semibold leading-snug text-foreground">{lista.nome || "Lista VIP"}</p>
                        <StatusBadge tone={meta.tone} pulse={open}>
                          {meta.label}
                        </StatusBadge>
                      </div>
                      <p className="mt-1.5 flex items-center gap-2 text-caption text-muted-foreground">
                        <span className="rounded-full bg-foreground px-2.5 py-1 text-[13px] font-bold tabular-nums text-background">
                          {lista.naLista}/{lista.total}
                        </span>
                        nomes na lista · <span className="font-semibold text-brand">Gratuito</span>
                      </p>
                      <p className="mt-0.5 text-caption text-muted-foreground">{open ? `Um nome por pessoa${lista.ate ? ` · até ${formatDeadline(lista.ate)}` : ""}` : CLOSED_MESSAGE[lista.status as Exclude<VipStatus, "ABERTA">]}</p>
                    </div>
                    <Button shape="pill" onClick={() => handleClick(lista.token)} disabled={!open || claimingToken !== null} loading={claimingToken === lista.token} className="h-11 shrink-0 px-5">
                      {open ? "Colocar nome" : CLOSED_LABEL[lista.status as Exclude<VipStatus, "ABERTA">]}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {pending?.step === "login" && (
        <LoginModal
          registerHref={`/register?redirect=${encodeURIComponent(returnPath)}`}
          onClose={() => setPending(null)}
          onSuccess={() => {
            const { token } = pending;
            setPending(null);
            claim(token);
          }}
        />
      )}

      {pending?.step === "cpf" && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <CpfGate
            onComplete={(cpf) => {
              const { token } = pending;
              if (user) user.cpf = cpf;
              setPending(null);
              claim(token);
            }}
          />
        </div>
      )}
    </div>
  );
}
