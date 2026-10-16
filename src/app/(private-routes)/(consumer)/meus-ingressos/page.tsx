"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PushOptIn } from "@/components/push/push-opt-in";
import { groupByEvent, isUpcoming, ticketDateLabel, ticketStatusMeta, type PaginateInfo, type UserTicket } from "./_lib/tickets";

type Wallet = "ingressos" | "produtos";
type Period = "proximos" | "passados";

// ── Card por evento ────────────────────────────────────────────────
function TicketGroupCard({ item, count, past, index }: { item: UserTicket; count: number; past?: boolean; index: number }) {
  const cover = resolveMediaUrl(item.event?.thumbnail, null);
  const date = ticketDateLabel(item.event);
  const status = ticketStatusMeta(item.status);
  const place = item.event?.endereco ? `${item.event.endereco.localidade} · ${item.event.endereco.uf}` : null;

  return (
    <Link href={`/meus-ingressos/${item.id}`} className={cn("fade-up press group block", past && "opacity-80")} style={{ ["--i" as string]: index } as React.CSSProperties}>
      <div className={cn("relative aspect-video overflow-hidden rounded-card bg-surface-2 shadow-card", past && "grayscale")}>
        {cover ? (
          <Image src={cover} alt="" fill priority={index === 0} sizes="(max-width:1024px) 100vw, 33vw" className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-subtle-foreground">
            <Icon name="ticket" size={34} />
          </div>
        )}
        <div className="poster-fade absolute inset-0" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-black/45 px-2.5 py-1 text-caption font-semibold text-white backdrop-blur-md">
            <Icon name="ticket" size={11} />
            {count} {count === 1 ? "ingresso" : "ingressos"}
          </span>
        </div>
        {past || item.status !== 1 ? (
          <div className="absolute right-3 top-3">
            <StatusBadge tone={past && item.status === 1 ? "neutral" : status.tone} className="bg-black/45 ring-white/15 backdrop-blur-md">
              {past && item.status === 1 ? "Encerrado" : status.label}
            </StatusBadge>
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <h3 className="line-clamp-2 font-display text-[1.5rem] uppercase leading-[0.95] text-white drop-shadow">{item.event?.nome ?? "Evento"}</h3>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-black">
            <Icon name="qr" size={16} />
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-0.5 px-0.5">
        {date ? <p className="text-caption font-semibold text-brand">{date}</p> : null}
        <p className="truncate text-caption text-muted-foreground">
          {item.ticket.nome}
          {place ? ` · ${place}` : ""}
        </p>
      </div>
    </Link>
  );
}

function TicketGroupSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton-shimmer aspect-video rounded-card" />
      <div className="space-y-2 px-0.5">
        <div className="skeleton-shimmer h-3 w-1/2 rounded-md" />
        <div className="skeleton-shimmer h-3 w-2/3 rounded-md" />
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────
export default function MeusIngressosPage() {
  const [items, setItems] = useState<UserTicket[]>([]);
  const [paginate, setPaginate] = useState<PaginateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState<Wallet>("ingressos");
  const [period, setPeriod] = useState<Period>("proximos");
  const [search, setSearch] = useState("");

  const loadTickets = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/tickets?page=${targetPage}&limit=50`);
      setItems(res.data.data ?? []);
      setPaginate(res.data.paginate ?? null);
    } catch (err) {
      setItems([]);
      setPaginate(null);
      setError(getErrorMessage(err, "Não foi possível carregar seus ingressos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets(page);
  }, [page, loadTickets]);

  // Mais recentes primeiro (data de compra).
  const sorted = useMemo(() => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [items]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((t) => t.event?.nome?.toLowerCase().includes(q) || t.ticket.nome.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
  }, [sorted, search]);

  const upcoming = useMemo(() => searched.filter(isUpcoming), [searched]);
  const past = useMemo(() => searched.filter((t) => !isUpcoming(t)), [searched]);
  const groups = useMemo(() => groupByEvent(period === "proximos" ? upcoming : past), [period, upcoming, past]);

  const periodTabs = (
    <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="gap-0">
      <TabsList variant="pill" className="w-full sm:w-fit">
        <TabsTrigger value="proximos" className="flex-1 sm:flex-none sm:px-5">
          Próximos
        </TabsTrigger>
        <TabsTrigger value="passados" className="flex-1 sm:flex-none sm:px-5">
          Passados
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display font-medium tracking-tight text-foreground">Meus ingressos</h1>
          {!loading && !error && paginate ? (
            <p className="mt-1 text-body text-muted-foreground tnum">
              {paginate.total} {paginate.total === 1 ? "ingresso" : "ingressos"} na carteira
            </p>
          ) : null}
        </div>
        <SegmentedControl<Wallet> value={wallet} onChange={setWallet} fullWidth options={[{ value: "ingressos", label: "Ingressos", icon: "ticket" }, { value: "produtos", label: "Produtos", icon: "box" }]} className="sm:w-auto" />
      </div>

      {wallet === "produtos" ? (
        <EmptyState icon="box" title="Nenhum produto ainda" description="Produtos vinculados aos seus eventos vão aparecer aqui." className="mt-8" />
      ) : (
        <>
          <PushOptIn className="mt-6" />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {periodTabs}
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por evento, lote ou código" className="sm:w-80" />
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TicketGroupSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorState title="Não deu pra carregar seus ingressos" description={error} onRetry={() => loadTickets(page)} />
            ) : items.length === 0 ? (
              <EmptyState
                icon="ticket"
                title="Nenhum ingresso por aqui"
                description="Você ainda não tem ingressos. Que tal descobrir o que tá rolando?"
                action={
                  <Button asChild shape="pill">
                    <Link href="/eventos">Explorar eventos</Link>
                  </Button>
                }
              />
            ) : groups.length === 0 ? (
              search.trim() ? (
                <EmptyState compact icon="search" title="Nenhum resultado" description="Tenta outro nome de evento, lote ou código." action={<Button variant="outline" shape="pill" onClick={() => setSearch("")}>Limpar busca</Button>} />
              ) : period === "proximos" ? (
                <EmptyState
                  compact
                  icon="party"
                  title="Nada marcado por enquanto"
                  description="Seus próximos rolês aparecem aqui assim que você garantir um ingresso."
                  action={
                    <Button asChild shape="pill">
                      <Link href="/eventos">Ver eventos</Link>
                    </Button>
                  }
                />
              ) : (
                <EmptyState compact icon="history" title="Nenhum ingresso passado" description="Ingressos usados ou de eventos encerrados ficam guardados aqui." />
              )
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map(({ item, count }, i) => (
                  <TicketGroupCard key={item.id} item={item} count={count} past={period === "passados"} index={i} />
                ))}
              </div>
            )}
          </div>

          {!loading && !error && paginate && paginate.lastPage > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" shape="pill" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <Icon name="chevron-left" size={12} />
              </Button>
              <span className="text-caption text-muted-foreground tnum">
                Página {page} de {paginate.lastPage}
              </span>
              <Button variant="outline" size="icon" shape="pill" aria-label="Próxima página" disabled={page === paginate.lastPage} onClick={() => setPage((p) => Math.min(paginate.lastPage, p + 1))}>
                <Icon name="chevron-right" size={12} />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
