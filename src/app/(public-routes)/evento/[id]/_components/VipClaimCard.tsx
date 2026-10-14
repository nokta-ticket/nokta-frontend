"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/auth/login-modal";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { CpfGate } from "../checkout/_components/cpf-gate";

// Lista VIP dentro da página do evento. Só aparece para quem chegou pelo
// link do produtor (`/vip/nome-do-evento`): o lote não existe na lista
// pública de ingressos.

type VipStatus = "ABERTA" | "ENCERRADA" | "ESGOTADA" | "INDISPONIVEL";

interface VipList {
  token: string;
  nome: string | null;
  ate: string | null;
  status: VipStatus;
}

interface VipListResponse {
  evento: { id: number };
  listas: VipList[];
}

const CLOSED_MESSAGE: Record<Exclude<VipStatus, "ABERTA">, string> = {
  ENCERRADA: "Prazo encerrado",
  ESGOTADA: "Esgotado",
  INDISPONIVEL: "Indisponível no momento",
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
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "CPF_REQUIRED") setPending({ token, step: "cpf" });
      else toast.error(getErrorMessage(err, "Não foi possível retirar o VIP. Tente de novo."));
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
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Lista VIP</p>

      <div className="mt-3 flex flex-col gap-3">
        {lists.map((lista) => {
          const result = results[lista.token];
          const open = lista.status === "ABERTA";
          return (
            <div
              key={lista.token}
              className={
                "flex items-center gap-4 rounded-xl border px-4 py-3.5 " +
                (result
                  ? "border-emerald-200 bg-emerald-50/60"
                  : open
                    ? "border-[#9944CC]/40 bg-violet-50/40"
                    : "border-gray-200 bg-white")
              }
            >
              {result ? (
                <>
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#0F172A]">
                      {result === "claimed" ? "Seu VIP está garantido" : "Você já retirou este VIP"}
                    </p>
                    <p className="text-[12px] text-gray-600">O QR code está em Meus ingressos.</p>
                  </div>
                  <Link
                    href="/meus-ingressos"
                    className="shrink-0 rounded-lg bg-[#0F172A] px-3.5 py-2.5 text-[13px] font-bold text-white"
                  >
                    Ver ingresso
                  </Link>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[13px] font-bold uppercase leading-snug text-[#0F172A]">
                      {lista.nome || "Lista VIP"}
                    </p>
                    <p className="text-[13px] font-bold text-[#9944CC]">Gratuito</p>
                    {open ? (
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Um por pessoa{lista.ate ? ` · retire até ${formatDeadline(lista.ate)}` : ""}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] font-semibold text-red-600">
                        {CLOSED_MESSAGE[lista.status as Exclude<VipStatus, "ABERTA">]}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClick(lista.token)}
                    disabled={!open || claimingToken !== null}
                    className="h-11 shrink-0 rounded-lg bg-gradient-to-r from-[#9944CC] to-[#3399FF] px-4 text-[13px] font-bold text-white transition disabled:opacity-40"
                  >
                    {claimingToken === lista.token ? "Retirando…" : lista.status === "ESGOTADA" ? "Esgotado" : "Pegar VIP"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

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
