"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { VENUE_PRODUCT_STATUS_LABEL, type VenueProductStatus } from "@/services/venue-menu";
import { useVenueMenuItemMutations } from "../_hooks/use-venue-menu-items";
import { useVenueCategories, useVenueCategoryMutations } from "../_hooks/use-venue-categories";
import { useVenueStations } from "../_hooks/use-venue-stations";
import { MoneyField } from "./money-field";
import { CategoryCombobox } from "./category-combobox";

const NO_STATION = "NONE";
const BULK_STATUSES: VenueProductStatus[] = ["ACTIVE", "INACTIVE", "SOLD_OUT"];

interface DraftRow {
  key: string;
  nome: string;
  categoryId: number | null;
  priceCents: number;
  stationId: string;
  status: VenueProductStatus;
}

let rowKeySeq = 0;
function newRow(defaultCategoryId: number | null): DraftRow {
  rowKeySeq += 1;
  return { key: `row-${rowKeySeq}`, nome: "", categoryId: defaultCategoryId, priceCents: 0, stationId: NO_STATION, status: "ACTIVE" };
}

/**
 * Cadastro em massa: cada linha é um produto completo. Toda linha nova já
 * nasce com a categoria padrão. Linhas com erro voltam destacadas depois de
 * salvar; o modal continua aberto só com elas, sem perder o que já entrou.
 * Desktop: grade; celular: um card por linha.
 */
