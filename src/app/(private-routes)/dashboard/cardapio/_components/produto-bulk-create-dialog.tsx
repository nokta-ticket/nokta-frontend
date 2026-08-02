"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
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
  return {
    key: `row-${rowKeySeq}`,
    nome: "",
    categoryId: defaultCategoryId,
    priceCents: 0,
    stationId: NO_STATION,
    status: "ACTIVE",
  };
}

/**
 * Cadastro em massa: cada linha é um produto completo (nome, categoria,
 * preço, estação, disponibilidade). Toda linha nova já nasce com a
 * categoria padrão preenchida — nunca vazia (ver newRow). Linhas com erro
 * voltam destacadas depois de salvar; o modal continua aberto para
 * corrigir só elas, sem perder o que já foi criado com sucesso.
 */
export function ProdutoBulkCreateDialog({
  orgId,
  menuId,
  defaultCategoryId,
  open,
  onOpenChange,
  onCreated,
}: {
  orgId: number;
  menuId: number | null;
  defaultCategoryId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const { data: categories } = useVenueCategories(orgId, menuId);
  const { data: stations } = useVenueStations(orgId);
  const { createBulk } = useVenueMenuItemMutations(orgId, menuId ?? -1);
  const { create: createCategory } = useVenueCategoryMutations(orgId, menuId ?? -1);

  const [rows, setRows] = useState<DraftRow[]>(() => [newRow(defaultCategoryId)]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Map<string, string>>(new Map());

  // defaultCategoryId chega assíncrono (ensure-default/categorias resolvem
  // depois do primeiro render) — sem isso, abrir o modal rápido demais
  // deixaria a única linha inicial sem categoria preenchida, contrariando
  // o requisito de nunca mostrar a célula vazia.
  useEffect(() => {
    if (defaultCategoryId === null) return;
    setRows((prev) =>
      prev.map((r) => (r.categoryId === null ? { ...r, categoryId: defaultCategoryId } : r)),
    );
  }, [defaultCategoryId]);

  const reset = () => {
    setRows([newRow(defaultCategoryId)]);
    setSelected(new Set());
    setRowErrors(new Map());
  };

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, newRow(defaultCategoryId)]);

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const toggleSelected = (key: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const applyCategoryToSelected = (categoryId: number) => {
    setRows((prev) => prev.map((r) => (selected.has(r.key) ? { ...r, categoryId } : r)));
  };

  const handleCreateCategory = (nome: string, applyToSelectedRows: boolean) => {
    createCategory.mutate(
      { nome },
      {
        onSuccess: (category) => {
          toast.success(`Categoria "${category.nome}" criada.`);
          if (applyToSelectedRows && selected.size > 0) {
            applyCategoryToSelected(category.id);
          }
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a categoria.")),
      },
    );
  };

  const handleSave = () => {
    if (!menuId) return;
    createBulk.mutate(
      rows.map((r) => ({
        nome: r.nome.trim() || undefined,
        priceCents: r.priceCents,
        categoryId: r.categoryId ?? undefined,
        preparationStationId: r.stationId === NO_STATION ? undefined : Number(r.stationId),
        status: r.status,
      })),
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

          if (result.created.length > 0) {
            toast.success(
              result.errors.length > 0
                ? `${result.created.length} produto(s) criado(s). ${result.errors.length} linha(s) com erro.`
                : `${result.created.length} produto(s) criado(s).`,
            );
          }

          if (nextErrors.size === 0) {
            reset();
            onOpenChange(false);
            onCreated();
            return;
          }

          // Mantém o modal aberto só com as linhas que falharam, destacadas.
          setRows(remainingRows.length > 0 ? remainingRows : [newRow(defaultCategoryId)]);
          setRowErrors(nextErrors);
          setSelected(new Set());
          onCreated();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar os produtos.")),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Adicionar vários produtos</DialogTitle>
        </DialogHeader>

        {selected.size > 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm">
            <span className="text-violet-900">{selected.size} selecionada(s)</span>
            <div className="ml-auto w-56">
              <CategoryCombobox
                categories={categories ?? []}
                value={null}
                onSelectExisting={applyCategoryToSelected}
                onCreateNew={(nome) => handleCreateCategory(nome, true)}
                disabled={createCategory.isPending}
              />
            </div>
            <span className="text-xs text-violet-700">aplicar categoria</span>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.02] text-left text-xs text-black/50">
              <tr>
                <th className="w-8 px-2 py-2"></th>
                <th className="px-2 py-2 font-medium">Produto</th>
                <th className="px-2 py-2 font-medium">Categoria</th>
                <th className="px-2 py-2 font-medium">Preço</th>
                <th className="px-2 py-2 font-medium">Estação</th>
                <th className="px-2 py-2 font-medium">Disponibilidade</th>
                <th className="w-8 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((row) => {
                const error = rowErrors.get(row.key);
                return (
                  <tr key={row.key} className={error ? "bg-red-50" : ""}>
                    <td className="px-2 py-2 align-top">
                      <Checkbox
                        checked={selected.has(row.key)}
                        onCheckedChange={(checked) => toggleSelected(row.key, checked === true)}
                        aria-label="Selecionar linha"
                      />
                    </td>
                    <td className="min-w-[180px] px-2 py-2 align-top">
                      <Input
                        value={row.nome}
                        onChange={(e) => updateRow(row.key, { nome: e.target.value })}
                        placeholder="Nome do produto"
                        className={error ? "border-red-400" : ""}
                      />
                      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
                    </td>
                    <td className="min-w-[180px] px-2 py-2 align-top">
                      <CategoryCombobox
                        categories={categories ?? []}
                        value={row.categoryId}
                        onSelectExisting={(categoryId) => updateRow(row.key, { categoryId })}
                        onCreateNew={(nome) => {
                          createCategory.mutate(
                            { nome },
                            {
                              onSuccess: (category) => {
                                toast.success(`Categoria "${category.nome}" criada.`);
                                updateRow(row.key, { categoryId: category.id });
                              },
                              onError: (err) =>
                                toast.error(getErrorMessage(err, "Não foi possível criar a categoria.")),
                            },
                          );
                        }}
                      />
                    </td>
                    <td className="min-w-[140px] px-2 py-2 align-top">
                      <MoneyField
                        cents={row.priceCents}
                        onChange={(cents) => updateRow(row.key, { priceCents: cents })}
                      />
                    </td>
                    <td className="min-w-[160px] px-2 py-2 align-top">
                      <Select value={row.stationId} onValueChange={(v) => updateRow(row.key, { stationId: v })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_STATION}>Sem estação</SelectItem>
                          {(stations ?? []).map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="min-w-[140px] px-2 py-2 align-top">
                      <Select
                        value={row.status}
                        onValueChange={(v) => updateRow(row.key, { status: v as VenueProductStatus })}
                      >
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BULK_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {VENUE_PRODUCT_STATUS_LABEL[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remover linha"
                        disabled={rows.length === 1}
                        onClick={() => removeRow(row.key)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" onClick={addRow} className="w-fit">
          <Plus size={14} /> Adicionar linha
        </Button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createBulk.isPending}>
            Cancelar
          </Button>
          <Button disabled={createBulk.isPending || !menuId} onClick={handleSave}>
            {createBulk.isPending ? "Salvando…" : "Salvar todos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
