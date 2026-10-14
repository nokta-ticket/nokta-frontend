"use client";

import { use, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { resolveMediaUrl } from "@/lib/media";
import { formatarDataCurta, formatarHorario } from "@/lib/formatarData";
import { CpfGate } from "../../evento/[id]/checkout/_components/cpf-gate";

// Página do link da lista VIP (o que o produtor põe no story): mostra o
// evento, pede login ou cadastro e entrega o VIP na conta com um toque.

type VipStatus = "ABERTA" | "ENCERRADA" | "ESGOTADA" | "INDISPONIVEL";

interface VipListResponse {
  evento: {
    id: number;
    nome: string;
    slug: string | null;
    data: string;
    horario: string;
    thumbnail: string | null;
    endereco: { logradouro: string; numero: string; bairro: string; localidade: string; uf: string } | null;
  };
  lista: { nome: string | null; ate: string | null; status: VipStatus };
}

const CLOSED_MESSAGE: Record<Exclude<VipStatus, "ABERTA">, string> = {
  ENCERRADA: "O prazo para retirar este VIP já encerrou.",
  ESGOTADA: "Os VIPs desta lista esgotaram.",
  INDISPONIVEL: "Esta lista VIP não está disponível no momento.",
};

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const zone = "America/Sao_Paulo";
  const day = d.toLocaleDateString("pt-BR", { timeZone: zone, weekday: "long", day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("pt-BR", { timeZone: zone, hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

export default function VipListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { isAuthenticated, isAuthResolved, user } = useAuth();

  const [data, setData] = useState<VipListResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [needsCpf, setNeedsCpf] = useState(false);
  const [result, setResult] = useState<"claimed" | "already" | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<VipListResponse>(`/lista-vip/${token}`);
        if (active) setData(res.data);
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err, "Este link de lista VIP não é válido."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const claim = useCallback(async () => {
    setClaiming(true);
    try {
      const res = await api.post<{ claimed: boolean; alreadyClaimed: boolean }>(`/lista-vip/${token}/retirar`);
      setResult(res.data.alreadyClaimed ? "already" : "claimed");
    } catch (err: any) {
      if (err?.response?.data?.code === "CPF_REQUIRED") {
        setNeedsCpf(true);
      } else {
        toast.error(getErrorMessage(err, "Não foi possível retirar o VIP. Tente de novo."));
      }
    } finally {
      setClaiming(false);
    }
  }, [token]);

  const handleClaim = () => {
    if (user && !user.cpf) {
      setNeedsCpf(true);
      return;
    }
    claim();
  };

  if (needsCpf) {
    return (
      <CpfGate
        onComplete={(cpf) => {
          if (user) user.cpf = cpf;
          setNeedsCpf(false);
          claim();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-gray-500">Carregando lista VIP…</p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-gray-900">Lista VIP indisponível</h1>
          <p className="mt-1 text-sm text-gray-500">{loadError}</p>
          <Link href="/eventos" className="mt-4 inline-block text-sm font-semibold text-primary">
            Ver eventos
          </Link>
        </div>
      </div>
    );
  }

  const { evento, lista } = data;
  const banner = resolveMediaUrl(evento.thumbnail, null);
  const horario = formatarHorario(evento.horario);
  const redirect = encodeURIComponent(`/vip/${token}`);
  const local = evento.endereco
    ? `${evento.endereco.logradouro}, ${evento.endereco.numero} · ${evento.endereco.localidade}/${evento.endereco.uf}`
    : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {banner && (
          <div className="relative aspect-[818/355] w-full bg-gray-100">
            <Image src={banner} alt={evento.nome} fill unoptimized className="object-cover" sizes="448px" />
          </div>
        )}

        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{lista.nome || "Lista VIP"}</p>
            <h1 className="mt-1 text-xl font-semibold leading-tight text-gray-900">{evento.nome}</h1>
          </div>

          <div className="space-y-1.5 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
              {formatarDataCurta(evento.data)}
              {horario ? ` · ${horario}` : ""}
            </p>
            {local && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span>{local}</span>
              </p>
            )}
          </div>

          {result ? (
            <div className="space-y-3 rounded-xl bg-emerald-50 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {result === "claimed" ? "Seu VIP está garantido" : "Você já retirou este VIP"}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  O ingresso com o QR code está na sua conta. Mostre na entrada do evento.
                </p>
              </div>
              <Button asChild className="h-12 w-full rounded-xl text-sm font-semibold">
                <Link href="/meus-ingressos">Ver meu ingresso</Link>
              </Button>
            </div>
          ) : lista.status !== "ABERTA" ? (
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-sm font-semibold text-gray-900">{CLOSED_MESSAGE[lista.status]}</p>
              {evento.slug && (
                <Link href={`/evento/${evento.slug}`} className="mt-2 inline-block text-sm font-semibold text-primary">
                  Ver página do evento
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {lista.ate && (
                <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm text-gray-700">
                  Entrada gratuita, um VIP por pessoa. Retire até <strong>{formatDeadline(lista.ate)}</strong>.
                </p>
              )}

              {!isAuthResolved ? (
                <Button disabled className="h-12 w-full rounded-xl text-sm font-semibold">
                  Carregando…
                </Button>
              ) : isAuthenticated ? (
                <Button onClick={handleClaim} disabled={claiming} className="h-12 w-full rounded-xl text-sm font-semibold">
                  {claiming ? "Retirando…" : "Pegar meu VIP"}
                </Button>
              ) : (
                <>
                  <Button asChild className="h-12 w-full rounded-xl text-sm font-semibold">
                    <Link href={`/login?redirect=${redirect}`}>Entrar para pegar meu VIP</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 w-full rounded-xl text-sm font-semibold">
                    <Link href={`/register?redirect=${redirect}`}>Criar conta</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
