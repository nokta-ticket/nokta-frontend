"use client";

import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { venueMenuApi, type VenueModifierGroup, type VenueModifierOption } from "@/services/venue-menu";
import { useVenueModifierGroup, useVenueModifierGroupMutations, useVenueModifierGroups, useVenueModifierOptionMutations } from "../_hooks/use-venue-modifier-groups";
import { venueKeys } from "../_hooks/query-keys";
import { ReorderControls, buildSwapReorderPayload } from "./reorder-controls";
import { MoneyField } from "./money-field";
import { ModifierComponentsDialog } from "../../estoque/_components/modifier-components-dialog";

function GroupFormDialog({ open, onOpenChange, group, onSubmit, loading }: { open: boolean; onOpenChange: (v: boolean) => void; group: VenueModifierGroup | null; onSubmit: (nome: string) => void; loading: boolean }) {
  const [nome, setNome] = useState(group?.nome ?? "");
  // Abrir é mudança de prop externa (Radix não chama onOpenChange) — preenche via efeito.
  useEffect(() => {
    if (open) setNome(group?.nome ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{group ? "Editar grupo" : "Novo grupo de adicionais"}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="grupo-nome" required hint="Ex.: Ponto da carne, Molhos, Fruta da caipirinha">
            <Input id="grupo-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Molhos" onKeyDown={(e) => e.key === "Enter" && nome.trim() && onSubmit(nome.trim())} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={!nome.trim()} loading={loading} onClick={() => onSubmit(nome.trim())}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptionFormDialog({ open, onOpenChange, option, onSubmit, loading }: { open: boolean; onOpenChange: (v: boolean) => void; option: VenueModifierOption | null; onSubmit: (values: { nome: string; priceCents: number }) => void; loading: boolean }) {
  const [nome, setNome] = useState(option?.nome ?? "");
  const [priceCents, setPriceCents] = useState(option?.priceCents ?? 0);
  useEffect(() => {
    if (open) {
      setNome(option?.nome ?? "");
      setPriceCents(option?.priceCents ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, option?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{option ? "Editar opção" : "Nova opção"}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="opcao-nome" required>
            <Input id="opcao-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Bacon, Ao ponto, Sem açúcar" />
          </Field>
          <MoneyField id="opcao-preco" label="Acréscimo (R$ 0,00 = grátis)" cents={priceCents} onChange={setPriceCents} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={!nome.trim()} loading={loading} onClick={() => onSubmit({ nome: nome.trim(), priceCents })}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupOptionsSheet({ orgId, group, onOpenChange }: { orgId: number; group: VenueModifierGroup | null; onOpenChange: (v: boolean) => void }) {
  const { create, update, archive, setActive, reorder } = useVenueModifierOptionMutations(orgId, group?.id ?? -1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueModifierOption | null>(null);
  const [archiving, setArchiving] = useState<VenueModifierOption | null>(null);
  const [stockOption, setStockOption] = useState<VenueModifierOption | null>(null);
  const detail = useVenueModifierGroup(orgId, group?.id ?? null);
  const options = detail.data?.options ?? [];

  const handleSubmit = (values: { nome: string; priceCents: number }) => {
    const mutation = editing ? update.mutateAsync({ optionId: editing.id, payload: values }) : create.mutateAsync(values);
    mutation
      .then(() => {
        toast.success(editing ? "Opção atualizada" : "Opção criada");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a opção.")));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    reorder.mutate(buildSwapReorderPayload(options, index, target), { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")) });
  };

  return (
    <Sheet open={group !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{group?.nome}</SheetTitle>
          <SheetDescription>Opções que o cliente escolhe dentro deste grupo.</SheetDescription>
        </SheetHeader>
        <SheetBody className="gap-4">
          <Button size="sm" leftIcon="plus" className="w-fit" onClick={() => { setEditing(null); setFormOpen(true); }}>
            Nova opção
          </Button>

          {detail.isLoading ? (
            <RowsSkeleton rows={3} />
          ) : options.length === 0 ? (
            <EmptyState compact icon="tag" title="Nenhuma opção ainda" description="Ex.: Bacon (+R$ 5), Cheddar (+R$ 4), Sem cebola (grátis)." />
          ) : (
            <ul className="overflow-hidden rounded-card border border-border bg-surface">
              {options.map((option, i) => {
                const archived = Boolean(option.archivedAt);
                return (
                  <li key={option.id} className={cn("flex items-center gap-2 px-3 py-2.5", i > 0 && "border-t border-border", archived && "opacity-60")}>
                    <ReorderControls index={i} total={options.length} onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)} disabled={reorder.isPending || archived} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{option.nome}</p>
                      <p className="text-caption text-muted-foreground tnum">{option.priceCents === 0 ? "Grátis" : `+ ${formatBRLCents(option.priceCents)}`}{archived ? " · arquivada" : ""}</p>
                    </div>
                    {archived ? (
                      <StatusBadge tone="neutral">Arquivada</StatusBadge>
                    ) : (
                      <>
                        <Switch checked={option.active} aria-label={option.active ? "Desativar opção" : "Ativar opção"} onCheckedChange={(checked) => setActive.mutate({ optionId: option.id, active: checked }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a opção.")) })} />
                        <Button variant="subtle" size="icon-sm" aria-label="Consumo de estoque" title="Consumo de estoque" onClick={() => setStockOption(option)}>
                          <Icon name="box" size={14} />
                        </Button>
                        <Button variant="subtle" size="icon-sm" aria-label="Editar" title="Editar" onClick={() => { setEditing(option); setFormOpen(true); }}>
                          <Icon name="edit" size={14} />
                        </Button>
                        <Button variant="subtle" size="icon-sm" aria-label="Arquivar" title="Arquivar" className="hover:bg-danger-bg hover:text-danger" onClick={() => setArchiving(option)}>
                          <Icon name="trash" size={14} />
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SheetBody>

        <OptionFormDialog open={formOpen} onOpenChange={setFormOpen} option={editing} onSubmit={handleSubmit} loading={create.isPending || update.isPending} />
        <ModifierComponentsDialog orgId={orgId} modifierOptionId={stockOption?.id ?? null} optionName={stockOption?.nome} open={stockOption !== null} onOpenChange={(v) => !v && setStockOption(null)} />
        <ConfirmDialog
          open={archiving !== null}
          onOpenChange={(v) => !v && setArchiving(null)}
          title="Arquivar opção"
          description={`Arquivar "${archiving?.nome}"? Ela deixa de ser oferecida, mas não é excluída.`}
          confirmLabel="Arquivar"
          danger
          onConfirm={async () => {
            if (!archiving) return;
            try {
              await archive.mutateAsync(archiving.id);
              toast.success("Opção arquivada");
            } catch (err) {
              toast.error(getErrorMessage(err, "Não foi possível arquivar a opção."));
              throw err;
            }
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

export function AdicionaisTab({ orgId }: { orgId: number }) {
  const { data: groups, isLoading, isError, refetch } = useVenueModifierGroups(orgId);
  const { create, update, setActive, reorder } = useVenueModifierGroupMutations(orgId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueModifierGroup | null>(null);
  const [openOptionsFor, setOpenOptionsFor] = useState<VenueModifierGroup | null>(null);

  const list = groups ?? [];
  const detailQueries = useQueries({ queries: list.map((g) => ({ queryKey: venueKeys.modifierGroup(orgId, g.id), queryFn: () => venueMenuApi.getModifierGroup(orgId, g.id), staleTime: 60_000 })) });

  const handleSubmit = (nome: string) => {
    const mutation = editing ? update.mutateAsync({ groupId: editing.id, payload: { nome } }) : create.mutateAsync({ nome });
    mutation
      .then(() => {
        toast.success(editing ? "Grupo atualizado" : "Grupo criado");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar o grupo.")));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    reorder.mutate(buildSwapReorderPayload(list, index, target), { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")) });
  };

  if (isError) return <ErrorState description="Não foi possível carregar os adicionais." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body text-muted-foreground">Grupos reutilizáveis (Molhos, Ponto da carne…) — vincule a cada produto na edição dele.</p>
        <Button size="sm" leftIcon="plus" className="shrink-0" onClick={() => { setEditing(null); setFormOpen(true); }}>
          Novo grupo
        </Button>
      </div>

      {isLoading ? (
        <RowsSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState icon="layers" title="Nenhum grupo de adicionais" description="Crie grupos pra oferecer opções e personalizações aos clientes." action={<Button leftIcon="plus" onClick={() => setFormOpen(true)}>Novo grupo</Button>} />
      ) : (
        <ul className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          {list.map((group, i) => {
            const options = detailQueries[i]?.data?.options ?? null;
            const active = options?.filter((o) => o.active && !o.archivedAt) ?? null;
            return (
              <li key={group.id} className={cn("row-in flex items-center gap-3 px-3 py-3 sm:px-4", i > 0 && "border-t border-border")} style={{ ["--i" as string]: i } as never}>
                <ReorderControls index={i} total={list.length} onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)} disabled={reorder.isPending} />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", group.active ? "text-foreground" : "text-muted-foreground")}>{group.nome}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {active === null ? (
                      <span className="text-caption text-subtle-foreground">carregando opções…</span>
                    ) : active.length === 0 ? (
                      <span className="text-caption text-warning">Sem opções ativas</span>
                    ) : (
                      <>
                        {active.slice(0, 4).map((o) => (
                          <span key={o.id} className="inline-flex items-center rounded-pill bg-surface-2 px-2 py-0.5 text-caption text-muted-foreground">
                            {o.nome}
                            {o.priceCents > 0 ? <span className="ml-1 tnum text-subtle-foreground">+{formatBRLCents(o.priceCents)}</span> : null}
                          </span>
                        ))}
                        {active.length > 4 ? <span className="inline-flex items-center rounded-pill bg-surface-2 px-2 py-0.5 text-caption text-subtle-foreground tnum">+{active.length - 4}</span> : null}
                      </>
                    )}
                  </div>
                </div>
                <Switch checked={group.active} aria-label={group.active ? "Desativar grupo" : "Ativar grupo"} onCheckedChange={(checked) => setActive.mutate({ groupId: group.id, active: checked }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar o grupo.")) })} />
                <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => setOpenOptionsFor(group)}>
                  Opções
                </Button>
                <Button variant="subtle" size="icon-sm" className="sm:hidden" aria-label="Opções" onClick={() => setOpenOptionsFor(group)}>
                  <Icon name="list" size={14} />
                </Button>
                <Button variant="subtle" size="icon-sm" aria-label="Editar grupo" onClick={() => { setEditing(group); setFormOpen(true); }}>
                  <Icon name="edit" size={14} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <GroupFormDialog open={formOpen} onOpenChange={setFormOpen} group={editing} onSubmit={handleSubmit} loading={create.isPending || update.isPending} />
      <GroupOptionsSheet orgId={orgId} group={openOptionsFor} onOpenChange={(v) => !v && setOpenOptionsFor(null)} />
    </div>
  );
}
