"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getErrorMessage } from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "@/lib/toast";
import {
  centsToBRL,
  VENUE_PRODUCT_STATUS_LABEL,
  type VenueProduct,
  type VenueProductStatus,
} from "@/services/venue-menu";
import { useVenueProductMutations, useVenueProducts } from "../_hooks/use-venue-products";
import { useVenueStations } from "../_hooks/use-venue-stations";
import { useDebounce } from "../_hooks/use-debounce";
import { ProductStatusBadge } from "./venue-status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import { ProdutoCreateDialog } from "./produto-create-dialog";
import { ProdutoEditSheet, type ProdutoEditSection } from "./produto-edit-sheet";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

const PAGE_SIZE = 20;

function defaultVariant(product: VenueProduct) {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0] ?? null;
}

function ProductActionsMenu({
  product,
  onEdit,
  onManageVariants,
  onManageMenus,
  onManageModifiers,
  onArchive,
}: {
  product: VenueProduct;
  onEdit: () => void;
  onManageVariants: () => void;
  onManageMenus: () => void;
  onManageModifiers: () => void;
  onArchive: () => void;
}) {
  const { setAvailability } = useVenueProductMutations(product.organizationId);
  const archived = product.status === "ARCHIVED";

  const toggleSoldOut = () => {
    const next: VenueProductStatus = product.status === "SOLD_OUT" ? "ACTIVE" : "SOLD_OUT";
    setAvailability.mutate(
      { productId: product.id, status: next },
      {
        onSuccess: () =>
          toast.success(next === "SOLD_OUT" ? "Produto marcado como esgotado." : "Produto reativado."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a disponibilidade.")),
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ações do produto">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={onManageVariants}>Gerenciar variações</DropdownMenuItem>
        <DropdownMenuItem onClick={onManageModifiers}>Gerenciar adicionais</DropdownMenuItem>
        <DropdownMenuItem onClick={onManageMenus}>Adicionar/remover de cardápios</DropdownMenuItem>
        {!archived ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleSoldOut}>
              {product.status === "SOLD_OUT" ? "Reativar" : "Marcar como esgotado"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onArchive} className="text-red-600">
              Arquivar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProdutosTab({
  orgId,
  createOpen,
  onCreateOpenChange,
}: {
  orgId: number;
  createOpen: boolean;
  onCreateOpenChange: (v: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState<VenueProductStatus | "ALL">("ALL");
  const [stationId, setStationId] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<{ productId: number; section: ProdutoEditSection } | null>(null);
  const [archiving, setArchiving] = useState<VenueProduct | null>(null);

  const { data: stations } = useVenueStations(orgId);
  const { data, isLoading, isError, refetch } = useVenueProducts(orgId, {
    search: debouncedSearch || undefined,
    status: status === "ALL" ? undefined : status,
    preparationStationId: stationId === "ALL" ? undefined : Number(stationId),
    page,
    limit: PAGE_SIZE,
  });
  const { archive } = useVenueProductMutations(orgId);

  const products = data?.data ?? [];
  const total = data?.paginate.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openEdit = (productId: number, section: ProdutoEditSection = "geral") =>
    setEditing({ productId, section });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-black/40" size={16} />
            <Input
              className="pl-9"
              placeholder="Buscar por nome…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => { setStatus(v as VenueProductStatus | "ALL"); setPage(1); }}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(VENUE_PRODUCT_STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stationId} onValueChange={(v) => { setStationId(v); setPage(1); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Estação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as estações</SelectItem>
              {(stations ?? []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar os produtos." onRetry={() => refetch()} />
      ) : isLoading && products.length === 0 ? (
        <TableSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          title="Nenhum produto ainda"
          description="Cadastre seu primeiro produto para começar a montar o cardápio."
          actionLabel="Novo produto"
          onAction={() => onCreateOpenChange(true)}
        />
      ) : (
        <>
          {/* Desktop: tabela */}
          <div className="hidden overflow-hidden rounded-xl border border-black/10 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-black/5 bg-black/[0.02] text-left text-xs text-black/50">
                <tr>
                  <th className="px-4 py-2 font-medium">Produto</th>
                  <th className="px-4 py-2 font-medium">Estação</th>
                  <th className="px-4 py-2 font-medium">Variação principal</th>
                  <th className="px-4 py-2 font-medium">Preço</th>
                  <th className="px-4 py-2 font-medium">Variações</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {products.map((product) => {
                  const variant = defaultVariant(product);
                  return (
                    <tr key={product.id} className="hover:bg-black/[0.015]">
                      <td className="flex items-center gap-3 px-4 py-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/5">
                          {product.imageUrl ? (
                            <Image
                              src={resolveMediaUrl(product.imageUrl) ?? "/logo.png"}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <button
                          className="max-w-[220px] truncate text-left font-medium text-gray-900 hover:underline"
                          onClick={() => openEdit(product.id)}
                        >
                          {product.nome}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-black/70">{product.preparationStation?.nome ?? "—"}</td>
                      <td className="px-4 py-3 text-black/70">{variant?.nome ?? "—"}</td>
                      <td className="px-4 py-3 text-black/70">
                        {variant ? centsToBRL(variant.priceCents) : "—"}
                      </td>
                      <td className="px-4 py-3 text-black/70">{product.variants.length}</td>
                      <td className="px-4 py-3"><ProductStatusBadge status={product.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <ProductActionsMenu
                          product={product}
                          onEdit={() => openEdit(product.id, "geral")}
                          onManageVariants={() => openEdit(product.id, "variantes")}
                          onManageMenus={() => openEdit(product.id, "cardapios")}
                          onManageModifiers={() => openEdit(product.id, "adicionais")}
                          onArchive={() => setArchiving(product)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {products.map((product) => {
              const variant = defaultVariant(product);
              return (
                <div key={product.id} className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/5">
                      {product.imageUrl ? (
                        <Image
                          src={resolveMediaUrl(product.imageUrl) ?? "/logo.png"}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        className="truncate text-left font-medium text-gray-900"
                        onClick={() => openEdit(product.id)}
                      >
                        {product.nome}
                      </button>
                      <p className="text-xs text-black/50">
                        {product.preparationStation?.nome ?? "Sem estação"} · {product.variants.length} variações
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {variant ? centsToBRL(variant.priceCents) : "—"}
                        </span>
                        <ProductStatusBadge status={product.status} />
                      </div>
                    </div>
                    <ProductActionsMenu
                      product={product}
                      onEdit={() => openEdit(product.id, "geral")}
                      onManageVariants={() => openEdit(product.id, "variantes")}
                      onManageMenus={() => openEdit(product.id, "cardapios")}
                      onManageModifiers={() => openEdit(product.id, "adicionais")}
                      onArchive={() => setArchiving(product)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/50">
                Página {page} de {pageCount} · {total} produtos
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <ProdutoCreateDialog
        orgId={orgId}
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        onCreated={(productId) => openEdit(productId, "geral")}
      />

      {editing ? (
        <ProdutoEditSheet
          orgId={orgId}
          productId={editing.productId}
          initialSection={editing.section}
          open={editing !== null}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Arquivar produto"
        description={`Tem certeza que deseja arquivar "${archiving?.nome}"? Ele deixa de aparecer nos cardápios ativos, mas nada é excluído.`}
        confirmLabel="Arquivar"
        loading={archive.isPending}
        onConfirm={() => {
          if (!archiving) return;
          archive.mutate(archiving.id, {
            onSuccess: () => { toast.success("Produto arquivado."); setArchiving(null); },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar o produto.")),
          });
        }}
      />
    </div>
  );
}
