"use client";

import { useState } from "react";
import { Archive, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import type { VenueInventoryItem } from "@/services/venue-stock";
import { useVenueStockCategories, useVenueStockItemMutations, useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useDebounce } from "../../cardapio/_hooks/use-debounce";
import { ItemFormDialog } from "./item-form-dialog";
import { ItemDetailSheet } from "./item-detail-sheet";
import { ArchivedBadge } from "./stock-status-badge";
import { CategoriesManagerDialog } from "./categories-manager-dialog";
import { ConfirmDialog } from "../../cardapio/_components/confirm-dialog";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

export function ItensTab({ orgId, locations }: { orgId: number; locations: VenueLocation[] }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueInventoryItem | null>(null);
  const [detail, setDetail] = useState<VenueInventoryItem | null>(null);
  const [archiving, setArchiving] = useState<VenueInventoryItem | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const { data: categories } = useVenueStockCategories(orgId);
  const { data, isLoading, isError, refetch } = useVenueStockItems(orgId, {
    search: debouncedSearch || undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
    status,
    limit: 100,
  });
  const { archive } = useVenueStockItemMutations(orgId);

  const list = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-black/30" size={16} />
            <Input className="pl-9" placeholder="Buscar item…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as "ACTIVE" | "ARCHIVED")}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativos</SelectItem>
              <SelectItem value="ARCHIVED">Arquivados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoriesOpen(true)}>Categorias</Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} /> Novo item
          </Button>
        </div>
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar os itens." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhum item de estoque ainda"
          description="Cadastre insumos e produtos para começar a controlar compras, consumo e saldo."
          actionLabel="Novo item"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-black/10 bg-white sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => setDetail(item)}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.category?.nome ?? "—"}</TableCell>
                    <TableCell className="text-xs">{item.internalCode ?? "—"}</TableCell>
                    <TableCell className="text-xs">{item.baseUnit}</TableCell>
                    <TableCell><ArchivedBadge archived={!!item.archivedAt} /></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditing(item); setFormOpen(true); }}>
                          Editar
                        </Button>
                        {!item.archivedAt ? (
                          <Button size="sm" variant="ghost" onClick={() => setArchiving(item)}>
                            <Archive size={14} />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-2 sm:hidden">
            {list.map((item) => (
              <div key={item.id} className="rounded-xl border border-black/10 bg-white p-3" onClick={() => setDetail(item)}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.nome}</span>
                  <ArchivedBadge archived={!!item.archivedAt} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-black/50">
                  <span>{item.category?.nome ?? "Sem categoria"}</span>
                  <span>{item.baseUnit}</span>
                  {item.internalCode ? <span>{item.internalCode}</span> : null}
                </div>
                <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(item); setFormOpen(true); }}>
                    Editar
                  </Button>
                  {!item.archivedAt ? (
                    <Button size="sm" variant="ghost" onClick={() => setArchiving(item)}>
                      <Archive size={14} /> Arquivar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ItemFormDialog
        orgId={orgId}
        locations={locations}
        categories={categories ?? []}
        item={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
      <ItemDetailSheet orgId={orgId} item={detail} open={detail !== null} onOpenChange={(v) => !v && setDetail(null)} />
      <CategoriesManagerDialog orgId={orgId} open={categoriesOpen} onOpenChange={setCategoriesOpen} />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Arquivar item"
        description={`"${archiving?.nome}" não poderá mais receber compras ou movimentações manuais. O histórico continua acessível.`}
        confirmLabel="Arquivar"
        loading={archive.isPending}
        onConfirm={() =>
          archiving &&
          archive.mutate(archiving.id, {
            onSuccess: () => {
              toast.success("Item arquivado.");
              setArchiving(null);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar.")),
          })
        }
      />
    </div>
  );
}
