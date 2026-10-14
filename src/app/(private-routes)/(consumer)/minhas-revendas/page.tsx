"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatBRL, formatEventDate } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { normalizePagination, type PaginationDetails } from "@/lib/pagination";
import type { Tone } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { ResaleCardSkeleton } from "@/components/ui/skeleton";

type ResaleStatus = 1 | 2 | 3 | 4;

interface MyResale {
  id: number;
  resalePrice: number;
  originalPrice: number;
  status: ResaleStatus;
  expiresAt: string;
  evento: {
    nome: string;
    data: string;
    endereco: { localidade: string; uf: string } | null;
    thumbnail: string | null;
  } | null;
  ingresso: { nome: string; lote: number } | null;
}

interface MyResaleListResponse {
  data: MyResale[];
  paginate?: { total?: number; perPage?: number; currentPage?: number; lastPage?: number };
}

const STATUS_META: Record<ResaleStatus, { label: string; tone: Tone }> = {
  1: { label: "Anunciado", tone: "success" },
  2: { label: "Vendido", tone: "info" },
  3: { label: "Cancelado", tone: "neutral" },
  4: { label: "Expirado", tone: "warning" },
};

function ResaleCard({ r, index, onCancel, cancelling }: { r: MyResale; index: number; onCancel: () => void; cancelling: boolean }) {
  const meta = STATUS_META[r.status] ?? STATUS_META[3];
  const cover = resolveMediaUrl(r.evento?.thumbnail, null);
  const inactive = r.status !== 1;
  return (
    <article className={cn("fade-up flex flex-col gap-3 rounded-card border border-border bg-surface p-3 shadow-card sm:flex-row sm:items-center sm:gap-4 sm:p-4", inactive && "opacity-80")} style={{ ["--i" as string]: index } as React.CSSProperties}>
      <div className={cn("relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-40", inactive && "grayscale")}>
        {cover ? (
          <Image src={cover} alt="" fill sizes="(max-width:640px) 100vw, 160px" className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-subtle-foreground">
            <Icon name="ticket" size={24} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold text-foreground">{r.evento?.nome ?? "Evento"}</h3>
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        </div>
        {r.ingresso ? (
          <p className="mt-0.5 text-caption text-muted-foreground">
            {r.ingresso.nome} · Lote {r.ingresso.lote}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-caption">
          {r.evento?.data ? <span className="font-semibold text-brand">{formatEventDate(r.evento.data)}</span> : null}
          {r.evento?.endereco ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Icon name="map-pin" size={10} />
              {r.evento.endereco.localidade} · {r.evento.endereco.uf}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <div className="sm:text-right">
          <p className="text-micro uppercase tracking-wider text-subtle-foreground">Preço de revenda</p>
          <p className="tnum text-base font-semibold text-foreground">{formatBRL(r.resalePrice)}</p>
        </div>
        {r.status === 1 ? (
          <Button variant="destructive-soft" size="sm" shape="pill" leftIcon="close" onClick={onCancel} loading={cancelling}>
            Cancelar anúncio
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function MinhasRevendasPage() {
  const [resales, setResales] = useState<MyResale[]>([]);
  const [paginate, setPaginate] = useState<PaginationDetails>(normalizePagination(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [toCancel, setToCancel] = useState<MyResale | null>(null);
  const [page, setPage] = useState(1);

  const fetchMyResales = useCallback(async (targetPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<MyResale[] | MyResaleListResponse>("/revenda/meus", { params: { page: targetPage, limit: 10 } });
      const payload: MyResaleListResponse = Array.isArray(res.data) ? { data: res.data, paginate: { total: res.data.length, perPage: res.data.length, currentPage: 1, lastPage: 1 } } : res.data;
      setResales(payload.data ?? []);
      setPaginate(normalizePagination(payload.paginate ?? null));
    } catch (err) {
      setResales([]);
      setPaginate(normalizePagination(null));
      setError(getErrorMessage(err, "Não foi possível carregar seus anúncios."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyResales(page);
  }, [page, fetchMyResales]);

  async function handleCancel(resaleId: number) {
    try {
      setCancelling(resaleId);
      await api.delete(`/revenda/${resaleId}`);
      toast.success("Revenda cancelada. O ingresso voltou pra sua carteira.");
      setResales((prev) => prev.map((r) => (r.id === resaleId ? { ...r, status: 3 } : r)));
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível cancelar o anúncio."));
      throw err;
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-display font-medium tracking-tight text-foreground">Minhas revendas</h1>
          <p className="mt-1 text-body text-muted-foreground">Os ingressos que você anunciou na revenda oficial.</p>
        </div>
        <Button asChild variant="outline" shape="pill" className="hidden sm:inline-flex">
          <Link href="/meus-ingressos">Meus ingressos</Link>
        </Button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ResaleCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Não deu pra carregar seus anúncios" description={error} onRetry={() => fetchMyResales(page)} />
        ) : resales.length === 0 ? (
          <EmptyState
            icon="repeat"
            title="Nenhum anúncio ainda"
            description="Quando você colocar um ingresso na revenda, ele aparece aqui."
            action={
              <Button asChild shape="pill">
                <Link href="/meus-ingressos">Ver meus ingressos</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {resales.map((r, i) => (
              <ResaleCard key={r.id} r={r} index={i} cancelling={cancelling === r.id} onCancel={() => setToCancel(r)} />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && paginate.lastPage > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" shape="pill" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <Icon name="chevron-left" size={12} />
          </Button>
          <span className="tnum text-caption text-muted-foreground">
            Página {page} de {paginate.lastPage}
          </span>
          <Button variant="outline" size="icon" shape="pill" aria-label="Próxima página" disabled={page === paginate.lastPage} onClick={() => setPage((p) => Math.min(paginate.lastPage, p + 1))}>
            <Icon name="chevron-right" size={12} />
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={toCancel !== null}
        onOpenChange={(o) => !o && setToCancel(null)}
        danger
        title="Cancelar este anúncio?"
        description={toCancel ? `${toCancel.evento?.nome ?? "O ingresso"} sai da revenda e volta pra sua carteira com o QR Code ativo.` : undefined}
        confirmLabel="Cancelar anúncio"
        cancelLabel="Manter"
        onConfirm={() => (toCancel ? handleCancel(toCancel.id) : undefined)}
      />
    </div>
  );
}
