"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { centsToBRL, type VenueMenuItem } from "@/services/venue-menu";
import { useVenueMenus } from "../../cardapio/_hooks/use-venue-menus";
import { useVenueCategories } from "../../cardapio/_hooks/use-venue-categories";
import { useVenueMenuItems } from "../../cardapio/_hooks/use-venue-menu-items";
import { useVenueProduct } from "../../cardapio/_hooks/use-venue-products";
import { useVenueOrderMutations } from "../_hooks/use-venue-orders";
import { BlockSkeleton } from "../../../_components/states/loading-state";
import { EmptyState } from "../../../_components/states/empty-state";

interface CartModifier {
  modifierGroupId: number;
  modifierOptionId: number;
  nome: string;
  priceCents: number;
}

interface CartLine {
  key: string;
  menuItemId: number;
  productNome: string;
  variantId: number;
  variantNome: string;
  unitPriceCents: number;
  quantity: number;
  notes?: string;
  modifiers: CartModifier[];
}

function ItemConfigurator({
  menuItem,
  onAdd,
}: {
  menuItem: VenueMenuItem;
  onAdd: (line: Omit<CartLine, "key">) => void;
}) {
  const { data: product } = useVenueProduct(menuItem.organizationId, menuItem.productId);
  const sellableVariants = menuItem.product.variants.filter((v) => v.status !== "ARCHIVED");
  const [variantId, setVariantId] = useState<number>(
    sellableVariants.find((v) => v.isDefault)?.id ?? sellableVariants[0]?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<Record<number, number[]>>({});

  const priceInfo = menuItem.prices.find((p) => p.variantId === variantId);
  const variant = sellableVariants.find((v) => v.id === variantId);
  const unitPriceCents = priceInfo?.effectivePriceCents ?? variant?.priceCents ?? 0;

  const links = product?.modifierGroups ?? [];

  const toggleOption = (groupId: number, optionId: number, group: (typeof links)[number]) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] ?? [];
      const max = group.maxSelect ?? Infinity;
      let next: number[];
      if (current.includes(optionId)) {
        next = current.filter((id) => id !== optionId);
      } else {
        if (max === 1) {
          next = [optionId];
        } else if (current.length >= max) {
          toast.error(`Máximo de ${max} escolha(s) para "${group.group.nome}".`);
          return prev;
        } else {
          next = [...current, optionId];
        }
      }
      return { ...prev, [groupId]: next };
    });
  };

  const modifiersCents = links.reduce((sum, link) => {
    const selected = selectedModifiers[link.modifierGroupId] ?? [];
    return (
      sum +
      selected.reduce((s, optId) => {
        const opt = link.group.options.find((o) => o.id === optId);
        return s + (opt?.priceCents ?? 0);
      }, 0)
    );
  }, 0);

  const canAdd =
    variantId !== undefined &&
    links.every((link) => {
      const selected = selectedModifiers[link.modifierGroupId] ?? [];
      return !link.required || selected.length >= link.minSelect;
    });

  const handleAdd = () => {
    if (!variant || !canAdd) {
      toast.error("Selecione as opções obrigatórias antes de adicionar.");
      return;
    }
    const modifiers: CartModifier[] = [];
    for (const link of links) {
      const selected = selectedModifiers[link.modifierGroupId] ?? [];
      for (const optId of selected) {
        const opt = link.group.options.find((o) => o.id === optId);
        if (opt) {
          modifiers.push({
            modifierGroupId: link.modifierGroupId,
            modifierOptionId: opt.id,
            nome: opt.nome,
            priceCents: opt.priceCents,
          });
        }
      }
    }
    onAdd({
      menuItemId: menuItem.id,
      productNome: menuItem.product.nome,
      variantId: variant.id,
      variantNome: variant.nome,
      unitPriceCents,
      quantity,
      notes: notes.trim() || undefined,
      modifiers,
    });
    setQuantity(1);
    setNotes("");
    setSelectedModifiers({});
  };

  return (
    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
      {sellableVariants.length > 1 ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Variação</Label>
          <Select value={String(variantId)} onValueChange={(v) => setVariantId(Number(v))}>
            <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {sellableVariants.map((v) => {
                const p = menuItem.prices.find((pr) => pr.variantId === v.id);
                return (
                  <SelectItem key={v.id} value={String(v.id)} disabled={v.status === "SOLD_OUT"}>
                    {v.nome} — {centsToBRL(p?.effectivePriceCents ?? v.priceCents)}
                    {v.status === "SOLD_OUT" ? " (esgotado)" : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {links.map((link) => (
        <div key={link.modifierGroupId} className="space-y-1.5">
          <Label className="text-xs">
            {link.group.nome}
            {link.required ? " · obrigatório" : ""}
            {link.maxSelect ? ` · até ${link.maxSelect}` : ""}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {link.group.options
              .filter((o) => o.active)
              .map((opt) => {
                const selected = (selectedModifiers[link.modifierGroupId] ?? []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleOption(link.modifierGroupId, opt.id, link)}
                    className={`rounded-full border px-3 py-1 text-xs ${selected ? "border-violet-500 bg-violet-500 text-white" : "border-black/15 bg-white text-black/70"}`}
                  >
                    {opt.nome}
                    {opt.priceCents > 0 ? ` +${centsToBRL(opt.priceCents)}` : ""}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="space-y-1.5">
        <Label className="text-xs">Observação (opcional)</Label>
        <Textarea rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-white" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Minus size={14} />
          </Button>
          <span className="w-6 text-center text-sm font-medium">{quantity}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity((q) => q + 1)}>
            <Plus size={14} />
          </Button>
        </div>
        <Button size="sm" disabled={!canAdd} onClick={handleAdd}>
          Adicionar · {centsToBRL((unitPriceCents + modifiersCents) * quantity)}
        </Button>
      </div>
    </div>
  );
}

export function OrderBuilderSheet({
  orgId,
  tabId,
  open,
  onOpenChange,
}: {
  orgId: number;
  tabId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: menus } = useVenueMenus(orgId);
  const publishedMenus = (menus ?? []).filter((m) => m.status === "PUBLISHED");
  const [menuId, setMenuId] = useState<number | null>(null);
  const activeMenuId = menuId ?? publishedMenus.find((m) => m.isMain)?.id ?? publishedMenus[0]?.id ?? null;

  const { data: categories } = useVenueCategories(orgId, activeMenuId);
  const { data: items, isLoading } = useVenueMenuItems(orgId, activeMenuId);

  const [search, setSearch] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const { create, send } = useVenueOrderMutations(orgId, tabId);

  const activeItems = (items ?? []).filter(
    (i) => i.active && i.product.status !== "ARCHIVED" && i.product.status !== "INACTIVE",
  );
  const filtered = search
    ? activeItems.filter((i) => i.product.nome.toLowerCase().includes(search.toLowerCase()))
    : activeItems;

  const byCategory = useMemo(() => {
    const map = new Map<number, VenueMenuItem[]>();
    for (const item of filtered) {
      const list = map.get(item.categoryId) ?? [];
      list.push(item);
      map.set(item.categoryId, list);
    }
    return map;
  }, [filtered]);

  const cartTotalCents = cart.reduce(
    (sum, line) =>
      sum + (line.unitPriceCents + line.modifiers.reduce((s, m) => s + m.priceCents, 0)) * line.quantity,
    0,
  );

  const addToCart = (line: Omit<CartLine, "key">) => {
    setCart((prev) => [...prev, { ...line, key: `${Date.now()}-${Math.random()}` }]);
    setExpandedItemId(null);
    toast.success(`${line.productNome} adicionado ao pedido.`);
  };

  const removeFromCart = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key));

  const handleSubmit = () => {
    if (cart.length === 0) {
      toast.error("Adicione ao menos um item ao pedido.");
      return;
    }
    create.mutate(
      {
        items: cart.map((line) => ({
          menuItemId: line.menuItemId,
          variantId: line.variantId,
          quantity: line.quantity,
          notes: line.notes,
          modifiers: line.modifiers.map((m) => ({
            modifierGroupId: m.modifierGroupId,
            modifierOptionId: m.modifierOptionId,
          })),
        })),
      },
      {
        onSuccess: (order) => {
          send.mutate(order.id, {
            onSuccess: () => {
              toast.success("Pedido enviado para o preparo.");
              setCart([]);
              onOpenChange(false);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Pedido criado, mas não foi possível enviar.")),
          });
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar o pedido.")),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Novo pedido</SheetTitle>
        </SheetHeader>

        {publishedMenus.length > 1 ? (
          <div className="px-4">
            <Select value={activeMenuId ? String(activeMenuId) : undefined} onValueChange={(v) => setMenuId(Number(v))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Cardápio" /></SelectTrigger>
              <SelectContent>
                {publishedMenus.map((m) => (<SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="px-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-black/40" size={16} />
            <Input className="pl-9" placeholder="Buscar produto…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {!activeMenuId ? (
            <EmptyState title="Nenhum cardápio publicado" description="Publique um cardápio na aba Cardápio para vender por aqui." />
          ) : isLoading ? (
            <BlockSkeleton className="h-64" />
          ) : filtered.length === 0 ? (
            <EmptyState title="Nenhum produto encontrado" description="Ajuste a busca ou cadastre produtos no Cardápio." />
          ) : (
            [...byCategory.entries()].map(([categoryId, categoryItems]) => {
              const category = (categories ?? []).find((c) => c.id === categoryId);
              return (
                <section key={categoryId} className="space-y-2">
                  <h4 className="text-sm font-semibold text-black/60">{category?.nome ?? "Outros"}</h4>
                  <div className="space-y-2">
                    {categoryItems.map((item) => {
                      const defaultVariant =
                        item.product.variants.find((v) => v.isDefault) ?? item.product.variants[0];
                      const priceInfo = item.prices.find((p) => p.variantId === defaultVariant?.id);
                      const soldOut = item.product.status === "SOLD_OUT";
                      return (
                        <div key={item.id} className="rounded-xl border border-black/10 bg-white p-3">
                          <button
                            className="flex w-full items-center justify-between gap-2 text-left disabled:opacity-50"
                            disabled={soldOut}
                            onClick={() => setExpandedItemId((cur) => (cur === item.id ? null : item.id))}
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.product.nome}
                                {soldOut ? <span className="ml-2 text-xs text-amber-600">Esgotado</span> : null}
                              </p>
                              <p className="text-xs text-black/50">
                                {centsToBRL(priceInfo?.effectivePriceCents ?? defaultVariant?.priceCents ?? 0)}
                              </p>
                            </div>
                            <Plus size={18} className="text-violet-600" />
                          </button>
                          {expandedItemId === item.id ? (
                            <div className="mt-3">
                              <ItemConfigurator menuItem={item} onAdd={addToCart} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>

        {cart.length > 0 ? (
          <div className="max-h-40 overflow-y-auto border-t border-black/10 px-4 py-2">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-black/50">
              <ShoppingCart size={13} /> Carrinho
            </p>
            <ul className="space-y-1">
              {cart.map((line) => (
                <li key={line.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    {line.quantity}x {line.productNome} ({line.variantNome})
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-black/60">
                      {centsToBRL((line.unitPriceCents + line.modifiers.reduce((s, m) => s + m.priceCents, 0)) * line.quantity)}
                    </span>
                    <button onClick={() => removeFromCart(line.key)} aria-label="Remover item">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <SheetFooter className="flex-row items-center justify-between border-t border-black/10">
          <span className="text-sm font-semibold">Total: {centsToBRL(cartTotalCents)}</span>
          <Button disabled={cart.length === 0 || create.isPending || send.isPending} onClick={handleSubmit}>
            {create.isPending || send.isPending ? "Enviando…" : "Enviar pedido"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
