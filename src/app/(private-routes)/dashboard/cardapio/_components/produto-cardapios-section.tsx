"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import type { VenueProductMenuInfo } from "@/services/venue-menu";
import { useVenueProduct } from "../_hooks/use-venue-products";
import { useVenueMenus } from "../_hooks/use-venue-menus";
import { useVenueCategories } from "../_hooks/use-venue-categories";
import { useVenueMenuItemMutations } from "../_hooks/use-venue-menu-items";
import { MenuStatusBadge } from "./venue-status-badge";
import { MoneyField } from "./money-field";

function AddToMenuForm({ orgId, productId, availableMenus, onAdded }: { orgId: number; productId: number; availableMenus: { id: number; nome: string }[]; onAdded: () => void }) {
  const [menuId, setMenuId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { data: categories } = useVenueCategories(orgId, menuId ? Number(menuId) : null);
  const { create } = useVenueMenuItemMutations(orgId, menuId ? Number(menuId) : -1);

  const handleAdd = () => {
    if (!menuId || !categoryId) {
      toast.error("Selecione o cardápio e a categoria.");
      return;
    }
    create.mutate(
      { categoryId: Number(categoryId), productId },
      {
        onSuccess: () => {
          toast.success("Produto adicionado ao cardápio");
          setMenuId("");
          setCategoryId("");
          onAdded();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível adicionar ao cardápio.")),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-card border border-dashed border-border-strong p-3.5">
      <p className="text-sm font-medium text-foreground">Adicionar a outro cardápio</p>
      <div className="grid grid-cols-2 gap-2">
        <NativeSelect aria-label="Cardápio" value={menuId} onChange={(e) => { setMenuId(e.target.value); setCategoryId(""); }}>
          <option value="">Cardápio</option>
          {availableMenus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!menuId}>
          <option value="">Categoria</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button size="sm" leftIcon="plus" disabled={!menuId || !categoryId} loading={create.isPending} onClick={handleAdd}>
        Adicionar
      </Button>
    </div>
  );
}

function MenuAttachmentRow({ orgId, menuInfo, onRequestRemove }: { orgId: number; menuInfo: VenueProductMenuInfo; onRequestRemove: () => void }) {
  const { data: categories } = useVenueCategories(orgId, menuInfo.menuId);
  const { update, setVariantPrice, removeVariantPrice } = useVenueMenuItemMutations(orgId, menuInfo.menuId);
  const [pricesOpen, setPricesOpen] = useState(menuInfo.prices.some((p) => p.overridePriceCents !== null));

  return (
    <li className="rounded-card border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{menuInfo.menuNome}</p>
          <MenuStatusBadge status={menuInfo.menuStatus} />
        </div>
        <button
          type="button"
          title={menuInfo.highlighted ? "Remover dos destaques" : "Destacar neste cardápio"}
          aria-label={menuInfo.highlighted ? "Remover dos destaques" : "Destacar neste cardápio"}
          aria-pressed={menuInfo.highlighted}
          onClick={() => update.mutate({ menuItemId: menuInfo.menuItemId, payload: { highlighted: !menuInfo.highlighted } }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar o destaque.")) })}
          className={cn("flex size-9 items-center justify-center rounded-full transition-colors", menuInfo.highlighted ? "bg-warning-bg text-warning" : "text-subtle-foreground hover:bg-surface-2 hover:text-foreground")}
        >
          <Icon name={menuInfo.highlighted ? "star" : "star-outline"} size={15} />
        </button>
        <Switch checked={menuInfo.active} aria-label={menuInfo.active ? "Desativar neste cardápio" : "Ativar neste cardápio"} onCheckedChange={(checked) => update.mutate({ menuItemId: menuInfo.menuItemId, payload: { active: checked } }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar.")) })} />
        <Button variant="subtle" size="icon-sm" aria-label="Remover do cardápio" title="Remover do cardápio" className="hover:bg-danger-bg hover:text-danger" onClick={onRequestRemove}>
          <Icon name="close" size={14} />
        </Button>
      </div>
      <div className="grid gap-2 border-t border-border px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <NativeSelect aria-label="Categoria neste cardápio" value={String(menuInfo.categoryId)} onChange={(e) => update.mutate({ menuItemId: menuInfo.menuItemId, payload: { categoryId: Number(e.target.value) } }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível trocar a categoria.")) })}>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </NativeSelect>
        <Button variant="ghost" size="sm" rightIcon={pricesOpen ? "chevron-up" : "chevron-down"} onClick={() => setPricesOpen((v) => !v)}>
          Preço neste cardápio
        </Button>
      </div>
      {pricesOpen ? (
        <div className="space-y-2 border-t border-border bg-surface-2/40 px-3 py-3">
          <p className="text-caption text-muted-foreground">Só preencha pra cobrar diferente do preço base aqui (happy hour, camarote…).</p>
          {menuInfo.prices.map((price) => (
            <div key={price.variantId} className="flex items-center gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">{price.variantNome}</p>
                <p className="text-caption text-subtle-foreground tnum">base {formatBRLCents(price.basePriceCents)}</p>
              </div>
              <div className="w-32">
                <MoneyField cents={price.overridePriceCents ?? price.basePriceCents} onChange={(cents) => { if (cents === (price.overridePriceCents ?? price.basePriceCents)) return; setVariantPrice.mutate({ menuItemId: menuInfo.menuItemId, variantId: price.variantId, priceCents: cents }, { onSuccess: () => toast.success("Preço específico aplicado"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível definir o preço.")) }); }} />
              </div>
              <Button variant="subtle" size="icon-sm" aria-label="Voltar ao preço base" title="Voltar ao preço base" className={cn(price.overridePriceCents === null && "invisible")} onClick={() => removeVariantPrice.mutate({ menuItemId: menuInfo.menuItemId, variantId: price.variantId }, { onSuccess: () => toast.success("Volta ao preço base"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível remover o preço.")) })}>
                <Icon name="undo" size={13} />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export function ProdutoCardapiosSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: product, isError, refetch } = useVenueProduct(orgId, productId);
  const { data: allMenus } = useVenueMenus(orgId);
  const [removing, setRemoving] = useState<{ menuItemId: number; menuId: number; menuNome: string } | null>(null);
  const { remove } = useVenueMenuItemMutations(orgId, removing?.menuId ?? -1);

  if (isError) return <ErrorState description="Não foi possível carregar os cardápios do produto." onRetry={() => refetch()} />;
  if (!product) return <RowsSkeleton rows={2} />;

  const attached = new Set(product.menus.map((m) => m.menuId));
  const availableMenus = (allMenus ?? []).filter((m) => !attached.has(m.id) && m.status !== "ARCHIVED");

  return (
    <div className="space-y-4">
      {product.menus.length === 0 ? (
        <EmptyState compact icon="utensils" title="Não está em nenhum cardápio" description="Adicione a um cardápio pra ele aparecer na operação e no público." />
      ) : (
        <ul className="space-y-2.5">
          {product.menus.map((menuInfo) => (
            <MenuAttachmentRow key={menuInfo.menuItemId} orgId={orgId} menuInfo={menuInfo} onRequestRemove={() => setRemoving({ menuItemId: menuInfo.menuItemId, menuId: menuInfo.menuId, menuNome: menuInfo.menuNome })} />
          ))}
        </ul>
      )}

      {availableMenus.length > 0 ? <AddToMenuForm orgId={orgId} productId={productId} availableMenus={availableMenus} onAdded={() => refetch()} /> : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Remover do cardápio"
        description={`Remover este produto de "${removing?.menuNome}"? Só o vínculo sai — o produto continua existindo.`}
        confirmLabel="Remover"
        danger
        onConfirm={async () => {
          if (!removing) return;
          try {
            await remove.mutateAsync(removing.menuItemId);
            toast.success("Produto removido do cardápio");
            refetch();
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível remover do cardápio."));
            throw err;
          }
        }}
      />
    </div>
  );
}
