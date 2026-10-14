"use client";

import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatBRLCents } from "@/lib/format";
import { venueStockApi, VENUE_INVENTORY_UNIT_LABEL, type VenueInventoryItem } from "@/services/venue-stock";
import { useVenueVariants } from "../_hooks/use-venue-variants";
import { useSetVariantComponents, useVenueVariantComponents } from "../../estoque/_hooks/use-venue-stock-components";
import { useVenueStockItems } from "../../estoque/_hooks/use-venue-stock-catalog";
import { stockKeys } from "../../estoque/_hooks/query-keys";
import { QuantityField } from "../../estoque/_components/quantity-field";

type DraftComponent = { key: string; inventoryItemId: number | null; quantity: string };

function VariantStockRow({ orgId, variant, items }: { orgId: number; variant: { id: number; nome: string; stockControl: string }; items: VenueInventoryItem[] }) {
  const { data } = useVenueVariantComponents(orgId, variant.id);
  const setComponents = useSetVariantComponents(orgId, variant.id);
  const [draft, setDraft] = useState<DraftComponent[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data || dirty) return;
    setDraft(data.components.length > 0 ? data.components.map((c) => ({ key: String(c.id), inventoryItemId: c.inventoryItemId, quantity: c.quantityPerSale })) : [{ key: "new-0", inventoryItemId: null, quantity: "" }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Custo estimado usa o custo médio da primeira unidade com saldo — aproximação informativa, não contábil.
  const costQueries = useQueries({ queries: draft.filter((d) => d.inventoryItemId).map((d) => ({ queryKey: stockKeys.itemBalances(orgId, d.inventoryItemId as number), queryFn: () => venueStockApi.getItemBalances(orgId, d.inventoryItemId as number), staleTime: 60_000 })) });

  if (variant.stockControl === "NONE") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
        <p className="text-sm font-medium text-foreground">{variant.nome}</p>
        <StatusBadge tone="neutral">Sem controle</StatusBadge>
      </div>
    );
  }

  const withItem = draft.filter((d) => d.inventoryItemId);
  const estimatedCostCents = withItem.reduce((sum, d, i) => {
    if (!d.quantity) return sum;
    const balances = costQueries[i]?.data;
    const avg = balances && balances.length > 0 ? Number(balances[0].averageUnitCostCents) : 0;
    return sum + avg * Number(d.quantity);
  }, 0);

  const canSave = variant.stockControl === "DIRECT" ? draft.length === 1 && Boolean(draft[0].inventoryItemId) && Number(draft[0].quantity) > 0 : draft.length > 0 && draft.every((d) => d.inventoryItemId && Number(d.quantity) > 0);

  const handleSave = () => {
    if (!canSave) {
      toast.error(variant.stockControl === "DIRECT" ? 'Controle "Direto" exige exatamente um item vinculado, com quantidade maior que zero.' : "Preencha item e quantidade em todos os componentes da ficha técnica.");
      return;
    }
    setComponents
      .mutateAsync(draft.map((d) => ({ inventoryItemId: d.inventoryItemId as number, quantityPerSale: d.quantity })))
      .then(() => {
        toast.success("Ficha técnica salva");
        setDirty(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a ficha técnica.")));
  };

  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{variant.nome}</p>
        <StatusBadge tone="info">{variant.stockControl === "DIRECT" ? "Direto" : "Ficha técnica"}</StatusBadge>
      </div>

      <div className="space-y-2">
        {draft.map((d, i) => {
          const item = items.find((it) => it.id === d.inventoryItemId);
          return (
            <div key={d.key} className="flex items-center gap-2">
              <NativeSelect aria-label="Item de estoque" value={d.inventoryItemId ? String(d.inventoryItemId) : ""} onChange={(e) => { setDirty(true); setDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, inventoryItemId: Number(e.target.value) || null } : x))); }} className="min-w-0 flex-1">
                <option value="">Item de estoque</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.nome}
                  </option>
                ))}
              </NativeSelect>
              <div className="w-32 shrink-0">
                <QuantityField value={d.quantity} onChange={(v) => { setDirty(true); setDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, quantity: v } : x))); }} suffix={item ? VENUE_INVENTORY_UNIT_LABEL[item.baseUnit] : undefined} />
              </div>
              {variant.stockControl === "RECIPE" ? (
                <Button variant="subtle" size="icon-sm" aria-label="Remover componente" disabled={draft.length === 1} onClick={() => { setDirty(true); setDraft((prev) => prev.filter((_, xi) => xi !== i)); }}>
                  <Icon name="close" size={13} />
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      {variant.stockControl === "RECIPE" ? (
        <Button variant="outline" size="sm" leftIcon="plus" onClick={() => { setDirty(true); setDraft((prev) => [...prev, { key: `new-${prev.length}`, inventoryItemId: null, quantity: "" }]); }}>
          Componente
        </Button>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-caption text-muted-foreground tnum">Custo estimado por venda: {formatBRLCents(estimatedCostCents)}</span>
        <Button size="sm" loading={setComponents.isPending} disabled={!canSave || !dirty} onClick={handleSave}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

export function ProdutoEstoqueSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: variants, isLoading } = useVenueVariants(orgId, productId);
  const { data: itemsData } = useVenueStockItems(orgId, { status: "ACTIVE", limit: 200 });

  if (isLoading) return <RowsSkeleton rows={2} />;

  const list = (variants ?? []).filter((v) => v.status !== "ARCHIVED");
  const items = itemsData?.data ?? [];

  if (list.length === 0) return <EmptyState compact icon="box" title="Sem variações" description="Cadastre variações antes de configurar o consumo de estoque." />;

  return (
    <div className="space-y-4">
      <Callout tone="neutral" icon="box">
        <strong className="font-semibold text-foreground">Direto</strong>: um item baixa por venda. <strong className="font-semibold text-foreground">Ficha técnica</strong>: vários insumos baixam juntos (uma caipirinha consome cachaça, limão e açúcar). O tipo de controle é definido em Variações.
      </Callout>
      {list.map((variant) => (
        <VariantStockRow key={variant.id} orgId={orgId} variant={variant} items={items} />
      ))}
    </div>
  );
}
