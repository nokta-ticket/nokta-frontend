"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton, RowsSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import { VENUE_INVENTORY_UNIT_LABEL, type VenueInventoryItem } from "@/services/venue-stock";
import { useVenueStockCategories, useVenueStockItemBalances, useVenueStockItemMutations, useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { ItemFormDialog } from "./item-form-dialog";
import { ItemDetailSheet } from "./item-detail-sheet";
import { CategoriesManagerDialog } from "./categories-manager-dialog";
import { ArchivedBadge, StockStatusBadge } from "./stock-status-badge";
import { StockLevel } from "./stock-primitives";

const PAGE_SIZE = 20;
type ItemStatus = "ACTIVE" | "ARCHIVED";

/** Saldo do item na unidade selecionada (a lista de itens é da organização; o saldo é por unidade). */
function useBalanceAt(orgId: number, itemId: number, locationId: number) {
  const { data, isLoading } = useVenueStockItemBalances(orgId, itemId);
  return { balance: data?.find((b) => b.locationId === locationId) ?? null, isLoading };
}

function NoBalance() {
  return (
    <StatusBadge tone="neutral" dot={false}>
      Sem saldo aqui
    </StatusBadge>
  );
}

function ItemBalanceCells({ orgId, item, locationId }: { orgId: number; item: VenueInventoryItem; locationId: number }) {
  const { balance, isLoading } = useBalanceAt(orgId, item.id, locationId);
  if (isLoading) {
    return (
      <>
        <DataTableCell>
          <Skeleton className="h-7 w-44" />
        </DataTableCell>
        <DataTableCell>
          <Skeleton className="h-6 w-20 rounded-pill" />
        </DataTableCell>
      </>
    );
  }
  return (
    <>
      <DataTableCell>{balance ? <StockLevel onHand={balance.quantityOnHand} target={balance.targetQuantity} status={balance.status} unit={item.baseUnit} /> : <span className="text-caption text-subtle-foreground">Nenhum lançamento nesta unidade</span>}</DataTableCell>
      <DataTableCell>{item.archivedAt ? <ArchivedBadge archived /> : balance ? <StockStatusBadge status={balance.status} /> : <NoBalance />}</DataTableCell>
    </>
  );
}

function ItemMobileCard({ orgId, item, locationId, index, onOpen, actions }: { orgId: number; item: VenueInventoryItem; locationId: number; index: number; onOpen: () => void; actions: React.ReactNode }) {
  const { balance, isLoading } = useBalanceAt(orgId, item.id, locationId);
  return (
    <MobileCard
      index={index}
      title={item.nome}
      badge={isLoading ? <Skeleton className="h-6 w-20 rounded-pill" /> : item.archivedAt ? <ArchivedBadge archived /> : balance ? <StockStatusBadge status={balance.status} /> : <NoBalance />}
      subtitle={
        <span className="block">
          <span className="block truncate">{[item.category?.nome ?? "Sem categoria", item.internalCode].filter(Boolean).join(" · ")}</span>
          {isLoading ? <span className="skeleton-shimmer mt-2 block h-7 w-full rounded-md" /> : balance ? <StockLevel onHand={balance.quantityOnHand} target={balance.targetQuantity} status={balance.status} unit={item.baseUnit} className="mt-2" /> : null}
        </span>
      }
      meta={[{ label: "Unidade-base", value: VENUE_INVENTORY_UNIT_LABEL[item.baseUnit] }, ...(balance ? [{ label: "Mínimo", value: `${Number(balance.minimumQuantity).toLocaleString("pt-BR")}`, num: true }] : [])]}
      onClick={onOpen}
      actions={actions}
    />
  );
}

export function ItensTab({ orgId, locationId, locationName, locations, onCreate }: { orgId: number; locationId: number; locationName: string; locations: VenueLocation[]; onCreate: () => void }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<ItemStatus>("ACTIVE");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueInventoryItem | null>(null);
  const [detail, setDetail] = useState<VenueInventoryItem | null>(null);
  const [archiving, setArchiving] = useState<VenueInventoryItem | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const { data: categories } = useVenueStockCategories(orgId);
  const { data, isLoading, isError, isFetching, refetch } = useVenueStockItems(orgId, {
    search: debouncedSearch || undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
    status,
    page,
    limit: PAGE_SIZE,
  });
  const { archive } = useVenueStockItemMutations(orgId);

  const list = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(debouncedSearch) || categoryId !== "all" || status !== "ACTIVE";

  const changeSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const changeCategory = (v: string) => {
    setCategoryId(v);
    setPage(1);
  };
  const changeStatus = (v: ItemStatus) => {
    setStatus(v);
    setPage(1);
  };
  const clearFilters = () => {
    setSearch("");
    setCategoryId("all");
    setStatus("ACTIVE");
    setPage(1);
  };

  const openEdit = (item: VenueInventoryItem) => {
    setDetail(null);
    setEditing(item);
    setFormOpen(true);
  };

  const handleArchive = async () => {
    if (!archiving) return;
    try {
      await archive.mutateAsync(archiving.id);
      toast.success("Item arquivado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível arquivar."));
    }
  };

  const rowActions = (item: VenueInventoryItem) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label={`Editar ${item.nome}`} title="Editar" onClick={() => openEdit(item)}>
        <Icon name="edit" size={14} />
      </Button>
      {!item.archivedAt ? (
        <Button variant="subtle" size="icon-sm" aria-label={`Arquivar ${item.nome}`} title="Arquivar" className="hover:bg-danger-bg hover:text-danger" onClick={() => setArchiving(item)}>
          <Icon name="ban" size={14} />
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="space-y-4">
      <DataTableToolbar>
        <SearchInput value={search} onChange={changeSearch} placeholder="Buscar por nome, código ou EAN" className="w-full md:w-auto md:max-w-xl md:flex-1" />
        <NativeSelect aria-label="Categoria" value={categoryId} onChange={(e) => changeCategory(e.target.value)} className="w-full md:w-48">
          <option value="all">Todas as categorias</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nome}
            </option>
          ))}
        </NativeSelect>
        <SegmentedControl
          size="sm"
          value={status}
          onChange={changeStatus}
          options={[
            { value: "ACTIVE", label: "Ativos" },
            { value: "ARCHIVED", label: "Arquivados" },
          ]}
        />
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="sm" leftIcon="tags" onClick={() => setCategoriesOpen(true)}>
            Categorias
          </Button>
          <Button variant="subtle" size="icon-sm" aria-label="Atualizar lista" title="Atualizar" onClick={() => refetch()}>
            <Icon name="refresh" size={14} className={cn(isFetching && "animate-spin")} />
          </Button>
        </div>
      </DataTableToolbar>

      {isError ? (
        <ErrorState description="Não foi possível carregar os itens." onRetry={() => refetch()} />
      ) : isLoading ? (
        <RowsSkeleton rows={6} />
      ) : list.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="search"
            title="Nenhum item encontrado"
            description="Tente outra busca ou limpe os filtros."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="box"
            title="Nenhum item de estoque ainda"
            description="Cadastre insumos e produtos pra controlar compras, consumo e saldo."
            action={
              <Button leftIcon="plus" onClick={onCreate}>
                Novo item
              </Button>
            }
          />
        )
      ) : (
        <DataTableShell
          maxHeight="calc(100dvh - 30rem)"
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Item</DataTableHeadCell>
                  <DataTableHeadCell>Categoria</DataTableHeadCell>
                  <DataTableHeadCell width={220}>Saldo em {locationName}</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right">Ações</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.map((item, i) => (
                  <DataTableRow key={item.id} index={i} onClick={() => setDetail(item)}>
                    <DataTableCell>
                      <p className="font-semibold text-foreground">{item.nome}</p>
                      <p className="text-caption text-muted-foreground">{[item.internalCode, VENUE_INVENTORY_UNIT_LABEL[item.baseUnit]].filter(Boolean).join(" · ")}</p>
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground">{item.category?.nome ?? <span className="text-subtle-foreground">Sem categoria</span>}</DataTableCell>
                    <ItemBalanceCells orgId={orgId} item={item} locationId={locationId} />
                    <DataTableCell align="right" stopPropagation>
                      <div className="flex items-center justify-end gap-0.5">{rowActions(item)}</div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {list.map((item, i) => (
                <ItemMobileCard key={item.id} orgId={orgId} item={item} locationId={locationId} index={i} onOpen={() => setDetail(item)} actions={rowActions(item)} />
              ))}
            </MobileCardList>
          }
          footer={<DataTablePagination page={page} lastPage={lastPage} total={total} perPage={PAGE_SIZE} noun="itens" onPageChange={setPage} />}
        />
      )}

      <ItemFormDialog orgId={orgId} locations={locations} categories={categories ?? []} item={editing} open={formOpen} onOpenChange={setFormOpen} />
      <ItemDetailSheet orgId={orgId} item={detail} open={detail !== null} onOpenChange={(v) => !v && setDetail(null)} locationId={locationId} onEdit={openEdit} />
      <CategoriesManagerDialog orgId={orgId} open={categoriesOpen} onOpenChange={setCategoriesOpen} />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        danger
        icon="ban"
        title={`Arquivar ${archiving?.nome ?? "item"}?`}
        description="Não recebe mais compras nem lançamentos manuais. O histórico e os saldos continuam visíveis."
        confirmLabel="Arquivar"
        onConfirm={handleArchive}
      />
    </div>
  );
}
