"use client";

import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { venueStockApi, formatCents, VENUE_INVENTORY_UNIT_LABEL, type VenueInventoryItem } from "@/services/venue-stock";
import { useVenueVariants } from "../_hooks/use-venue-variants";
import {
  useSetVariantComponents,
  useVenueVariantComponents,
} from "../../estoque/_hooks/use-venue-stock-components";
import { useVenueStockItems } from "../../estoque/_hooks/use-venue-stock-catalog";
import { stockKeys } from "../../estoque/_hooks/query-keys";
import { QuantityField } from "../../estoque/_components/quantity-field";
import { BlockSkeleton } from "../../_components/states/loading-state";

type DraftComponent = { key: string; inventoryItemId: number | null; quantity: string };

function VariantStockRow({ orgId, variant, items }: { orgId: number; variant: { id: number; nome: string; stockControl: string }; items: VenueInventoryItem[] }) {
  const { data } = useVenueVariantComponents(orgId, variant.id);
  const setComponents = useSetVariantComponents(orgId, variant.id);
  const [draft, setDraft] = useState<DraftComponent[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data || dirty) return;
    setDraft(
      data.components.length > 0
        ? data.components.map((c) => ({ key: String(c.id), inventoryItemId: c.inventoryItemId, quantity: c.quantityPerSale }))
        : [{ key: "new-0", inventoryItemId: null, quantity: "" }],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Custo estimado usa o custo médio da primeira unidade com saldo lançado — aproximação informativa, não contábil.
  const costQueries = useQueries({
    queries: draft
      .filter((d) => d.inventoryItemId)
      .map((d) => ({
        queryKey: stockKeys.itemBalances(orgId, d.inventoryItemId as number),
        queryFn: () => venueStockApi.getItemBalances(orgId, d.inventoryItemId as number),
        staleTime: 60_000,
      })),
  });

  if (variant.stockControl === "NONE") {
    return (
      <div className="rounded-lg border border-black/10 p-3 text-sm text-black/50">
        <span className="font-medium text-black/70">{variant.nome}</span> — controle de estoque desativado para esta variação.
      </div>
    );
  }

  const estimatedCostCents = draft.reduce((sum, d, i) => {
    if (!d.inventoryItemId || !d.quantity) return sum;
    const balances = costQueries[i]?.data;
    const avg = balances && balances.length > 0 ? Number(balances[0].averageUnitCostCents) : 0;
    return sum + avg * Number(d.quantity);
  }, 0);

  const canSave =
    variant.stockControl === "DIRECT"
      ? draft.length === 1 && draft[0].inventoryItemId && Number(draft[0].quantity) > 0
      : draft.length > 0 && draft.every((d) => d.inventoryItemId && Number(d.quantity) > 0);

  const handleSave = () => {
    if (!canSave) {
      toast.error(
        variant.stockControl === "DIRECT"
          ? 'Controle "Direto" exige exatamente um item vinculado, com quantidade maior que zero.'
          : "Preencha item e quantidade em todos os componentes da ficha técnica.",
      );
      return;
    }
    setComponents
      .mutateAsync(draft.map((d) => ({ inventoryItemId: d.inventoryItemId as number, quantityPerSale: d.quantity })))
      .then(() => {
        toast.success("Ficha técnica salva.");
        setDirty(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a ficha técnica.")));
  };

  return (
    <div className="space-y-3 rounded-lg border border-black/10 p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{variant.nome}</span>
        <span className="text-xs text-black/50">
          {variant.stockControl === "DIRECT" ? "Direto" : "Ficha técnica"}
        </span>
      </div>

      {draft.map((d, i) => {
        const item = items.find((it) => it.id === d.inventoryItemId);
        return (
          <div key={d.key} className="flex items-center gap-2">
            <Select
              value={d.inventoryItemId ? String(d.inventoryItemId) : undefined}
              onValueChange={(v) => {
                setDirty(true);
                setDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, inventoryItemId: Number(v) } : x)));
              }}
            >
              <SelectTrigger className="flex-1"><SelectValue placeholder="Item de estoque" /></SelectTrigger>
              <SelectContent>
                {items.map((it) => (
                  <SelectItem key={it.id} value={String(it.id)}>{it.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-32">
              <QuantityField
                value={d.quantity}
                onChange={(v) => {
                  setDirty(true);
                  setDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, quantity: v } : x)));
                }}
                suffix={item ? VENUE_INVENTORY_UNIT_LABEL[item.baseUnit] : undefined}
              />
            </div>
            {variant.stockControl === "RECIPE" ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={draft.length === 1}
                onClick={() => {
                  setDirty(true);
                  setDraft((prev) => prev.filter((_, xi) => xi !== i));
                }}
              >
                <Trash2 size={14} />
              </Button>
            ) : null}
          </div>
        );
      })}

      {variant.stockControl === "RECIPE" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setDirty(true);
            setDraft((prev) => [...prev, { key: `new-${prev.length}`, inventoryItemId: null, quantity: "" }]);
          }}
        >
          <Plus size={14} /> Adicionar componente
        </Button>
      ) : null}

      <div className="flex items-center justify-between border-t border-black/5 pt-2">
        <span className="text-xs text-black/50">Custo estimado por venda: {formatCents(estimatedCostCents)}</span>
        <Button size="sm" disabled={setComponents.isPending || !canSave} onClick={handleSave}>
          {setComponents.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

export function ProdutoEstoqueSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: variants, isLoading } = useVenueVariants(orgId, productId);
  const { data: itemsData } = useVenueStockItems(orgId, { status: "ACTIVE", limit: 200 });

  if (isLoading) return <BlockSkeleton className="h-64" />;

  const list = (variants ?? []).filter((v) => v.status !== "ARCHIVED");
  const items = itemsData?.data ?? [];

  if (list.length === 0) {
    return <p className="text-sm text-black/50">Cadastre variações antes de configurar o consumo de estoque.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-sm">Consumo de estoque por variação</Label>
        <p className="text-xs text-black/50">
          Direto: um item é baixado diretamente por venda. Ficha técnica: vários insumos são baixados juntos (ex.: uma caipirinha consome cachaça, limão e açúcar).
          O controle (Não controlar / Direto / Ficha técnica) é definido na aba Variações.
        </p>
      </div>
      {list.map((variant) => (
        <VariantStockRow key={variant.id} orgId={orgId} variant={variant} items={items} />
      ))}
    </div>
  );
}
