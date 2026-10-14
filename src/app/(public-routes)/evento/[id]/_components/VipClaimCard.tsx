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
// link do produtor (`?vip=<token>`): o lote não existe na lista pública.

type VipStatus = "ABERTA" | "ENCERRADA" | "ESGOTADA" | "INDISPONIVEL";

interface VipListResponse {
  evento: { id: number };
  lista: { nome: string | null; ate: string | null; status: VipStatus };
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

export function VipClaimCard({ token, eventId, eventPath }: { token: string; eventId: number; eventPath: string }) {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState<VipListResponse | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [needsCpf, setNeedsCpf] = useState(false);
  const [result, setResult] = useState<"claimed" | "already" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api
      .get<VipListResponse>(`/lista-vip/${token}`)
      .then((res) => {
        // Link de outro evento não mostra nada aqui.
        if (active && res.data.evento.id === eventId) setData(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, eventId]);

  // Quem chegou pelo link veio buscar o VIP: a página rola até ele.
  useEffect(() => {
    if (data) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [data]);

  const claim = useCallback(async () => {
    setClaiming(true);
    try {
      const res = await api.post<{ claimed: boolean; alreadyClaimed: boolean }>(`/lista-vip/${token}/retirar`);
      setResult(res.data.alreadyClaimed ? "already" : "claimed");
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "CPF_REQUIRED") setNeedsCpf(true);
      else toast.error(getErrorMessage(err, "Não foi possível retirar o VIP. Tente de novo."));
    } finally {
      setClaiming(false);
    }
  }, [token]);

  if (!data) return null;

  const { lista } = data;
  const open = lista.status === "ABERTA";

  const handleClick = () => {
    if (!isAuthenticated) return setShowLogin(true);
    if (user && !user.cpf) return setNeedsCpf(true);
    claim();
  };

  return (
    <div ref={cardRef} id="vip" className="scroll-mt-24">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Lista VIP</p>

      <div
        className={
          "mt-3 flex items-center gap-4 rounded-xl border px-4 py-3.5 " +
          (result ? "border-emerald-200 bg-emerald-50/60" : "border-[#9944CC]/40 bg-violet-50/40")
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
              <p className="mt-0.5 text-[11px] text-gray-500">
                {open
                  ? `Um por pessoa${lista.ate ? ` · retire até ${formatDeadline(lista.ate)}` : ""}`
                  : CLOSED_MESSAGE[lista.status as Exclude<VipStatus, "ABERTA">]}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClick}
              disabled={!open || claiming}
              className="h-11 shrink-0 rounded-lg bg-gradient-to-r from-[#9944CC] to-[#3399FF] px-4 text-[13px] font-bold text-white transition disabled:opacity-40"
            >
              {claiming ? "Retirando…" : "Pegar VIP"}
            </button>
          </>
        )}
      </div>

      {showLogin && (
        <LoginModal
          registerHref={`/register?redirect=${encodeURIComponent(`${eventPath}?vip=${token}`)}`}
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            claim();
          }}
        />
      )}

      {needsCpf && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <CpfGate
            onComplete={(cpf) => {
              if (user) user.cpf = cpf;
              setNeedsCpf(false);
              claim();
            }}
          />
        </div>
      )}
    </div>
  );
}
