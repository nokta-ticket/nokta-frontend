"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import {
  VENUE_INVENTORY_UNIT_LABEL,
  type CreateVenuePurchaseItemPayload,
  type VenueInventoryItem,
  type VenueSupplier,
} from "@/services/venue-stock";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockPurchaseMutations } from "../_hooks/use-venue-stock-purchases";
import { MoneyField } from "../../cardapio/_components/money-field";

type DraftItem = {
  key: string;
  inventoryItemId: number | null;
  mode: "package" | "base";
  packageQuantity: string;
  packageSizeBase: string;
  quantityBase: string;
  totalCostCents: number;
};

function emptyDraftItem(): DraftItem {
  return {
    key: Math.random().toString(36).slice(2),
    inventoryItemId: null,
    mode: "base",
    packageQuantity: "",
    packageSizeBase: "",
    quantityBase: "",
    totalCostCents: 0,
  };
}

export function PurchaseFormDialog({
  orgId,
  locationId,
  suppliers,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  suppliers: VenueSupplier[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: itemsData } = useVenueStockItems(orgId, { status: "ACTIVE", limit: 200 });
  const items = itemsData?.data ?? [];
  const { create } = useVenueStockPurchaseMutations(orgId, locationId);

  const [supplierId, setSupplierId] = useState<string>("none");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([emptyDraftItem()]);

  useEffect(() => {
    if (!open) return;
    setSupplierId("none");
    setDocumentNumber("");
    setNotes("");
    setDraftItems([emptyDraftItem()]);
  }, [open]);

  const findItem = (id: number | null): VenueInventoryItem | undefined => items.find((i) => i.id === id);

  const updateItem = (key: string, patch: Partial<DraftItem>) =>
    setDraftItems((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const totalCents = draftItems.reduce((sum, d) => sum + d.totalCostCents, 0);

  const handleSubmit = () => {
    if (draftItems.length === 0 || draftItems.some((d) => !d.inventoryItemId)) {
      toast.error("Selecione o item em todas as linhas.");
      return;
    }

    const payloadItems: CreateVenuePurchaseItemPayload[] = draftItems.map((d) => ({
      inventoryItemId: d.inventoryItemId as number,
      packageQuantity: d.mode === "package" ? d.packageQuantity || undefined : undefined,
      packageSizeBase: d.mode === "package" ? d.packageSizeBase || undefined : undefined,
      quantityBase: d.mode === "base" ? d.quantityBase || undefined : undefined,
      totalCostCents: d.totalCostCents,
    }));

    create
      .mutateAsync({
        supplierId: supplierId !== "none" ? Number(supplierId) : undefined,
        documentNumber: documentNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: payloadItems,
      })
      .then(() => {
        toast.success("Compra criada como rascunho. Revise e receba quando os itens chegarem.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível criar a compra.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar compra</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fornecedor (opcional)</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem fornecedor</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-doc">Nº do documento (opcional)</Label>
              <Input id="purchase-doc" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Itens da compra</Label>
              <Button size="sm" variant="outline" onClick={() => setDraftItems((prev) => [...prev, emptyDraftItem()])}>
                <Plus size={14} /> Adicionar item
              </Button>
            </div>

            {draftItems.map((d) => {
              const item = findItem(d.inventoryItemId);
              const unitLabel = item ? VENUE_INVENTORY_UNIT_LABEL[item.baseUnit] : "";
              return (
                <div key={d.key} className="space-y-2 rounded-lg border border-black/10 p-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={d.inventoryItemId ? String(d.inventoryItemId) : undefined}
                      onValueChange={(v) => updateItem(d.key, { inventoryItemId: Number(v) })}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione o item" /></SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)}>{i.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDraftItems((prev) => prev.filter((x) => x.key !== d.key))}
                      disabled={draftItems.length === 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  {item ? (
                    <>
                      <div className="flex gap-2 text-xs">
                        <button
                          className={`rounded-full px-2 py-1 ${d.mode === "base" ? "bg-black text-white" : "bg-black/5"}`}
                          onClick={() => updateItem(d.key, { mode: "base" })}
                        >
                          Direto na unidade-base ({unitLabel})
                        </button>
                        <button
                          className={`rounded-full px-2 py-1 ${d.mode === "package" ? "bg-black text-white" : "bg-black/5"}`}
                          onClick={() => updateItem(d.key, { mode: "package" })}
                        >
                          Embalagem/pacote
                        </button>
                      </div>

                      {d.mode === "base" ? (
                        <Input
                          inputMode="decimal"
                          placeholder={`Quantidade em ${unitLabel.toLowerCase()}`}
                          value={d.quantityBase}
                          onChange={(e) => updateItem(d.key, { quantityBase: e.target.value.replace(",", ".") })}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            inputMode="decimal"
                            placeholder="Qtd. de embalagens (ex.: 2 caixas)"
                            value={d.packageQuantity}
                            onChange={(e) => updateItem(d.key, { packageQuantity: e.target.value.replace(",", ".") })}
                          />
                          <Input
                            inputMode="decimal"
                            placeholder={`Tamanho da embalagem em ${unitLabel.toLowerCase()} (ex.: 12, 1000, 2500)`}
                            value={d.packageSizeBase}
                            onChange={(e) => updateItem(d.key, { packageSizeBase: e.target.value.replace(",", ".") })}
                          />
                        </div>
                      )}
                    </>
                  ) : null}

                  <MoneyField
                    label="Custo total desta linha"
                    cents={d.totalCostCents}
                    onChange={(cents) => updateItem(d.key, { totalCostCents: cents })}
                  />
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-notes">Observações (opcional)</Label>
            <Textarea id="purchase-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end text-sm font-medium">
            Total: {(totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>Cancelar</Button>
          <Button disabled={create.isPending} onClick={handleSubmit}>
            {create.isPending ? "Salvando…" : "Salvar rascunho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
