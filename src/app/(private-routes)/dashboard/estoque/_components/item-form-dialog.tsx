"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
import { UNIT_SHORT } from "./stock-primitives";
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

  // Conservador: item existente trava a unidade-base (o backend também trava).
  const unitLocked = item !== null;

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
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Novo item de estoque"}</DialogTitle>
          <DialogDescription>{item ? "Nome, categoria e códigos. Saldos e limites ficam no detalhe do item." : "Insumo ou produto que entra por compra e sai por venda, perda ou ajuste."}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Field label="Nome" htmlFor="item-nome" required>
            <Input id="item-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cachaça, Limão, Cerveja long neck" autoFocus />
          </Field>

          <FieldGroup columns={2}>
            <Field label="Categoria" htmlFor="item-categoria">
              <NativeSelect id="item-categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="none">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nome}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Unidade-base" htmlFor="item-unidade" hint={unitLocked ? "Não dá pra trocar a unidade de um item já existente." : "Como o saldo é contado: unidades, gramas ou mililitros."}>
              <NativeSelect id="item-unidade" value={baseUnit} onChange={(e) => setBaseUnit(e.target.value as VenueInventoryUnit)} disabled={unitLocked}>
                {(Object.keys(VENUE_INVENTORY_UNIT_LABEL) as VenueInventoryUnit[]).map((u) => (
                  <option key={u} value={u}>
                    {VENUE_INVENTORY_UNIT_LABEL[u]} ({UNIT_SHORT[u]})
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>

          <FieldGroup columns={2}>
            <Field label="Código interno" htmlFor="item-codigo" optional>
              <Input id="item-codigo" leftIcon="tag" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} placeholder="Ex.: GIN-750" />
            </Field>
            <Field label="Código de barras" htmlFor="item-barcode" optional>
              <Input id="item-barcode" leftIcon="barcode" inputMode="numeric" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="EAN" />
            </Field>
          </FieldGroup>

          <Field label="Descrição" htmlFor="item-descricao" optional>
            <Textarea id="item-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="min-h-20" placeholder="Marca, fornecedor habitual, como armazenar…" />
          </Field>

          {!item ? (
            <section className="surface-inset space-y-4 rounded-xl p-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Saldo inicial</h4>
                <p className="mt-0.5 text-caption text-muted-foreground">Opcional. Lança o que já existe na unidade como movimentação de abertura.</p>
              </div>
              <Field label="Unidade" htmlFor="item-opening-location">
                <NativeSelect id="item-opening-location" value={openingLocationId} onChange={(e) => setOpeningLocationId(e.target.value)}>
                  <option value="none">Não lançar saldo inicial</option>
                  {locations.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.nome}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              {openingLocationId !== "none" ? (
                <FieldGroup columns={2}>
                  <QuantityField id="item-opening-qty" label="Quantidade" value={openingQuantity} onChange={setOpeningQuantity} suffix={UNIT_SHORT[baseUnit]} />
                  <MoneyField id="item-opening-cost" label="Custo total (opcional)" cents={openingTotalCostCents} onChange={setOpeningTotalCostCents} />
                </FieldGroup>
              ) : null}
            </section>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!nome.trim()}>
            {item ? "Salvar alterações" : "Criar item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
