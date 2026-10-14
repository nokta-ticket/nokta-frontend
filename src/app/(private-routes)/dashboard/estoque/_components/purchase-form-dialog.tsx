"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { formatStockQuantity, type CreateVenuePurchaseItemPayload, type VenueInventoryItem, type VenueSupplier } from "@/services/venue-stock";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockPurchaseMutations } from "../_hooks/use-venue-stock-purchases";
import { QuantityField } from "./quantity-field";
import { UNIT_SHORT } from "./stock-primitives";
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

/** Quantidade final na unidade-base de uma linha (0 quando incompleta). */
function lineQuantityBase(d: DraftItem): number {
  if (d.mode === "base") return Number(d.quantityBase) || 0;
  return (Number(d.packageQuantity) || 0) * (Number(d.packageSizeBase) || 0);
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

  const updateItem = (key: string, patch: Partial<DraftItem>) => setDraftItems((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));

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
        toast.success("Compra salva como rascunho. Receba quando os itens chegarem.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível criar a compra.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Registrar compra</DialogTitle>
          <DialogDescription>Entra como rascunho. O estoque e o custo médio só mudam quando você marcar a compra como recebida.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <FieldGroup columns={2}>
            <Field label="Fornecedor" htmlFor="purchase-supplier" optional>
              <NativeSelect id="purchase-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="none">Sem fornecedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.nome}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Nº do documento" htmlFor="purchase-doc" optional>
              <Input id="purchase-doc" leftIcon="receipt" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="NF, pedido ou cupom" />
            </Field>
          </FieldGroup>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">Itens da compra</h4>
              <Button size="sm" variant="outline" leftIcon="plus" onClick={() => setDraftItems((prev) => [...prev, emptyDraftItem()])}>
                Adicionar item
              </Button>
            </div>

            {draftItems.map((d, index) => {
              const item = findItem(d.inventoryItemId);
              const unit = item ? UNIT_SHORT[item.baseUnit] : "";
              const qty = lineQuantityBase(d);
              const unitCost = item && qty > 0 && d.totalCostCents > 0 ? d.totalCostCents / qty : null;
              return (
                <div key={d.key} className="surface-inset space-y-3 rounded-xl p-4">
                  <div className="flex items-end gap-2">
                    <Field label={`Item ${index + 1}`} htmlFor={`purchase-item-${d.key}`} className="min-w-0 flex-1">
                      <NativeSelect id={`purchase-item-${d.key}`} value={d.inventoryItemId ? String(d.inventoryItemId) : ""} onChange={(e) => updateItem(d.key, { inventoryItemId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Selecione o item</option>
                        {items.map((i) => (
                          <option key={i.id} value={String(i.id)}>
                            {i.nome}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Button
                      size="icon"
                      variant="subtle"
                      aria-label="Remover linha"
                      title={draftItems.length === 1 ? "A compra precisa de ao menos um item" : "Remover linha"}
                      className="mb-px shrink-0 hover:bg-danger-bg hover:text-danger disabled:opacity-40"
                      disabled={draftItems.length === 1}
                      onClick={() => setDraftItems((prev) => prev.filter((x) => x.key !== d.key))}
                    >
                      <Icon name="trash" size={14} />
                    </Button>
                  </div>

                  {item ? (
                    <>
                      <SegmentedControl
                        size="sm"
                        fullWidth
                        value={d.mode}
                        onChange={(mode) => updateItem(d.key, { mode })}
                        options={[
                          { value: "base", label: `Direto em ${unit}` },
                          { value: "package", label: "Por embalagem" },
                        ]}
                      />
                      {d.mode === "base" ? (
                        <QuantityField id={`purchase-qty-${d.key}`} label="Quantidade" value={d.quantityBase} onChange={(v) => updateItem(d.key, { quantityBase: v })} suffix={unit} />
                      ) : (
                        <FieldGroup columns={2}>
                          <QuantityField id={`purchase-pkg-${d.key}`} label="Embalagens" value={d.packageQuantity} onChange={(v) => updateItem(d.key, { packageQuantity: v })} placeholder="Ex.: 2" suffix="cx" />
                          <QuantityField id={`purchase-size-${d.key}`} label="Tamanho de cada" value={d.packageSizeBase} onChange={(v) => updateItem(d.key, { packageSizeBase: v })} placeholder="Ex.: 12" suffix={unit} />
                        </FieldGroup>
                      )}
                    </>
                  ) : null}

                  <MoneyField id={`purchase-cost-${d.key}`} label="Custo total da linha" cents={d.totalCostCents} onChange={(cents) => updateItem(d.key, { totalCostCents: cents })} />

                  {item && qty > 0 ? (
                    <p className="text-caption text-muted-foreground tnum">
                      Entra {formatStockQuantity(qty, item.baseUnit)}
                      {unitCost !== null ? ` · ${formatBRLCents(unitCost)} por ${unit}` : ""}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </section>

          <Field label="Observações" htmlFor="purchase-notes" optional>
            <Textarea id="purchase-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="min-h-20" placeholder="Ex.: entrega combinada pra quinta" />
          </Field>

          <div className="surface-inset flex items-center justify-between gap-3 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Total da compra</span>
            <span className="text-lg font-semibold tnum text-foreground">{formatBRLCents(totalCents)}</span>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={create.isPending} leftIcon="save">
            Salvar rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
