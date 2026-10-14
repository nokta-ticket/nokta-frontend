"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { SelectInput } from "@/components/ui/select-input";
import { ResaleCardSkeleton } from "@/components/ui/skeleton";
import { ResaleRow } from "./_components/resale-row";
import { ResaleInfoTabs } from "./_components/resale-info-tabs";
import type { ResaleItem, ResaleListResponse } from "./_lib/resale";

const PER_PAGE = 10;

/**
 * Lista pública de ingressos em revenda. Uma leitura (até 100 anúncios, como
 * antes), filtro por evento e paginação no cliente — assim o filtro funciona
 * mesmo quando o backend ignora `eventId`.
 */
export default function RevendaPage() {
  const [items, setItems] = useState<ResaleItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setError(null);
    setItems(null);
    try {
      const res = await api.get<ResaleListResponse>("/revenda", { params: { page: 1, limit: 100 } });
      setItems(res.data.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os ingressos disponíveis."));
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const eventOptions = useMemo(() => {
    const map = new Map<string, { label: string; data: string }>();
    for (const r of items ?? []) {
      if (r.evento && !map.has(String(r.evento.id))) map.set(String(r.evento.id), { label: r.evento.nome, data: r.evento.data });
    }
    const sorted = Array.from(map.entries()).sort((a, b) => a[1].data.localeCompare(b[1].data));
    return [{ value: "all", label: "Todos os eventos" }, ...sorted.map(([value, { label }]) => ({ value, label }))];
  }, [items]);

  const filtered = useMemo(() => (items ?? []).filter((r) => eventFilter === "all" || String(r.evento?.id) === eventFilter), [items, eventFilter]);
  const lastPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, lastPage);
  const pageItems = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const loading = items === null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 lg:px-6 lg:pt-8">
      <header className="slide-up">
        <h1 className="text-title font-semibold tracking-tight text-foreground lg:text-display">Revenda</h1>
        <p className="mt-1.5 max-w-xl text-body text-muted-foreground">Ingressos de quem não vai mais, pelo preço original ou menos. QR Code novo direto na sua conta.</p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SelectInput
          aria-invalid={false}
          value={eventFilter}
          onValueChange={(v) => {
            setEventFilter(v);
            setPage(1);
          }}
          options={eventOptions}
          disabled={loading || eventOptions.length <= 1}
          className="sm:max-w-xs"
        />
        {!loading && !error ? (
          <p className="text-caption text-muted-foreground tnum">
            {filtered.length} {filtered.length === 1 ? "ingresso à venda" : "ingressos à venda"}
          </p>
        ) : null}
      </div>

      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        <section aria-label="Ingressos em revenda">
          {error ? (
            <ErrorState title="Não deu pra carregar a revenda" description={error} onRetry={load} />
          ) : loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <ResaleCardSkeleton key={i} />
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <EmptyState icon="ticket" title={eventFilter === "all" ? "Nenhum ingresso em revenda agora" : "Nada em revenda pra este evento"} description="Quando alguém anunciar, aparece aqui. Vale voltar mais tarde." action={eventFilter !== "all" ? <Button variant="outline" onClick={() => setEventFilter("all")}>Ver todos os eventos</Button> : undefined} />
          ) : (
            <>
              <div className="space-y-2.5">
                {pageItems.map((r, i) => (
                  <ResaleRow key={r.id} resale={r} className="row-in" style={{ ["--i" as string]: i } as React.CSSProperties} />
                ))}
              </div>
              {lastPage > 1 ? (
                <nav aria-label="Paginação" className="mt-6 flex items-center justify-between gap-3">
                  <p className="text-caption text-muted-foreground tnum">
                    Página {current} de {lastPage} · {filtered.length} ingressos
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" leftIcon="chevron-left" aria-label="Página anterior" disabled={current <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                    <Button variant="outline" size="icon" leftIcon="chevron-right" aria-label="Próxima página" disabled={current >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))} />
                  </div>
                </nav>
              ) : null}
            </>
          )}
        </section>

        <aside className="mt-10 lg:sticky lg:top-24 lg:mt-0">
          <ResaleInfoTabs />
        </aside>
      </div>
    </div>
  );
}
