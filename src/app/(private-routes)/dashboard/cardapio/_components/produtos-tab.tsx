"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { VENUE_PRODUCT_STATUS_LABEL, type VenueAvailabilityStatus, type VenueProduct, type VenueProductStatus } from "@/services/venue-menu";
import { useVenueProductMutations, useVenueProducts } from "../_hooks/use-venue-products";
import { useVenueStations } from "../_hooks/use-venue-stations";
import { useDebounce } from "../_hooks/use-debounce";
import { ProductStatusBadge } from "./venue-status-badge";
import { ProdutoCreateDialog } from "./produto-create-dialog";
import { ProdutoEditSheet, type ProdutoEditSection } from "./produto-edit-sheet";

const PAGE_SIZE = 20;

function defaultVariant(product: VenueProduct) {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0] ?? null;
}

function Thumb({ product, size }: { product: VenueProduct; size: number }) {
  const src = product.imageUrl ? resolveMediaUrl(product.imageUrl) : null;
  return (
    <div className="relative shrink-0 overflow-hidden rounded-xl bg-surface-2 hairline" style={{ width: size, height: size }}>
      {src ? <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized /> : <Icon name="utensils" size={Math.round(size * 0.32)} className="absolute inset-0 m-auto text-subtle-foreground" />}
    </div>
  );
}

/** Disponível = ACTIVE. Desligar marca como esgotado; ligar reativa. */
function AvailabilitySwitch({ product, pending, onToggle }: { product: VenueProduct; pending: boolean; onToggle: (next: VenueAvailabilityStatus) => void }) {
  const archived = product.status === "ARCHIVED";
  return <Switch checked={product.status === "ACTIVE"} disabled={archived || pending} aria-label={product.status === "ACTIVE" ? "Marcar como esgotado" : "Disponibilizar"} onCheckedChange={(checked) => onToggle(checked ? "ACTIVE" : "SOLD_OUT")} />;
}

