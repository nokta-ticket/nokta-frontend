"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueCategoryMutations } from "../_hooks/use-venue-categories";

interface DraftRow {
  key: string;
  nome: string;
}

let rowKeySeq = 0;
function newRow(): DraftRow {
  rowKeySeq += 1;
  return { key: `row-${rowKeySeq}`, nome: "" };
}

/**
 * Cadastro em massa de categorias — mesmo padrão do ProdutoBulkCreateDialog
 * (uma linha por categoria, erros voltam destacados por linha, o modal
 * continua aberto só com as que falharam). Bem mais simples que o de
 * produtos: só o nome é obrigatório aqui.
 */
export function CategoriaBulkCreateDialog({
  orgId,
  menuId,
  open,
  onOpenChange,
  onCreated,
}: {
  orgId: number;
  menuId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const { createBulk } = useVenueCategoryMutations(orgId, menuId ?? -1);

  const [rows, setRows] = useState<DraftRow[]>(() => [newRow(), newRow(), newRow()]);
  const [rowErrors, setRowErrors] = useState<Map<string, string>>(new Map());

  const reset = () => {
    setRows([newRow(), newRow(), newRow()]);
    setRowErrors(new Map());
  };

  const updateRow = (key: string, nome: string) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, nome } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, newRow()]);

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleSave = () => {
    if (!menuId) return;
    const nonEmptyRows = rows.filter((r) => r.nome.trim());
    if (nonEmptyRows.length === 0) {
      toast.error("Preencha ao menos uma categoria.");
      return;
    }

    createBulk.mutate(
      nonEmptyRows.map((r) => ({ nome: r.nome.trim() })),
      {
        onSuccess: (result) => {
          const errorsByIndex = new Map(result.errors.map((e) => [e.index, e.message]));
          const nextErrors = new Map<string, string>();
          const remainingRows: DraftRow[] = [];

          nonEmptyRows.forEach((row, index) => {
            const message = errorsByIndex.get(index);
            if (message) {
              nextErrors.set(row.key, message);
              remainingRows.push(row);
            }
          });

          if (result.created.length > 0) {
            toast.success(
              result.errors.length > 0
                ? `${result.created.length} categoria(s) criada(s). ${result.errors.length} com erro.`
                : `${result.created.length} categoria(s) criada(s).`,
            );
          }

          if (nextErrors.size === 0) {
            reset();
            onOpenChange(false);
            onCreated();
            return;
          }

          setRows(remainingRows.length > 0 ? remainingRows : [newRow()]);
          setRowErrors(nextErrors);
          onCreated();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar as categorias.")),
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar várias categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {rows.map((row) => {
            const error = rowErrors.get(row.key);
            return (
              <div key={row.key} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    value={row.nome}
                    onChange={(e) => updateRow(row.key, e.target.value)}
                    placeholder="Ex.: Cervejas, Drinks, Porções"
                    className={error ? "border-red-400" : ""}
                  />
                  {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover linha"
                  disabled={rows.length === 1}
                  onClick={() => removeRow(row.key)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" onClick={addRow} className="w-fit">
          <Plus size={14} /> Adicionar linha
        </Button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createBulk.isPending}>
            Cancelar
          </Button>
          <Button disabled={createBulk.isPending || !menuId} onClick={handleSave}>
            {createBulk.isPending ? "Salvando…" : "Salvar todas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
