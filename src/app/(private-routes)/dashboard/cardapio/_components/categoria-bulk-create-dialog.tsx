"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
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
 * Cadastro em massa de categorias — uma linha por categoria; erros voltam
 * destacados por linha e o modal continua aberto só com as que falharam.
 */
export function CategoriaBulkCreateDialog({ orgId, menuId, open, onOpenChange, onCreated }: { orgId: number; menuId: number | null; open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const { createBulk } = useVenueCategoryMutations(orgId, menuId ?? -1);
  const [rows, setRows] = useState<DraftRow[]>(() => [newRow(), newRow(), newRow()]);
  const [rowErrors, setRowErrors] = useState<Map<string, string>>(new Map());

  const reset = () => {
    setRows([newRow(), newRow(), newRow()]);
    setRowErrors(new Map());
  };
  const updateRow = (key: string, nome: string) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, nome } : r)));
  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

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
          if (result.created.length > 0) toast.success(result.errors.length > 0 ? `${result.created.length} criada(s). ${result.errors.length} com erro.` : `${result.created.length} categoria(s) criada(s)`);
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Várias categorias de uma vez</DialogTitle>
          <DialogDescription>Uma por linha. Dá pra ajustar descrição e imagem depois.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-3">
          {rows.map((row, i) => {
            const error = rowErrors.get(row.key);
            return (
              <div key={row.key} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input value={row.nome} onChange={(e) => updateRow(row.key, e.target.value)} placeholder={["Cervejas", "Drinks", "Porções", "Sobremesas"][i % 4]} aria-invalid={Boolean(error) || undefined} aria-label={`Categoria ${i + 1}`} onKeyDown={(e) => { if (e.key === "Enter" && i === rows.length - 1) addRow(); }} />
                  {error ? <p role="alert" className="mt-1 text-caption text-danger">{error}</p> : null}
                </div>
                <Button variant="subtle" size="icon" aria-label="Remover linha" disabled={rows.length === 1} onClick={() => removeRow(row.key)}>
                  <Icon name="close" size={13} />
                </Button>
              </div>
            );
          })}
          <Button variant="outline" size="sm" leftIcon="plus" onClick={addRow} className="w-fit">
            Mais uma linha
          </Button>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createBulk.isPending}>
            Cancelar
          </Button>
          <Button loading={createBulk.isPending} disabled={!menuId} onClick={handleSave}>
            Salvar todas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
