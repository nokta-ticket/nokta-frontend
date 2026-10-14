"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { VenueProductModifierGroup } from "@/services/venue-menu";
import { useVenueModifierGroups } from "../_hooks/use-venue-modifier-groups";
import { useVenueProductModifierGroupMutations, useVenueProductModifierGroups } from "../_hooks/use-venue-product-modifier-groups";

function validateRules(required: boolean, minSelect: number, maxSelect: number | null, activeOptions: number) {
  if (minSelect < 0) return "Mínimo não pode ser negativo.";
  if (maxSelect !== null && maxSelect < minSelect) return "Máximo deve ser maior ou igual ao mínimo.";
  if (required && minSelect < 1) return "Grupo obrigatório exige mínimo de pelo menos 1.";
  if (maxSelect !== null && maxSelect > activeOptions) return `Máximo (${maxSelect}) não pode ser maior que as opções ativas do grupo (${activeOptions}).`;
  return null;
}

function LinkRules({ orgId, productId, link, onRequestRemove }: { orgId: number; productId: number; link: VenueProductModifierGroup; onRequestRemove: () => void }) {
  const { update } = useVenueProductModifierGroupMutations(orgId, productId);
  const [required, setRequired] = useState(link.required);
  const [minSelect, setMinSelect] = useState(String(link.minSelect));
  const [maxSelect, setMaxSelect] = useState(link.maxSelect !== null ? String(link.maxSelect) : "");
  const activeOptions = link.group.options.filter((o) => o.active && !o.archivedAt);
  const dirty = required !== link.required || Number(minSelect || 0) !== link.minSelect || (maxSelect.trim() === "" ? null : Number(maxSelect)) !== link.maxSelect;

  const save = () => {
    const min = Number(minSelect) || 0;
    const max = maxSelect.trim() === "" ? null : Number(maxSelect);
    const error = validateRules(required, min, max, activeOptions.length);
    if (error) {
      toast.error(error);
      return;
    }
    update.mutate({ linkId: link.id, payload: { required, minSelect: min, maxSelect: max ?? undefined } }, { onSuccess: () => toast.success("Regras salvas"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar as regras.")) });
  };

  return (
    <div className="surface-inset space-y-3 rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{link.group.nome}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {activeOptions.length === 0 ? <span className="text-caption text-warning">Sem opções ativas — edite o grupo na aba Adicionais.</span> : null}
            {activeOptions.map((o) => (
              <span key={o.id} className="inline-flex items-center rounded-pill bg-surface px-2 py-0.5 text-caption text-muted-foreground hairline">
                {o.nome}
              </span>
            ))}
          </div>
        </div>
        <Button variant="subtle" size="icon-sm" aria-label="Remover grupo do produto" title="Remover do produto" className="hover:bg-danger-bg hover:text-danger" onClick={onRequestRemove}>
          <Icon name="close" size={14} />
        </Button>
      </div>
      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[auto_1fr_1fr_auto]">
        <label className="flex items-center gap-2 text-sm text-foreground sm:pb-2.5">
          <Switch checked={required} onCheckedChange={setRequired} aria-label="Obrigatório" />
          Obrigatório
        </label>
        <Field label="Mínimo" htmlFor={`min-${link.id}`}>
          <Input id={`min-${link.id}`} type="number" inputMode="numeric" min={0} value={minSelect} onChange={(e) => setMinSelect(e.target.value)} />
        </Field>
        <Field label="Máximo" htmlFor={`max-${link.id}`}>
          <Input id={`max-${link.id}`} type="number" inputMode="numeric" min={0} placeholder="Sem limite" value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)} />
        </Field>
        <Button size="sm" className={cn("col-span-2 sm:col-span-1 sm:mb-0.5", !dirty && "invisible")} loading={update.isPending} onClick={save}>
          Salvar regras
        </Button>
      </div>
    </div>
  );
}

/**
 * Grupos de adicionais vinculados ao produto, como chips: os já vinculados
 * expandem as regras (obrigatório/mín/máx); os disponíveis aparecem como
 * chips tracejados — um toque vincula.
 */
export function ProdutoAdicionaisSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: links, isLoading, isError, refetch } = useVenueProductModifierGroups(orgId, productId);
  const { data: allGroups } = useVenueModifierGroups(orgId);
  const { create, remove } = useVenueProductModifierGroupMutations(orgId, productId);
  const [removing, setRemoving] = useState<VenueProductModifierGroup | null>(null);

  if (isError) return <ErrorState description="Não foi possível carregar os adicionais do produto." onRetry={() => refetch()} />;
  if (isLoading) return <RowsSkeleton rows={2} />;

  const list = links ?? [];
  const linkedIds = new Set(list.map((l) => l.modifierGroupId));
  const available = (allGroups ?? []).filter((g) => !linkedIds.has(g.id) && g.active);

  const link = (groupId: number) => create.mutate({ modifierGroupId: groupId }, { onSuccess: () => toast.success("Grupo vinculado"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível vincular o grupo.")) });

  return (
    <div className="space-y-5">
      {list.length === 0 ? (
        <EmptyState compact icon="layers" title="Nenhum adicional neste produto" description={available.length > 0 ? "Toque num grupo abaixo pra vincular." : "Crie grupos na aba Adicionais do cardápio."} />
      ) : (
        <div className="space-y-3">{list.map((l) => <LinkRules key={l.id} orgId={orgId} productId={productId} link={l} onRequestRemove={() => setRemoving(l)} />)}</div>
      )}

      {available.length > 0 ? (
        <div>
          <p className="mb-2 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Vincular grupo</p>
          <div className="flex flex-wrap gap-2">
            {available.map((g) => (
              <button key={g.id} type="button" disabled={create.isPending} onClick={() => link(g.id)} className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-dashed border-border-strong px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand disabled:opacity-50">
                <Icon name="plus" size={11} />
                {g.nome}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Remover adicional do produto"
        description={`Remover "${removing?.group.nome}" deste produto? O grupo continua existindo pra outros produtos.`}
        confirmLabel="Remover"
        danger
        onConfirm={async () => {
          if (!removing) return;
          try {
            await remove.mutateAsync(removing.id);
            toast.success("Grupo removido do produto");
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível remover o vínculo."));
            throw err;
          }
        }}
      />
    </div>
  );
}
