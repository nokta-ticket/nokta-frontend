"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { SelectInput } from "@/components/ui/select-input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "@/lib/toast";
import type { VenueMenuItem } from "@/services/venue-menu";
import { useOrderCategories, useOrderMenuItems, useOrderMenus, useOrderProduct } from "../_hooks/use-order-catalog";
import { useVenueOrderMutations } from "../_hooks/use-venue-orders";

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

const lineTotal = (line: CartLine) => (line.unitPriceCents + line.modifiers.reduce((s, m) => s + m.priceCents, 0)) * line.quantity;

const CHIP = "press inline-flex min-h-10 items-center gap-1.5 rounded-pill border px-3.5 text-sm font-medium transition-colors";
const CHIP_ON = "border-transparent bg-brand text-brand-foreground";
const CHIP_OFF = "border-border bg-surface text-foreground hover:bg-surface-2";

function ItemConfigurator({ orgId, menuItem, onAdd }: { orgId: number; menuItem: VenueMenuItem; onAdd: (line: Omit<CartLine, "key">) => void }) {
  const { data: product, isLoading } = useOrderProduct(orgId, menuItem.productId);
  const sellableVariants = menuItem.product.variants.filter((v) => v.status !== "ARCHIVED");
  const [variantId, setVariantId] = useState<number>(sellableVariants.find((v) => v.isDefault)?.id ?? sellableVariants[0]?.id);
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
      } else if (max === 1) {
        next = [optionId];
      } else if (current.length >= max) {
        toast.error(`Máximo de ${max} escolha(s) em "${group.group.nome}".`);
        return prev;
      } else {
        next = [...current, optionId];
      }
      return { ...prev, [groupId]: next };
    });
  };

  const modifiersCents = links.reduce((sum, link) => {
    const selected = selectedModifiers[link.modifierGroupId] ?? [];
    return sum + selected.reduce((s, optId) => s + (link.group.options.find((o) => o.id === optId)?.priceCents ?? 0), 0);
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
      for (const optId of selectedModifiers[link.modifierGroupId] ?? []) {
        const opt = link.group.options.find((o) => o.id === optId);
        if (opt) modifiers.push({ modifierGroupId: link.modifierGroupId, modifierOptionId: opt.id, nome: opt.nome, priceCents: opt.priceCents });
      }
    }
    onAdd({ menuItemId: menuItem.id, productNome: menuItem.product.nome, variantId: variant.id, variantNome: variant.nome, unitPriceCents, quantity, notes: notes.trim() || undefined, modifiers });
    setQuantity(1);
    setNotes("");
    setSelectedModifiers({});
  };

  return (
    <div className="surface-inset scale-in mt-3 space-y-4 rounded-xl p-4">
      {sellableVariants.length > 1 ? (
        <Field label="Variação">
          <div className="flex flex-wrap gap-2">
            {sellableVariants.map((v) => {
              const p = menuItem.prices.find((pr) => pr.variantId === v.id);
              const soldOut = v.status === "SOLD_OUT";
              const active = v.id === variantId;
              return (
                <button key={v.id} type="button" disabled={soldOut} onClick={() => setVariantId(v.id)} aria-pressed={active} className={cn(CHIP, active ? CHIP_ON : CHIP_OFF, soldOut && "opacity-40 line-through")}>
                  {v.nome}
                  <span className={cn("tnum", active ? "opacity-80" : "text-muted-foreground")}>{formatBRLCents(p?.effectivePriceCents ?? v.priceCents)}</span>
                </button>
              );
            })}
          </div>
        </Field>
      ) : null}

      {isLoading ? <RowsSkeleton rows={1} /> : null}

      {links.map((link) => (
        <Field key={link.modifierGroupId} label={link.group.nome} hint={[link.required ? "obrigatório" : null, link.maxSelect ? `até ${link.maxSelect}` : null].filter(Boolean).join(" · ") || undefined}>
          <div className="flex flex-wrap gap-2">
            {link.group.options
              .filter((o) => o.active)
              .map((opt) => {
                const selected = (selectedModifiers[link.modifierGroupId] ?? []).includes(opt.id);
                return (
                  <button key={opt.id} type="button" onClick={() => toggleOption(link.modifierGroupId, opt.id, link)} aria-pressed={selected} className={cn(CHIP, selected ? CHIP_ON : CHIP_OFF)}>
                    {selected ? <Icon name="check" size={11} /> : null}
                    {opt.nome}
                    {opt.priceCents > 0 ? <span className={cn("tnum", selected ? "opacity-80" : "text-muted-foreground")}>+{formatBRLCents(opt.priceCents)}</span> : null}
                  </button>
                );
              })}
          </div>
        </Field>
      ))}

      <Field label="Observação" optional htmlFor={`notes-${menuItem.id}`}>
        <Input id={`notes-${menuItem.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sem gelo, bem passado…" />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-pill bg-surface-2 p-1">
          <Button type="button" variant="ghost" size="icon-sm" shape="pill" aria-label="Diminuir" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Icon name="minus" size={12} />
          </Button>
          <span className="w-7 text-center text-sm font-semibold tnum">{quantity}</span>
          <Button type="button" variant="ghost" size="icon-sm" shape="pill" aria-label="Aumentar" onClick={() => setQuantity((q) => q + 1)}>
            <Icon name="plus" size={12} />
          </Button>
        </div>
        <Button type="button" size="lg" disabled={!canAdd} onClick={handleAdd} leftIcon="plus" className="flex-1 sm:flex-none">
          Adicionar · {formatBRLCents((unitPriceCents + modifiersCents) * quantity)}
        </Button>
      </div>
    </div>
  );
}

function ItemThumb({ src, alt }: { src: string | null; alt: string }) {
  if (src) {
    return (
      <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg bg-surface-3">
        <Image src={resolveMediaUrl(src) ?? src} alt={alt} fill className="object-cover" unoptimized sizes="48px" />
      </span>
    );
  }
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-subtle-foreground">
      <Icon name="utensils" size={16} />
    </span>
  );
}

export function OrderBuilderSheet({ orgId, tabId, tabLabel, open, onOpenChange }: { orgId: number; tabId: number; tabLabel?: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const isMobile = useIsMobile();
  const { data: menus } = useOrderMenus(open ? orgId : null);
  const publishedMenus = (menus ?? []).filter((m) => m.status === "PUBLISHED");
  const [menuId, setMenuId] = useState<number | null>(null);
  const activeMenuId = menuId ?? publishedMenus.find((m) => m.isMain)?.id ?? publishedMenus[0]?.id ?? null;

  const { data: categories } = useOrderCategories(orgId, open ? activeMenuId : null);
  const { data: items, isLoading } = useOrderMenuItems(orgId, open ? activeMenuId : null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "ALL">("ALL");
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const { create, send } = useVenueOrderMutations(orgId, tabId);

  const activeItems = (items ?? []).filter((i) => i.active && i.product.status !== "ARCHIVED" && i.product.status !== "INACTIVE");
  const filtered = activeItems.filter((i) => (!search || i.product.nome.toLowerCase().includes(search.toLowerCase())) && (categoryFilter === "ALL" || i.categoryId === categoryFilter));

  const byCategory = useMemo(() => {
    const map = new Map<number, VenueMenuItem[]>();
    for (const item of filtered) {
      const list = map.get(item.categoryId) ?? [];
      list.push(item);
      map.set(item.categoryId, list);
    }
    return map;
  }, [filtered]);

  const cartTotalCents = cart.reduce((sum, line) => sum + lineTotal(line), 0);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

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
          modifiers: line.modifiers.map((m) => ({ modifierGroupId: m.modifierGroupId, modifierOptionId: m.modifierOptionId })),
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

  const sending = create.isPending || send.isPending;
  const categoryList = (categories ?? []).filter((c) => c.active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={cn(isMobile ? "h-[92dvh]" : "sm:max-w-2xl")}>
        <SheetHeader>
          <SheetTitle>Novo pedido</SheetTitle>
          {tabLabel ? <SheetDescription>{tabLabel}</SheetDescription> : null}
        </SheetHeader>

        <div className="space-y-3 px-5 pb-3">
          {publishedMenus.length > 1 ? <SelectInput value={activeMenuId ? String(activeMenuId) : undefined} onValueChange={(v) => setMenuId(Number(v))} placeholder="Cardápio" options={publishedMenus.map((m) => ({ value: String(m.id), label: m.nome }))} /> : null}
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar produto…" />
          {categoryList.length > 1 ? (
            <div className="scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5">
              <button type="button" onClick={() => setCategoryFilter("ALL")} className={cn(CHIP, "h-9 min-h-9 shrink-0", categoryFilter === "ALL" ? CHIP_ON : CHIP_OFF)}>
                Tudo
              </button>
              {categoryList.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategoryFilter(c.id)} className={cn(CHIP, "h-9 min-h-9 shrink-0", categoryFilter === c.id ? CHIP_ON : CHIP_OFF)}>
                  {c.nome}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <SheetBody className="gap-5 border-t border-border pt-4">
          {!activeMenuId ? (
            <EmptyState compact icon="utensils" title="Nenhum cardápio publicado" description="Publique um cardápio em Cardápio pra vender por aqui." />
          ) : isLoading ? (
            <RowsSkeleton rows={6} />
          ) : filtered.length === 0 ? (
            <EmptyState compact icon="search" title="Nenhum produto encontrado" description="Ajuste a busca ou cadastre produtos no Cardápio." />
          ) : (
            [...byCategory.entries()].map(([categoryId, categoryItems]) => {
              const category = categoryList.find((c) => c.id === categoryId);
              return (
                <section key={categoryId} className="space-y-2">
                  <h4 className="text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">{category?.nome ?? "Outros"}</h4>
                  <div className="space-y-2">
                    {categoryItems.map((item, i) => {
                      const defaultVariant = item.product.variants.find((v) => v.isDefault) ?? item.product.variants[0];
                      const priceInfo = item.prices.find((p) => p.variantId === defaultVariant?.id);
                      const soldOut = item.product.status === "SOLD_OUT";
                      const expanded = expandedItemId === item.id;
                      return (
                        <div key={item.id} className={cn("row-in rounded-xl border bg-surface shadow-card transition-colors", expanded ? "border-border-strong" : "border-border")} style={{ ["--i" as string]: i } as never}>
                          <button type="button" disabled={soldOut} onClick={() => setExpandedItemId((cur) => (cur === item.id ? null : item.id))} aria-expanded={expanded} className="press flex w-full items-center gap-3 p-3 text-left disabled:opacity-50">
                            <ItemThumb src={item.product.imageUrl} alt={item.product.nome} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{item.product.nome}</p>
                              <p className="mt-0.5 flex items-center gap-2 text-caption text-muted-foreground">
                                <span className="tnum">{formatBRLCents(priceInfo?.effectivePriceCents ?? defaultVariant?.priceCents ?? 0)}</span>
                                {item.product.variants.length > 1 ? <span>· {item.product.variants.length} variações</span> : null}
                                {soldOut ? <StatusBadge tone="warning">Esgotado</StatusBadge> : null}
                              </p>
                            </div>
                            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full transition-colors", expanded ? "bg-brand text-brand-foreground" : "bg-surface-2 text-foreground")}>
                              <Icon name={expanded ? "minus" : "plus"} size={13} />
                            </span>
                          </button>
                          {expanded ? (
                            <div className="px-3 pb-3">
                              <ItemConfigurator orgId={orgId} menuItem={item} onAdd={addToCart} />
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
        </SheetBody>

        {cart.length > 0 ? (
          <div className="max-h-44 overflow-y-auto border-t border-border bg-surface-2/60 px-5 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
              <Icon name="cart" size={11} /> {cartCount === 1 ? "1 item no pedido" : `${cartCount} itens no pedido`}
            </p>
            <ul className="space-y-1.5">
              {cart.map((line) => (
                <li key={line.key} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-foreground">
                      <span className="font-semibold tnum">{line.quantity}×</span> {line.productNome}
                      {line.variantNome ? <span className="text-muted-foreground"> · {line.variantNome}</span> : null}
                    </p>
                    {line.modifiers.length > 0 || line.notes ? <p className="truncate text-caption text-muted-foreground">{[...line.modifiers.map((m) => m.nome), line.notes].filter(Boolean).join(", ")}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-foreground tnum">{formatBRLCents(lineTotal(line))}</span>
                    <Button variant="subtle" size="icon-sm" aria-label="Remover item" className="hover:bg-danger-bg hover:text-danger" onClick={() => removeFromCart(line.key)}>
                      <Icon name="close" size={12} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <SheetFooter className="flex-row items-center justify-between">
          <div>
            <p className="text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Total</p>
            <p className="text-lg font-semibold text-foreground tnum">{formatBRLCents(cartTotalCents)}</p>
          </div>
          <Button size="lg" disabled={cart.length === 0} loading={sending} onClick={handleSubmit} leftIcon="send">
            Enviar pedido
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
