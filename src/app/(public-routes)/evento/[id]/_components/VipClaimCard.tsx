"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/auth/login-modal";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { getPublicTicketsUrl } from "@/lib/surfaces";
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

// Mesma curva de saída em tudo que responde ao toque.
const PRESS = "transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]";

export function VipClaimCard({
  vipKey,
  eventId,
  eventName,
  returnPath,
  onActiveChange,
}: {
  /** Endereço do evento (ou o código de uma lista, nos primeiros links). */
  vipKey: string;
  eventId: number;
  eventName: string;
  /** Caminho deste link (/vip/<evento>): destino do cadastro e do "Convidar amigos". */
  returnPath: string;
  /** true enquanto há lista aberta ou nome já colocado: a página esconde os ingressos pagos. */
  onActiveChange?: (active: boolean) => void;
}) {
  const { isAuthenticated, user } = useAuth();
  const [lists, setLists] = useState<VipList[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [claimingToken, setClaimingToken] = useState<string | null>(null);
  /** Lista em que a pessoa tocou e ficou esperando login ou CPF. */
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

  // Enquanto o link carrega conta como ativo, para os ingressos pagos não
  // piscarem na tela antes de sumir.
  const active = !loaded || lists.some((l) => l.status === "ABERTA" || results[l.token]);
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // Quem chegou pelo link veio pela lista: a página rola até ela.
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

  const invite = async () => {
    const url = getPublicTicketsUrl(returnPath);
    try {
      if (navigator.share) await navigator.share({ title: `Lista VIP · ${eventName}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {
      // Fechar a folha de compartilhamento não é erro.
    }
  };

  return (
    <div ref={cardRef} id="vip" className="scroll-mt-24 space-y-8">
      {lists.map((lista) => {
        const result = results[lista.token];
        const open = lista.status === "ABERTA";
        const claiming = claimingToken === lista.token;
        return (
          <section key={lista.token} aria-label={lista.nome || "Lista VIP"}>
            <p className="text-[13px] leading-relaxed text-gray-600">
              Entrada gratuita, um nome por pessoa.
              {open && lista.ate ? ` Aberta até ${formatDeadline(lista.ate)}.` : ""}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2.5 text-[13px] text-gray-600">
                <span className="rounded-full bg-[#0F172A] px-3 py-1.5 text-[14px] font-bold tabular-nums text-white">
                  {lista.naLista}/{lista.total}
                </span>
                nomes na lista
              </p>
              <button
                type="button"
                onClick={invite}
                className={cn(
                  "-mr-2 flex h-11 items-center gap-2 rounded-full px-2 text-[13px] font-semibold text-[#0F172A]",
                  PRESS,
                )}
              >
                Convidar amigos
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white">
                  <UserPlus size={16} />
                </span>
              </button>
            </div>

            {result ? (
              <div className="vip-confirm mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check size={18} strokeWidth={3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-[#0F172A]">
                    {result === "claimed" ? "Seu nome está na lista" : "Seu nome já estava na lista"}
                  </p>
                  <p className="text-[12px] text-emerald-900/80">O ingresso com QR code está na sua conta.</p>
                </div>
                <Link
                  href="/meus-ingressos"
                  className={cn("shrink-0 rounded-xl bg-[#0F172A] px-3.5 py-2.5 text-[13px] font-bold text-white", PRESS)}
                >
                  Ver ingresso
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleClick(lista.token)}
                disabled={!open || claimingToken !== null}
                className={cn(
                  "mt-4 h-[52px] w-full rounded-2xl text-[15px] font-bold",
                  open
                    ? "bg-gradient-to-r from-[#9944CC] to-[#3399FF] text-white shadow-lg shadow-violet-900/15"
                    : "bg-gray-200 text-gray-600",
                  open && PRESS,
                  claiming && "opacity-80",
                )}
              >
                {claiming ? "Colocando seu nome…" : open ? "Colocar nome na lista" : CLOSED_LABEL[lista.status as Exclude<VipStatus, "ABERTA">]}
              </button>
            )}
          </section>
        );
      })}

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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
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
