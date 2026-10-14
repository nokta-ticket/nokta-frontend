"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { RefreshButton } from "../_components/refresh-button";
import { formatDateTime, fullName } from "../_lib/format";
import { protectTicketMeta } from "./_components/meta";
import { InvestigationView } from "./_components/investigation-view";
import type { InvestigationData, RecentTicket, SearchResult } from "./_components/types";

type View = "feed" | "search" | "investigation";

/**
 * Nokta Protect: sistema de evidências e defesa contra disputas. Feed dos
 * últimos ingressos vendidos (atualiza a cada 30s), busca por pedido/
 * ingresso/CPF/e-mail/telefone/nome e o dossiê completo de um ingresso.
 */
export default function EvidenciasPage() {
  const [view, setView] = useState<View>("feed");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [recentTickets, setRecentTickets] = useState<RecentTicket[] | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const feedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [data, setData] = useState<InvestigationData | null>(null);
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- feed ao vivo --- */
  const fetchFeed = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const { data: res } = await api.get<{ data: RecentTicket[] }>("/admin/ingressos", { params: { page: 1, limit: 10 } });
      setRecentTickets(res.data);
      setFeedError(null);
      setSecondsAgo(0);
    } catch (err) {
      // No auto-refresh a falha é silenciosa (mantém a lista anterior); só a primeira carga mostra erro.
      setRecentTickets((prev) => prev ?? []);
      setFeedError((prev) => prev ?? getErrorMessage(err, "Não foi possível carregar os ingressos recentes."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchFeed();
    feedIntervalRef.current = setInterval(() => void fetchFeed(), 30000);
    tickerRef.current = setInterval(() => setSecondsAgo((prev) => prev + 1), 1000);
    return () => {
      if (feedIntervalRef.current) clearInterval(feedIntervalRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [fetchFeed]);

  /* --- busca --- */
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setSearching(true);
    setSearched(true);
    setView("search");
    try {
      const { data: res } = await api.get<SearchResult[]>("/admin/evidencias/investigar", { params: { q: q.trim() } });
      setResults(Array.isArray(res) ? res : []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível buscar evidências."));
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearchInput(value: string) {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => void doSearch(value), 500);
    } else if (value.trim().length === 0) {
      setView("feed");
      setSearched(false);
      setResults([]);
    }
  }

  /* --- investigação --- */
  async function loadInvestigation(ticketId: number) {
    setSelectedTicketId(ticketId);
    setView("investigation");
    setLoadingInvestigation(true);
    setInvestigationError(null);
    try {
      const { data: res } = await api.get<InvestigationData>(`/admin/evidencias/ingresso/${ticketId}`);
      setData(res);
    } catch (err) {
      setInvestigationError(getErrorMessage(err, "Não foi possível carregar a investigação."));
      setData(null);
    } finally {
      setLoadingInvestigation(false);
    }
  }

  function backToFeed() {
    setView(searched && results.length > 0 ? "search" : "feed");
    setData(null);
    setSelectedTicketId(null);
  }

  /* --- dossiê PDF --- */
  async function downloadDossie() {
    if (!selectedTicketId || !data) return;
    setDownloadingPdf(true);
    try {
      const res = await api.get<Blob>(`/admin/evidencias/dossie/${selectedTicketId}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dossie-${data.ingresso.codigo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dossiê baixado");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível gerar o dossiê PDF."));
    } finally {
      setDownloadingPdf(false);
    }
  }

  /* ---------- investigação ---------- */
  if (view === "investigation") {
    if (loadingInvestigation || (!data && !investigationError)) {
      return (
        <div className="space-y-6">
          <PageHeader back={backToFeed} title="Carregando investigação…" />
          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <Skeleton className="h-72 rounded-card" />
            <Skeleton className="h-72 rounded-card" />
          </div>
          <RowsSkeleton rows={4} />
        </div>
      );
    }
    if (!data) {
      return (
        <div className="space-y-6">
          <PageHeader back={backToFeed} title="Investigação" />
          <ErrorState title="Não deu pra carregar a investigação" description={investigationError ?? undefined} onRetry={() => (selectedTicketId ? void loadInvestigation(selectedTicketId) : undefined)} />
        </div>
      );
    }
    return <InvestigationView data={data} onBack={backToFeed} onDownload={() => void downloadDossie()} downloading={downloadingPdf} />;
  }

  const feed = recentTickets ?? [];
  const blockedOnFeed = feed.filter((t) => t.bloqueado).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Nokta Protect" description="Sistema de evidências e defesa contra disputas." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ingressos recentes" icon="ticket" value={recentTickets ? feed.length : null} hint="Últimos vendidos" />
        <StatCard label="Bloqueados no feed" icon="ban" value={recentTickets ? blockedOnFeed : null} />
        <StatCard label="Resultados da busca" icon="search" value={searched ? results.length : 0} hint={searched ? `Pra “${searchTerm.trim()}”` : "Digite pra investigar"} />
      </div>

      <DataTableToolbar>
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl">
          <SearchInput value={searchTerm} onChange={handleSearchInput} placeholder="Buscar por pedido, ingresso, CPF, e-mail, telefone ou nome" />
        </div>
        {view === "feed" ? (
          <>
            <span className="tnum text-caption text-muted-foreground">Atualizado há {secondsAgo}s</span>
            <RefreshButton onClick={() => void fetchFeed(true)} pending={refreshing} label="Atualizar agora" />
          </>
        ) : null}
      </DataTableToolbar>

      {view === "search" ? (
        searching ? (
          <RowsSkeleton rows={4} />
        ) : results.length === 0 ? (
          <EmptyState icon="search" title="Nenhum resultado" description="Tenta outro código, CPF, e-mail ou nome." />
        ) : (
          <div className="grid gap-2.5">
            {results.map((r, i) => (
              <Card key={r.id} interactive className="row-in cursor-pointer flex-row items-center justify-between gap-3 p-4" style={{ ["--i" as string]: i } as never} role="button" tabIndex={0} onClick={() => void loadInvestigation(r.id)} onKeyDown={(e) => (e.key === "Enter" ? void loadInvestigation(r.id) : null)}>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-foreground">{r.code}</p>
                  <p className="truncate text-caption text-muted-foreground">{r.evento}</p>
                </div>
                <div className="min-w-0 text-right">
                  <p className="truncate text-sm text-foreground">{r.comprador}</p>
                  <p className="tnum text-caption text-subtle-foreground">{r.dataCompra}</p>
                </div>
                <Icon name="chevron-right" size={12} className="shrink-0 text-subtle-foreground" />
              </Card>
            ))}
          </div>
        )
      ) : recentTickets === null ? (
        <RowsSkeleton rows={8} />
      ) : feedError && feed.length === 0 ? (
        <ErrorState title="Não deu pra carregar o feed" description={feedError} onRetry={() => void fetchFeed(true)} />
      ) : (
        <DataTableShell
          maxHeight="none"
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Código</DataTableHeadCell>
                  <DataTableHeadCell>Evento</DataTableHeadCell>
                  <DataTableHeadCell>Comprador</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell>Data</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={48}>
                    <span className="sr-only">Abrir</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {feed.length === 0 ? (
                  <DataTableEmpty colSpan={6} icon="ticket" title="Nenhum ingresso vendido ainda" />
                ) : (
                  feed.map((t, i) => {
                    const meta = protectTicketMeta(t.status, t.bloqueado);
                    return (
                      <DataTableRow key={t.id} index={i} onClick={() => void loadInvestigation(t.id)}>
                        <DataTableCell className="font-mono text-caption">{t.code}</DataTableCell>
                        <DataTableCell>{t.evento.nome}</DataTableCell>
                        <DataTableCell>
                          <p>{fullName(t.dono.nome, t.dono.sobrenome)}</p>
                          <p className="text-caption text-muted-foreground">{t.dono.email}</p>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </DataTableCell>
                        <DataTableCell className="tnum whitespace-nowrap text-muted-foreground">{formatDateTime(t.createdAt)}</DataTableCell>
                        <DataTableCell align="right">
                          <Icon name="chevron-right" size={12} className="text-subtle-foreground" />
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })
                )}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            feed.length === 0 ? (
              <EmptyState compact icon="ticket" title="Nenhum ingresso vendido ainda" />
            ) : (
              <MobileCardList>
                {feed.map((t, i) => {
                  const meta = protectTicketMeta(t.status, t.bloqueado);
                  return (
                    <MobileCard
                      key={t.id}
                      index={i}
                      onClick={() => void loadInvestigation(t.id)}
                      title={t.evento.nome}
                      subtitle={<span className="font-mono">{t.code}</span>}
                      badge={<StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>}
                      meta={[
                        { label: "Comprador", value: fullName(t.dono.nome, t.dono.sobrenome) },
                        { label: "Data", value: formatDateTime(t.createdAt), num: true },
                      ]}
                    />
                  );
                })}
              </MobileCardList>
            )
          }
        />
      )}
    </div>
  );
}
