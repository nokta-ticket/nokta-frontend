"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueStockCount } from "@/services/venue-stock";
import { useVenueStockCategories } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockCountMutations, useVenueStockCounts } from "../_hooks/use-venue-stock-movements";
import { StockCountDetailSheet } from "./stock-count-detail-sheet";
import { CountStatusBadge } from "./stock-status-badge";
import { formatShortDateTime, plural } from "./stock-primitives";

function countedOf(count: VenueStockCount) {
  return count.items.filter((i) => i.countedQuantity !== null && i.countedQuantity !== "").length;
}

function divergentOf(count: VenueStockCount) {
  return count.items.filter((i) => i.differenceQuantity !== null && Number(i.differenceQuantity) !== 0).length;
}

export function InventarioTab({ orgId, locationId, locationName }: { orgId: number; locationId: number; locationName: string }) {
  const { data: categories } = useVenueStockCategories(orgId);
  const { data: counts, isLoading, isError, refetch } = useVenueStockCounts(orgId, locationId);
  const { create } = useVenueStockCountMutations(orgId, locationId);

  const [categoryId, setCategoryId] = useState<string>("all");
  const [detailId, setDetailId] = useState<number | null>(null);

  const list = counts ?? [];
  const openDraft = list.find((c) => c.status === "DRAFT") ?? null;

  const handleCreate = () => {
    create
      .mutateAsync({ categoryId: categoryId !== "all" ? Number(categoryId) : undefined })
      .then((created) => {
        toast.success("Inventário iniciado.");
        setDetailId(created.id);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível iniciar o inventário.")));
  };

  const progress = (c: VenueStockCount) => {
    if (c.items.length === 0) return "Sem itens";
    if (c.status === "DRAFT") return `${countedOf(c)} de ${c.items.length}`;
    const divergent = divergentOf(c);
    return divergent > 0 ? plural(divergent, "divergência", "divergências") : "Sem divergências";
  };

  return (
    <div className="space-y-4">
      <DataTableToolbar>
        <NativeSelect aria-label="Escopo do inventário" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={openDraft !== null} className="w-full sm:w-60" title={openDraft ? "Conclua o inventário em andamento antes de iniciar outro" : undefined}>
          <option value="all">Todos os itens ativos</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={String(c.id)}>
              Só {c.nome}
            </option>
          ))}
        </NativeSelect>
        <Button className="ml-auto" size="sm" leftIcon="clipboard-list" onClick={handleCreate} loading={create.isPending} disabled={openDraft !== null} title={openDraft ? "Já existe um inventário em andamento" : undefined}>
          Novo inventário
        </Button>
      </DataTableToolbar>

      {openDraft ? (
        <Callout
          tone="info"
          icon="clipboard-list"
          title={`Inventário ${openDraft.publicCode} em andamento`}
          action={
            <Button size="sm" variant="outline" onClick={() => setDetailId(openDraft.id)}>
              Continuar
            </Button>
          }
        >
          {countedOf(openDraft)} de {openDraft.items.length} itens contados. Conclua ou cancele antes de iniciar outro em {locationName}.
        </Callout>
      ) : null}

      {isError ? (
        <ErrorState description="Não foi possível carregar os inventários." onRetry={() => refetch()} />
      ) : isLoading ? (
        <RowsSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="clipboard-check"
          title="Nenhum inventário ainda"
          description="Conte o estoque físico e deixe o sistema ajustar as diferenças."
          action={
            <Button leftIcon="clipboard-list" onClick={handleCreate} loading={create.isPending}>
              Novo inventário
            </Button>
          }
        />
      ) : (
        <DataTableShell
          maxHeight="calc(100dvh - 30rem)"
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Inventário</DataTableHeadCell>
                  <DataTableHeadCell>Iniciado</DataTableHeadCell>
                  <DataTableHeadCell align="right">Itens</DataTableHeadCell>
                  <DataTableHeadCell>Contagem</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right">Ações</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.map((c, i) => (
                  <DataTableRow key={c.id} index={i} onClick={() => setDetailId(c.id)}>
                    <DataTableCell>
                      <p className="font-semibold text-foreground">{c.publicCode}</p>
                      {c.notes ? <p className="max-w-xs truncate text-caption text-muted-foreground">{c.notes}</p> : null}
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-muted-foreground tnum">{formatShortDateTime(c.startedAt)}</DataTableCell>
                    <DataTableCell num>{c.items.length}</DataTableCell>
                    <DataTableCell className="text-muted-foreground tnum">{progress(c)}</DataTableCell>
                    <DataTableCell>
                      <CountStatusBadge status={c.status} />
                    </DataTableCell>
                    <DataTableCell align="right" stopPropagation>
                      <Button variant="subtle" size="icon-sm" aria-label={`Abrir ${c.publicCode}`} title={c.status === "DRAFT" ? "Continuar contagem" : "Ver detalhes"} onClick={() => setDetailId(c.id)}>
                        <Icon name={c.status === "DRAFT" ? "edit" : "eye"} size={14} />
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {list.map((c, i) => (
                <MobileCard
                  key={c.id}
                  index={i}
                  title={c.publicCode}
                  subtitle={c.notes ?? formatShortDateTime(c.startedAt)}
                  badge={<CountStatusBadge status={c.status} />}
                  meta={[
                    { label: "Iniciado", value: formatShortDateTime(c.startedAt), num: true },
                    { label: c.status === "DRAFT" ? "Contados" : "Resultado", value: progress(c), num: true },
                  ]}
                  onClick={() => setDetailId(c.id)}
                />
              ))}
            </MobileCardList>
          }
        />
      )}

      <StockCountDetailSheet orgId={orgId} locationId={locationId} countId={detailId} open={detailId !== null} onOpenChange={(v) => !v && setDetailId(null)} />
    </div>
  );
}
