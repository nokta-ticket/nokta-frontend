"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import {
  VENUE_INVENTORY_UNIT_LABEL,
  type CreateVenueInventoryItemPayload,
  type VenueInventoryCategory,
  type VenueInventoryItem,
  type VenueInventoryUnit,
} from "@/services/venue-stock";
import { useVenueStockItemMutations } from "../_hooks/use-venue-stock-catalog";
import { QuantityField } from "./quantity-field";
import { MoneyField } from "../../cardapio/_components/money-field";

export function ItemFormDialog({
  orgId,
  locations,
  categories,
  item,
  open,
  onOpenChange,
}: {
  orgId: number;
  locations: VenueLocation[];
  categories: VenueInventoryCategory[];
  item: VenueInventoryItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { create, update } = useVenueStockItemMutations(orgId);

  const [nome, setNome] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [descricao, setDescricao] = useState("");
  const [internalCode, setInternalCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [baseUnit, setBaseUnit] = useState<VenueInventoryUnit>("UNIT");
  const [openingLocationId, setOpeningLocationId] = useState<string>("none");
  const [openingQuantity, setOpeningQuantity] = useState("");
  const [openingTotalCostCents, setOpeningTotalCostCents] = useState(0);

  const hasMovements = item !== null; // conservador: se já existe, trava a unidade-base no backend mesmo assim

  useEffect(() => {
    if (!open) return;
    setNome(item?.nome ?? "");
    setCategoryId(item?.categoryId ? String(item.categoryId) : "none");
    setDescricao(item?.descricao ?? "");
    setInternalCode(item?.internalCode ?? "");
    setBarcode(item?.barcode ?? "");
    setBaseUnit(item?.baseUnit ?? "UNIT");
    setOpeningLocationId("none");
    setOpeningQuantity("");
    setOpeningTotalCostCents(0);
  }, [open, item]);

  const loading = create.isPending || update.isPending;

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }
    if (openingLocationId !== "none" && !openingQuantity) {
      toast.error("Informe a quantidade do saldo inicial.");
      return;
    }

    const basePayload = {
      nome: nome.trim(),
      categoryId: categoryId !== "none" ? Number(categoryId) : undefined,
      descricao: descricao.trim() || undefined,
      internalCode: internalCode.trim() || undefined,
      barcode: barcode.trim() || undefined,
      baseUnit,
    };

    if (item) {
      update
        .mutateAsync({ itemId: item.id, payload: basePayload })
        .then(() => {
          toast.success("Item atualizado.");
          onOpenChange(false);
        })
        .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar o item.")));
      return;
    }

    const payload: CreateVenueInventoryItemPayload = {
      ...basePayload,
      openingLocationId: openingLocationId !== "none" ? Number(openingLocationId) : undefined,
      openingQuantity: openingLocationId !== "none" ? openingQuantity : undefined,
      openingTotalCostCents: openingLocationId !== "none" ? openingTotalCostCents : undefined,
    };

    create
      .mutateAsync(payload)
      .then(() => {
        toast.success("Item criado.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível criar o item.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item de estoque" : "Novo item de estoque"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-nome">Nome</Label>
            <Input id="item-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cachaça, Limão, Cerveja Long Neck" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade-base</Label>
              <Select value={baseUnit} onValueChange={(v) => setBaseUnit(v as VenueInventoryUnit)} disabled={hasMovements}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(VENUE_INVENTORY_UNIT_LABEL) as VenueInventoryUnit[]).map((u) => (
                    <SelectItem key={u} value={u}>{VENUE_INVENTORY_UNIT_LABEL[u]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasMovements ? (
                <p className="text-xs text-black/50">Não é possível trocar a unidade de um item já existente.</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-codigo">Código interno (opcional)</Label>
              <Input id="item-codigo" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-barcode">Código de barras (opcional)</Label>
              <Input id="item-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-descricao">Descrição (opcional)</Label>
            <Textarea id="item-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>

          {!item ? (
            <div className="space-y-3 rounded-lg border border-black/10 p-3">
              <p className="text-sm font-medium">Saldo inicial (opcional)</p>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={openingLocationId} onValueChange={setOpeningLocationId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não lançar saldo inicial</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {openingLocationId !== "none" ? (
                <div className="grid grid-cols-2 gap-3">
                  <QuantityField
                    label={`Quantidade (${VENUE_INVENTORY_UNIT_LABEL[baseUnit]})`}
                    value={openingQuantity}
                    onChange={setOpeningQuantity}
                  />
                  <MoneyField label="Custo total (opcional)" cents={openingTotalCostCents} onChange={setOpeningTotalCostCents} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button disabled={loading || !nome.trim()} onClick={handleSubmit}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