export function ProdutosTab({
  orgId,
  menuId,
  defaultCategoryId,
  createOpen,
  onCreateOpenChange,
  onOpenBulk,
}: {
  orgId: number;
  menuId: number | null;
  defaultCategoryId: number | null;
  createOpen: boolean;
  onCreateOpenChange: (v: boolean) => void;
  onOpenBulk: () => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState<VenueProductStatus | "ALL">("ALL");
  const [stationId, setStationId] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ productId: number; section: ProdutoEditSection } | null>(null);
  const [archiving, setArchiving] = useState<VenueProduct | null>(null);

  const { data: stations } = useVenueStations(orgId);
  const { data, isLoading, isError, isFetching, refetch } = useVenueProducts(orgId, { search: debouncedSearch || undefined, status: status === "ALL" ? undefined : status, preparationStationId: stationId === "ALL" ? undefined : Number(stationId), page, limit: PAGE_SIZE });
  const { archive, setAvailability } = useVenueProductMutations(orgId);

  const products = data?.data ?? [];
  const total = data?.paginate.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== "ALL" || stationId !== "ALL" || debouncedSearch.length > 0;

  const openEdit = (productId: number, section: ProdutoEditSection = "geral") => setEditing({ productId, section });
  const toggleAvailability = (product: VenueProduct, next: VenueAvailabilityStatus) =>
    setAvailability.mutate({ productId: product.id, status: next }, { onSuccess: () => toast.success(next === "SOLD_OUT" ? "Marcado como esgotado" : "Produto disponível"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a disponibilidade.")) });

  const rowActions = (product: VenueProduct) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label="Editar" title="Editar" onClick={() => openEdit(product.id, "geral")}>
        <Icon name="edit" size={14} />
      </Button>
      <Button variant="subtle" size="icon-sm" aria-label="Variações" title="Variações e preços" onClick={() => openEdit(product.id, "variantes")}>
        <Icon name="layers" size={14} />
      </Button>
      <Button variant="subtle" size="icon-sm" aria-label="Arquivar" title={product.status === "ARCHIVED" ? "Já arquivado" : "Arquivar"} disabled={product.status === "ARCHIVED"} className="hover:bg-danger-bg hover:text-danger disabled:opacity-40" onClick={() => setArchiving(product)}>
        <Icon name="trash" size={14} />
      </Button>
    </>
  );

  const empty = hasFilters ? (
    <EmptyState icon="search" title="Nenhum produto encontrado" description="Tente outro nome ou limpe os filtros." action={<Button variant="outline" onClick={() => { setSearch(""); setStatus("ALL"); setStationId("ALL"); setPage(1); }}>Limpar filtros</Button>} />
  ) : (
    <EmptyState icon="utensils" title="Nenhum produto ainda" description="Cadastre o primeiro produto pra começar a montar o cardápio." action={<Button leftIcon="plus" onClick={() => onCreateOpenChange(true)}>Novo produto</Button>} />
  );

  return (
    <div className="space-y-4">
      <DataTableToolbar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar produto…" className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl" />
        <NativeSelect aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value as VenueProductStatus | "ALL"); setPage(1); }} className="w-[calc(50%-0.25rem)] sm:w-44">
          <option value="ALL">Todos os status</option>
          {Object.entries(VENUE_PRODUCT_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Estação" value={stationId} onChange={(e) => { setStationId(e.target.value); setPage(1); }} className="w-[calc(50%-0.25rem)] sm:w-44">
          <option value="ALL">Toda estação</option>
          {(stations ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </NativeSelect>
        <Button variant="subtle" size="icon" aria-label="Atualizar" onClick={() => refetch()} className="ml-auto hidden sm:inline-flex">
          <Icon name="refresh" size={14} className={cn(isFetching && "animate-spin")} />
        </Button>
      </DataTableToolbar>

      {isError ? (
        <ErrorState description="Não foi possível carregar os produtos." onRetry={() => refetch()} />
      ) : isLoading && products.length === 0 ? (
        <RowsSkeleton rows={6} />
      ) : products.length === 0 ? (
        empty
      ) : (
        <DataTableShell
          maxHeight="calc(100dvh - 14rem)"
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Produto</DataTableHeadCell>
                  <DataTableHeadCell className="hidden 2xl:table-cell">Estação</DataTableHeadCell>
                  <DataTableHeadCell align="right">Preço</DataTableHeadCell>
                  <DataTableHeadCell align="center" className="hidden 2xl:table-cell">Variações</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="center">Disponível</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={132} />
                </tr>
              </DataTableHead>
              <DataTableBody>
                {products.map((product, i) => {
                  const variant = defaultVariant(product);
                  return (
                    <DataTableRow key={product.id} index={i} onClick={() => openEdit(product.id)}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <Thumb product={product} size={40} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{product.nome}</p>
                            <p className="max-w-xs truncate text-caption text-muted-foreground">
                              <span className="2xl:hidden">{product.preparationStation?.nome ?? "Sem estação"} · {product.variants.filter((v) => v.status !== "ARCHIVED").length} var.</span>
                              {product.descricao ? <span className="hidden 2xl:inline">{product.descricao}</span> : null}
                            </p>
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell className="hidden 2xl:table-cell">{product.preparationStation ? <span className="text-muted-foreground">{product.preparationStation.nome}</span> : <span className="text-subtle-foreground">Sem estação</span>}</DataTableCell>
                      <DataTableCell num>
                        {variant ? (
                          <>
                            <span className="font-medium">{formatBRLCents(variant.priceCents)}</span>
                            {product.variants.length > 1 ? <span className="block text-caption text-subtle-foreground">{variant.nome}</span> : null}
                          </>
                        ) : (
                          <span className="text-subtle-foreground">—</span>
                        )}
                      </DataTableCell>
                      <DataTableCell align="center" className="hidden tnum 2xl:table-cell">{product.variants.filter((v) => v.status !== "ARCHIVED").length}</DataTableCell>
                      <DataTableCell>
                        <ProductStatusBadge status={product.status} />
                      </DataTableCell>
                      <DataTableCell align="center" stopPropagation>
                        <AvailabilitySwitch product={product} pending={setAvailability.isPending && setAvailability.variables?.productId === product.id} onToggle={(next) => toggleAvailability(product, next)} />
                      </DataTableCell>
                      <DataTableCell align="right" stopPropagation>
                        <div className="flex justify-end gap-0.5">{rowActions(product)}</div>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {products.map((product, i) => {
                const variant = defaultVariant(product);
                return (
                  <MobileCard
                    key={product.id}
                    index={i}
                    onClick={() => openEdit(product.id)}
                    leading={<Thumb product={product} size={64} />}
                    title={product.nome}
                    subtitle={`${product.preparationStation?.nome ?? "Sem estação"} · ${product.variants.filter((v) => v.status !== "ARCHIVED").length} ${product.variants.length === 1 ? "variação" : "variações"}`}
                    badge={<ProductStatusBadge status={product.status} />}
                    meta={[
                      { label: "Preço", value: variant ? formatBRLCents(variant.priceCents) : "—", num: true },
                      { label: "Variação", value: variant?.nome ?? "—" },
                    ]}
                    actions={
                      <>
                        <label className="mr-auto flex items-center gap-2 text-caption text-muted-foreground">
                          <AvailabilitySwitch product={product} pending={setAvailability.isPending && setAvailability.variables?.productId === product.id} onToggle={(next) => toggleAvailability(product, next)} />
                          Disponível
                        </label>
                        {rowActions(product)}
                      </>
                    }
                  />
                );
              })}
            </MobileCardList>
          }
          footer={pageCount > 1 || total > 0 ? <DataTablePagination page={page} lastPage={pageCount} total={total} perPage={PAGE_SIZE} noun="produtos" onPageChange={setPage} /> : undefined}
        />
      )}

      <ProdutoCreateDialog orgId={orgId} menuId={menuId} defaultCategoryId={defaultCategoryId} open={createOpen} onOpenChange={onCreateOpenChange} onCreated={(productId) => openEdit(productId, "geral")} onOpenBulk={onOpenBulk} />

      {editing ? <ProdutoEditSheet orgId={orgId} productId={editing.productId} initialSection={editing.section} open={editing !== null} onOpenChange={(v) => !v && setEditing(null)} /> : null}

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Arquivar produto"
        description={`Arquivar "${archiving?.nome}"? Ele some dos cardápios ativos, mas nada é excluído.`}
        confirmLabel="Arquivar"
        danger
        onConfirm={async () => {
          if (!archiving) return;
          try {
            await archive.mutateAsync(archiving.id);
            toast.success("Produto arquivado");
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível arquivar o produto."));
            throw err;
          }
        }}
      />
    </div>
  );
}
