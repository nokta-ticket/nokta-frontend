"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { VENUE_STOCK_CONTROL_LABEL, type VenueProductVariant, type VenueStockControl } from "@/services/venue-menu";
import { useVenueVariantMutations, useVenueVariants } from "../_hooks/use-venue-variants";
import { ProductStatusBadge } from "./venue-status-badge";
import { ReorderControls, buildSwapReorderPayload } from "./reorder-controls";
import { MoneyField } from "./money-field";

type Draft = { nome: string; sku: string; priceCents: number; stockControl: VenueStockControl };
const toDraft = (v: VenueProductVariant | null): Draft => ({ nome: v?.nome ?? "", sku: v?.sku ?? "", priceCents: v?.priceCents ?? 0, stockControl: v?.stockControl ?? "NONE" });

/**
 * Linha editável de variação: nome, SKU, preço e controle de estoque
 * inline; "Salvar" só aparece quando algo mudou. Ações (padrão, esgotada,
 * arquivar) ficam inline como ícones.
 */
function VariantRow({
  variant,
  index,
  total,
  canArchive,
  pending,
  onMove,
  onSave,
  onSetDefault,
  onToggleSoldOut,
  onArchive,
}: {
  variant: VenueProductVariant;
  index: number;
  total: number;
  canArchive: boolean;
  pending: boolean;
  onMove: (direction: -1 | 1) => void;
  onSave: (draft: Draft) => Promise<unknown>;
  onSetDefault: () => void;
  onToggleSoldOut: () => void;
  onArchive: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(variant));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setDraft(toDraft(variant));
  }, [variant]);

  const archived = variant.status === "ARCHIVED";
  const dirty = draft.nome !== variant.nome || draft.sku !== (variant.sku ?? "") || draft.priceCents !== variant.priceCents || draft.stockControl !== variant.stockControl;

  const save = async () => {
    if (!draft.nome.trim()) {
      toast.error("Informe o nome da variação.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...draft, nome: draft.nome.trim(), sku: draft.sku.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={cn("space-y-3 px-3 py-3 sm:px-4", index > 0 && "border-t border-border", archived && "opacity-60")}>
      <div className="flex items-center gap-2">
        <ReorderControls index={index} total={total} onMoveUp={() => onMove(-1)} onMoveDown={() => onMove(1)} disabled={pending || archived} />
        <button type="button" onClick={onSetDefault} disabled={variant.isDefault || archived || pending} aria-label={variant.isDefault ? "Variação padrão" : "Definir como padrão"} title={variant.isDefault ? "Variação padrão" : "Definir como padrão"} className={cn("flex size-8 shrink-0 items-center justify-center rounded-full transition-colors", variant.isDefault ? "text-brand" : "text-subtle-foreground hover:bg-surface-2 hover:text-foreground disabled:hover:bg-transparent")}>
          <Icon name={variant.isDefault ? "star" : "star-outline"} size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {variant.nome}
            {variant.isDefault ? <span className="ml-2 text-caption font-normal text-brand">padrão</span> : null}
          </p>
        </div>
        <ProductStatusBadge status={variant.status} />
        {!archived ? (
          <>
            <Button variant="subtle" size="icon-sm" aria-label={variant.status === "SOLD_OUT" ? "Reativar" : "Marcar esgotada"} title={variant.status === "SOLD_OUT" ? "Reativar" : "Marcar esgotada"} disabled={pending} onClick={onToggleSoldOut}>
              <Icon name={variant.status === "SOLD_OUT" ? "check-circle" : "ban"} size={14} />
            </Button>
            <Button variant="subtle" size="icon-sm" aria-label="Arquivar" title={canArchive ? "Arquivar" : "Mantenha ao menos uma variação ativa"} disabled={!canArchive || pending} className="hover:bg-danger-bg hover:text-danger disabled:opacity-40" onClick={onArchive}>
              <Icon name="trash" size={14} />
            </Button>
          </>
        ) : null}
      </div>

      {!archived ? (
        <div className="grid grid-cols-2 gap-2 pl-9 sm:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <Input aria-label="Nome da variação" value={draft.nome} onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))} placeholder="Ex.: 500 ml" className="col-span-2 sm:col-span-1" />
          <Input aria-label="SKU" value={draft.sku} onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} placeholder="SKU" />
          <MoneyField cents={draft.priceCents} onChange={(cents) => setDraft((d) => ({ ...d, priceCents: cents }))} />
          <NativeSelect aria-label="Controle de estoque" value={draft.stockControl} onChange={(e) => setDraft((d) => ({ ...d, stockControl: e.target.value as VenueStockControl }))} className="col-span-2 sm:col-span-1">
            {Object.entries(VENUE_STOCK_CONTROL_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
          {dirty ? (
            <div className="col-span-2 flex justify-end gap-2 sm:col-span-4">
              <Button variant="ghost" size="sm" onClick={() => setDraft(toDraft(variant))} disabled={saving}>
                Descartar
              </Button>
              <Button size="sm" leftIcon="check" loading={saving} onClick={save}>
                Salvar variação
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function NewVariantRow({ onCreate, loading, onCancel }: { onCreate: (draft: Draft) => Promise<unknown>; loading: boolean; onCancel: () => void }) {
  const [draft, setDraft] = useState<Draft>(toDraft(null));
  return (
    <li className="space-y-3 border-t border-dashed border-border-strong bg-surface-2/40 px-3 py-3 sm:px-4">
      <p className="text-sm font-medium text-foreground">Nova variação</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <Input autoFocus aria-label="Nome da variação" value={draft.nome} onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))} placeholder="Ex.: 500 ml" className="col-span-2 sm:col-span-1" />
        <Input aria-label="SKU" value={draft.sku} onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} placeholder="SKU (opcional)" />
        <MoneyField cents={draft.priceCents} onChange={(cents) => setDraft((d) => ({ ...d, priceCents: cents }))} />
        <NativeSelect aria-label="Controle de estoque" value={draft.stockControl} onChange={(e) => setDraft((d) => ({ ...d, stockControl: e.target.value as VenueStockControl }))} className="col-span-2 sm:col-span-1">
          {Object.entries(VENUE_STOCK_CONTROL_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button size="sm" leftIcon="plus" loading={loading} disabled={!draft.nome.trim()} onClick={() => onCreate({ ...draft, nome: draft.nome.trim(), sku: draft.sku.trim() })}>
          Adicionar
        </Button>
      </div>
    </li>
  );
}

export function ProdutoVariantesSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: variants, isLoading, isError, refetch } = useVenueVariants(orgId, productId);
  const { create, update, setDefault, archive, setAvailability, reorder } = useVenueVariantMutations(orgId, productId);
  const [adding, setAdding] = useState(false);
  const [archiving, setArchiving] = useState<VenueProductVariant | null>(null);

  const list = variants ?? [];
  const activeCount = list.filter((v) => v.status !== "ARCHIVED").length;
  const pending = setDefault.isPending || setAvailability.isPending || reorder.isPending;

  if (isError) return <ErrorState description="Não foi possível carregar as variações." onRetry={() => refetch()} />;
  if (isLoading) return <RowsSkeleton rows={2} />;

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    reorder.mutate(buildSwapReorderPayload(list, index, target), { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")) });
  };

  const toPayload = (d: Draft) => ({ nome: d.nome, sku: d.sku || undefined, priceCents: d.priceCents, stockControl: d.stockControl });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body text-muted-foreground">Tamanhos e versões do mesmo produto (300 ml, 500 ml, dose, jarra). A padrão é a que aparece primeiro.</p>
        <Button size="sm" leftIcon="plus" className="shrink-0" disabled={adding} onClick={() => setAdding(true)}>
          Nova variação
        </Button>
      </div>

      {list.length === 0 && !adding ? (
        <EmptyState compact icon="layers" title="Sem variações" description="Todo produto precisa de pelo menos uma." action={<Button size="sm" leftIcon="plus" onClick={() => setAdding(true)}>Nova variação</Button>} />
      ) : (
        <ul className="overflow-hidden rounded-card border border-border bg-surface">
          {list.map((variant, i) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              index={i}
              total={list.length}
              canArchive={variant.status !== "ARCHIVED" && activeCount > 1}
              pending={pending}
              onMove={(direction) => move(i, direction)}
              onSave={(draft) =>
                update.mutateAsync({ variantId: variant.id, payload: toPayload(draft) }).then(() => toast.success("Variação salva")).catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a variação.")))
              }
              onSetDefault={() => setDefault.mutate(variant.id, { onSuccess: () => toast.success("Variação padrão definida"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível definir como padrão.")) })}
              onToggleSoldOut={() => setAvailability.mutate({ variantId: variant.id, status: variant.status === "SOLD_OUT" ? "ACTIVE" : "SOLD_OUT" }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a disponibilidade.")) })}
              onArchive={() => setArchiving(variant)}
            />
          ))}
          {adding ? (
            <NewVariantRow
              loading={create.isPending}
              onCancel={() => setAdding(false)}
              onCreate={(draft) =>
                create
                  .mutateAsync(toPayload(draft))
                  .then(() => {
                    toast.success("Variação criada");
                    setAdding(false);
                  })
                  .catch((err) => toast.error(getErrorMessage(err, "Não foi possível criar a variação.")))
              }
            />
          ) : null}
        </ul>
      )}

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Arquivar variação"
        description={archiving?.isDefault ? `"${archiving?.nome}" é a variação padrão. Ao arquivar, outra vira padrão automaticamente.` : `Arquivar "${archiving?.nome}"?`}
        confirmLabel="Arquivar"
        danger
        onConfirm={async () => {
          if (!archiving) return;
          try {
            await archive.mutateAsync(archiving.id);
            toast.success("Variação arquivada");
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível arquivar a variação."));
            throw err;
          }
        }}
      />
    </div>
  );
}