export function ProdutoBulkCreateDialog({ orgId, menuId, defaultCategoryId, open, onOpenChange, onCreated }: { orgId: number; menuId: number | null; defaultCategoryId: number | null; open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const { data: categories } = useVenueCategories(orgId, menuId);
  const { data: stations } = useVenueStations(orgId);
  const { createBulk } = useVenueMenuItemMutations(orgId, menuId ?? -1);
  const { create: createCategory } = useVenueCategoryMutations(orgId, menuId ?? -1);

  const [rows, setRows] = useState<DraftRow[]>(() => [newRow(defaultCategoryId)]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (defaultCategoryId === null) return;
    setRows((prev) => prev.map((r) => (r.categoryId === null ? { ...r, categoryId: defaultCategoryId } : r)));
  }, [defaultCategoryId]);

  const reset = () => {
    setRows([newRow(defaultCategoryId)]);
    setSelected(new Set());
    setRowErrors(new Map());
  };
  const updateRow = (key: string, patch: Partial<DraftRow>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, newRow(defaultCategoryId)]);
  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };
  const toggleSelected = (key: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  const applyCategoryToSelected = (categoryId: number) => setRows((prev) => prev.map((r) => (selected.has(r.key) ? { ...r, categoryId } : r)));

  const createCategoryFor = (nome: string, apply: (id: number) => void) => {
    createCategory.mutate(
      { nome },
      {
        onSuccess: (category) => {
          toast.success(`Categoria "${category.nome}" criada`);
          apply(category.id);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a categoria.")),
      },
    );
  };

  const handleSave = () => {
    if (!menuId) return;
    createBulk.mutate(
      rows.map((r) => ({ nome: r.nome.trim() || undefined, priceCents: r.priceCents, categoryId: r.categoryId ?? undefined, preparationStationId: r.stationId === NO_STATION ? undefined : Number(r.stationId), status: r.status })),
      {
        onSuccess: (result) => {
          const errorsByIndex = new Map(result.errors.map((e) => [e.index, e.message]));
          const nextErrors = new Map<string, string>();
          const remainingRows: DraftRow[] = [];
          rows.forEach((row, index) => {
            const message = errorsByIndex.get(index);
            if (message) {
              nextErrors.set(row.key, message);
              remainingRows.push(row);
            }
          });
          if (result.created.length > 0) toast.success(result.errors.length > 0 ? `${result.created.length} produto(s) criado(s). ${result.errors.length} linha(s) com erro.` : `${result.created.length} produto(s) criado(s)`);
          if (nextErrors.size === 0) {
            reset();
            onOpenChange(false);
            onCreated();
            return;
          }
          setRows(remainingRows.length > 0 ? remainingRows : [newRow(defaultCategoryId)]);
          setRowErrors(nextErrors);
          setSelected(new Set());
          onCreated();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar os produtos.")),
      },
    );
  };

  const stationSelect = (row: DraftRow) => (
    <NativeSelect aria-label="Estação" value={row.stationId} onChange={(e) => updateRow(row.key, { stationId: e.target.value })}>
      <option value={NO_STATION}>Sem estação</option>
      {(stations ?? []).map((s) => (
        <option key={s.id} value={s.id}>
          {s.nome}
        </option>
      ))}
    </NativeSelect>
  );
  const statusSelect = (row: DraftRow) => (
    <NativeSelect aria-label="Disponibilidade" value={row.status} onChange={(e) => updateRow(row.key, { status: e.target.value as VenueProductStatus })}>
      {BULK_STATUSES.map((status) => (
        <option key={status} value={status}>
          {VENUE_PRODUCT_STATUS_LABEL[status]}
        </option>
      ))}
    </NativeSelect>
  );
  const categoryCombo = (row: DraftRow) => <CategoryCombobox categories={categories ?? []} value={row.categoryId} onSelectExisting={(categoryId) => updateRow(row.key, { categoryId })} onCreateNew={(nome) => createCategoryFor(nome, (id) => updateRow(row.key, { categoryId: id }))} disabled={createCategory.isPending} placeholder="Categoria" />;
  const checkbox = (row: DraftRow) => <input type="checkbox" className="size-4 shrink-0 accent-brand" checked={selected.has(row.key)} onChange={(e) => toggleSelected(row.key, e.target.checked)} aria-label="Selecionar linha" />;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Vários produtos de uma vez</DialogTitle>
          <DialogDescription>Uma linha por produto. Selecione linhas pra aplicar a mesma categoria em todas.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm">
              <span className="font-medium text-brand tnum">{selected.size} selecionada(s)</span>
              <div className="w-full sm:ml-auto sm:w-64">
                <CategoryCombobox categories={categories ?? []} value={null} onSelectExisting={applyCategoryToSelected} onCreateNew={(nome) => createCategoryFor(nome, applyCategoryToSelected)} disabled={createCategory.isPending} placeholder="Aplicar categoria…" />
              </div>
            </div>
          ) : null}

          {/* Desktop: grade */}
          <div className="hidden overflow-hidden rounded-card border border-border md:block">
            <table className="w-full text-sm">
              <thead className="thead-hairline bg-surface-2/60 text-left">
                <tr>
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-2 py-2.5 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Produto</th>
                  <th className="px-2 py-2.5 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Categoria</th>
                  <th className="w-36 px-2 py-2.5 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Preço</th>
                  <th className="w-40 px-2 py-2.5 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Estação</th>
                  <th className="w-36 px-2 py-2.5 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Disponível</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const error = rowErrors.get(row.key);
                  return (
                    <tr key={row.key} className={cn("border-t border-border align-top", error && "bg-danger-bg")}>
                      <td className="px-3 py-2 pt-4">{checkbox(row)}</td>
                      <td className="min-w-44 px-2 py-2">
                        <Input value={row.nome} onChange={(e) => updateRow(row.key, { nome: e.target.value })} placeholder="Nome do produto" aria-invalid={Boolean(error) || undefined} />
                        {error ? <p role="alert" className="mt-1 text-caption text-danger">{error}</p> : null}
                      </td>
                      <td className="min-w-44 px-2 py-2">{categoryCombo(row)}</td>
                      <td className="px-2 py-2"><MoneyField cents={row.priceCents} onChange={(cents) => updateRow(row.key, { priceCents: cents })} /></td>
                      <td className="px-2 py-2">{stationSelect(row)}</td>
                      <td className="px-2 py-2">{statusSelect(row)}</td>
                      <td className="px-2 py-2">
                        <Button variant="subtle" size="icon" aria-label="Remover linha" disabled={rows.length === 1} onClick={() => removeRow(row.key)}>
                          <Icon name="close" size={13} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Celular: um card por linha */}
          <div className="space-y-3 md:hidden">
            {rows.map((row, i) => {
              const error = rowErrors.get(row.key);
              return (
                <div key={row.key} className={cn("space-y-3 rounded-card border border-border bg-surface p-3", error && "border-danger-ring bg-danger-bg")}>
                  <div className="flex items-center gap-3">
                    {checkbox(row)}
                    <span className="text-caption font-medium text-muted-foreground tnum">Produto {i + 1}</span>
                    <Button variant="subtle" size="icon-sm" className="ml-auto" aria-label="Remover linha" disabled={rows.length === 1} onClick={() => removeRow(row.key)}>
                      <Icon name="close" size={13} />
                    </Button>
                  </div>
                  <Input value={row.nome} onChange={(e) => updateRow(row.key, { nome: e.target.value })} placeholder="Nome do produto" aria-invalid={Boolean(error) || undefined} />
                  {error ? <p role="alert" className="text-caption text-danger">{error}</p> : null}
                  {categoryCombo(row)}
                  <div className="grid grid-cols-2 gap-2">
                    <MoneyField cents={row.priceCents} onChange={(cents) => updateRow(row.key, { priceCents: cents })} />
                    {statusSelect(row)}
                  </div>
                  {stationSelect(row)}
                </div>
              );
            })}
          </div>

          <Button variant="outline" size="sm" leftIcon="plus" onClick={addRow} className="w-fit">
            Mais uma linha
          </Button>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createBulk.isPending}>
            Cancelar
          </Button>
          <Button loading={createBulk.isPending} disabled={!menuId} onClick={handleSave}>
            Salvar todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
