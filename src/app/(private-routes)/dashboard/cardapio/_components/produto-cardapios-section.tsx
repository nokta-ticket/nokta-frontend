"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { centsToBRL } from "@/services/venue-menu";
import { useVenueProduct } from "../_hooks/use-venue-products";
import { useVenueMenus } from "../_hooks/use-venue-menus";
import { useVenueCategories } from "../_hooks/use-venue-categories";
import { useVenueMenuItemMutations } from "../_hooks/use-venue-menu-items";
import { ConfirmDialog } from "./confirm-dialog";
import { MoneyField } from "./money-field";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";
import { ErrorState } from "../../_components/states/error-state";

function AddToMenuForm({
  orgId,
  productId,
  availableMenus,
  onAdded,
}: {
  orgId: number;
  productId: number;
  availableMenus: { id: number; nome: string }[];
  onAdded: () => void;
}) {
  const [menuId, setMenuId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
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
          toast.success("Produto adicionado ao cardápio.");
          setMenuId("");
          setCategoryId("");
          onAdded();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível adicionar ao cardápio.")),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-black/20 p-3">
      <p className="text-sm font-medium text-gray-900">Adicionar a um cardápio</p>
      <div className="grid grid-cols-2 gap-2">
        <Select value={menuId} onValueChange={(v) => { setMenuId(v); setCategoryId(""); }}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Cardápio" /></SelectTrigger>
          <SelectContent>
            {availableMenus.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId} disabled={!menuId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" disabled={!menuId || !categoryId || create.isPending} onClick={handleAdd}>
        <Plus size={14} /> Adicionar
      </Button>
    </div>
  );
}

export function ProdutoCardapiosSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: product, isError, refetch } = useVenueProduct(orgId, productId);
  const { data: allMenus } = useVenueMenus(orgId);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [removing, setRemoving] = useState<{ menuItemId: number; menuId: number; menuNome: string } | null>(
    null,
  );
  const { remove } = useVenueMenuItemMutations(orgId, removing?.menuId ?? -1);

  if (isError) {
    return <ErrorState description="Não foi possível carregar os cardápios do produto." onRetry={() => refetch()} />;
  }
  if (!product) return <BlockSkeleton className="h-64" />;

  const attachedMenuIds = new Set(product.menus.map((m) => m.menuId));
  const availableMenus = (allMenus ?? []).filter(
    (m) => !attachedMenuIds.has(m.id) && m.status !== "ARCHIVED",
  );

  return (
    <div className="space-y-4">
      {product.menus.length === 0 ? (
        <EmptyState
          title="Ainda não está em nenhum cardápio"
          description="Adicione este produto a um cardápio para que ele apareça na operação."
        />
      ) : (
        <ul className="space-y-2">
          {product.menus.map((menuInfo) => (
            <MenuAttachmentRow
              key={menuInfo.menuItemId}
              orgId={orgId}
              menuInfo={menuInfo}
              expanded={expanded === menuInfo.menuItemId}
              onToggleExpand={() =>
                setExpanded((cur) => (cur === menuInfo.menuItemId ? null : menuInfo.menuItemId))
              }
              onRequestRemove={() =>
                setRemoving({
                  menuItemId: menuInfo.menuItemId,
                  menuId: menuInfo.menuId,
                  menuNome: menuInfo.menuNome,
                })
              }
            />
          ))}
        </ul>
      )}

      {availableMenus.length > 0 ? (
        <AddToMenuForm
          orgId={orgId}
          productId={productId}
          availableMenus={availableMenus}
          onAdded={() => refetch()}
        />
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Remover do cardápio"
        description={`Remover este produto de "${removing?.menuNome}"? Isso remove só o vínculo — o produto continua existindo.`}
        confirmLabel="Remover"
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.menuItemId, {
            onSuccess: () => {
              toast.success("Produto removido do cardápio.");
              setRemoving(null);
              refetch();
            },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível remover do cardápio.")),
          });
        }}
      />
    </div>
  );
}

function MenuAttachmentRow({
  orgId,
  menuInfo,
  expanded,
  onToggleExpand,
  onRequestRemove,
}: {
  orgId: number;
  menuInfo: import("@/services/venue-menu").VenueProductMenuInfo;
  expanded: boolean;
  onToggleExpand: () => void;
  onRequestRemove: () => void;
}) {
  const { data: categories } = useVenueCategories(orgId, menuInfo.menuId);
  const { update, remove, setVariantPrice, removeVariantPrice } = useVenueMenuItemMutations(
    orgId,
    menuInfo.menuId,
  );

  return (
    <li className="rounded-xl border border-black/10 bg-white">
      <div className="flex items-center gap-2 p-3">
        <button className="flex flex-1 items-center gap-2 text-left" onClick={onToggleExpand}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span className="font-medium text-gray-900">{menuInfo.menuNome}</span>
        </button>
        <Select
          value={String(menuInfo.categoryId)}
          onValueChange={(v) =>
            update.mutate(
              { menuItemId: menuInfo.menuItemId, payload: { categoryId: Number(v) } },
              { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível trocar a categoria.")) },
            )
          }
        >
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Switch
          checked={menuInfo.active}
          aria-label={menuInfo.active ? "Desativar neste cardápio" : "Ativar neste cardápio"}
          onCheckedChange={(checked) =>
            update.mutate(
              { menuItemId: menuInfo.menuItemId, payload: { active: checked } },
              { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar.")) },
            )
          }
        />
        <Button variant="ghost" size="icon" aria-label="Remover do cardápio" onClick={onRequestRemove}>
          <X size={16} />
        </Button>
      </div>

      {expanded ? (
        <div className="space-y-2 border-t border-black/5 p-3">
          <Label className="text-xs text-black/50">Preço por variação neste cardápio</Label>
          {menuInfo.prices.map((price) => (
            <div key={price.variantId} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 truncate text-black/70">{price.variantNome}</span>
              <span className="w-20 shrink-0 text-xs text-black/40">
                base {centsToBRL(price.basePriceCents)}
              </span>
              <div className="w-28">
                <MoneyField
                  cents={price.overridePriceCents ?? price.basePriceCents}
                  onChange={(cents) =>
                    setVariantPrice.mutate(
                      { menuItemId: menuInfo.menuItemId, variantId: price.variantId, priceCents: cents },
                      {
                        onSuccess: () => toast.success("Preço específico aplicado."),
                        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível definir o preço.")),
                      },
                    )
                  }
                />
              </div>
              {price.overridePriceCents !== null ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    removeVariantPrice.mutate(
                      { menuItemId: menuInfo.menuItemId, variantId: price.variantId },
                      {
                        onSuccess: () => toast.success("Preço específico removido — volta ao preço base."),
                        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível remover o preço.")),
                      },
                    )
                  }
                >
                  Remover
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </li>
  );
}
