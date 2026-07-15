"use client";

import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { venueMenuApi, centsToBRL, type VenueModifierGroup, type VenueModifierOption } from "@/services/venue-menu";
import {
  useVenueModifierGroup,
  useVenueModifierGroupMutations,
  useVenueModifierGroups,
  useVenueModifierOptionMutations,
} from "../_hooks/use-venue-modifier-groups";
import { venueKeys } from "../_hooks/query-keys";
import { ActiveBadge } from "./venue-status-badge";
import { ReorderControls, buildSwapReorderPayload } from "./reorder-controls";
import { ConfirmDialog } from "./confirm-dialog";
import { MoneyField } from "./money-field";
import { ModifierComponentsDialog } from "../../estoque/_components/modifier-components-dialog";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

function GroupFormDialog({
  open,
  onOpenChange,
  group,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: VenueModifierGroup | null;
  onSubmit: (nome: string) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState(group?.nome ?? "");

  // Radix só chama onOpenChange em fechamentos internos — abrir é uma
  // mudança de prop externa e não dispara esse callback, por isso o
  // preenchimento do form precisa reagir a `open`/`group` via useEffect.
  useEffect(() => {
    if (open) setNome(group?.nome ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{group ? "Editar grupo" : "Novo grupo de adicionais"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="grupo-nome">Nome</Label>
          <Input
            id="grupo-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Ponto da carne, Adicionais, Molhos"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={loading || !nome.trim()} onClick={() => onSubmit(nome.trim())}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptionFormDialog({
  open,
  onOpenChange,
  option,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  option: VenueModifierOption | null;
  onSubmit: (values: { nome: string; priceCents: number }) => void;
  loading: boolean;
}) {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{option ? "Editar opção" : "Nova opção"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opcao-nome">Nome</Label>
            <Input
              id="opcao-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Bacon, Ao ponto, Zero"
            />
          </div>
          <MoneyField label="Acréscimo (R$ 0,00 = grátis)" cents={priceCents} onChange={setPriceCents} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={loading || !nome.trim()} onClick={() => onSubmit({ nome: nome.trim(), priceCents })}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupOptionsSheet({
  orgId,
  group,
  onOpenChange,
}: {
  orgId: number;
  group: VenueModifierGroup | null;
  onOpenChange: (v: boolean) => void;
}) {
  const { create, update, archive, setActive, reorder } = useVenueModifierOptionMutations(
    orgId,
    group?.id ?? -1,
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueModifierOption | null>(null);
  const [archiving, setArchiving] = useState<VenueModifierOption | null>(null);
  const [stockOption, setStockOption] = useState<VenueModifierOption | null>(null);

  // Busca fresca sempre que o grupo muda — usa o endpoint de detalhe (já inclui options).
  const detail = useVenueModifierGroup(orgId, group?.id ?? null);

  const options = detail.data?.options ?? [];

  const handleSubmit = (values: { nome: string; priceCents: number }) => {
    const mutation = editing
      ? update.mutateAsync({ optionId: editing.id, payload: values })
      : create.mutateAsync(values);
    mutation
      .then(() => {
        toast.success(editing ? "Opção atualizada." : "Opção criada.");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a opção.")));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const payload = buildSwapReorderPayload(options, index, target);
    reorder.mutate(payload, {
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")),
    });
  };

  return (
    <Sheet open={group !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Opções — {group?.nome}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} /> Nova opção
          </Button>

          {options.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/50">Nenhuma opção cadastrada ainda.</p>
          ) : (
            <ul className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white">
              {options.map((option, i) => (
                <li key={option.id} className="flex items-center gap-2 px-3 py-2.5">
                  <ReorderControls
                    index={i}
                    total={options.length}
                    onMoveUp={() => move(i, -1)}
                    onMoveDown={() => move(i, 1)}
                    disabled={reorder.isPending}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{option.nome}</p>
                    <p className="text-xs text-black/50">
                      {option.priceCents === 0 ? "Grátis" : `+ ${centsToBRL(option.priceCents)}`}
                    </p>
                  </div>
                  {option.archivedAt ? (
                    <ActiveBadge active={false} />
                  ) : (
                    <Switch
                      checked={option.active}
                      aria-label={option.active ? "Desativar opção" : "Ativar opção"}
                      onCheckedChange={(checked) =>
                        setActive.mutate(
                          { optionId: option.id, active: checked },
                          {
                            onError: (err) =>
                              toast.error(getErrorMessage(err, "Não foi possível atualizar a opção.")),
                          },
                        )
                      }
                    />
                  )}
                  {!option.archivedAt ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setStockOption(option)}>
                        Estoque
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditing(option); setFormOpen(true); }}
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setArchiving(option)}>
                        Arquivar
                      </Button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <OptionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          option={editing}
          onSubmit={handleSubmit}
          loading={create.isPending || update.isPending}
        />
        <ModifierComponentsDialog
          orgId={orgId}
          modifierOptionId={stockOption?.id ?? null}
          optionName={stockOption?.nome}
          open={stockOption !== null}
          onOpenChange={(v) => !v && setStockOption(null)}
        />
        <ConfirmDialog
          open={archiving !== null}
          onOpenChange={(v) => !v && setArchiving(null)}
          title="Arquivar opção"
          description={`Arquivar "${archiving?.nome}"? Ela deixa de poder ser oferecida, mas não é excluída.`}
          confirmLabel="Arquivar"
          loading={archive.isPending}
          onConfirm={() => {
            if (!archiving) return;
            archive.mutate(archiving.id, {
              onSuccess: () => { toast.success("Opção arquivada."); setArchiving(null); },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar a opção.")),
            });
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

  const detailQueries = useQueries({
    queries: list.map((g) => ({
      queryKey: venueKeys.modifierGroup(orgId, g.id),
      queryFn: () => venueMenuApi.getModifierGroup(orgId, g.id),
      staleTime: 60_000,
    })),
  });

  const handleSubmit = (nome: string) => {
    const mutation = editing
      ? update.mutateAsync({ groupId: editing.id, payload: { nome } })
      : create.mutateAsync({ nome });
    mutation
      .then(() => {
        toast.success(editing ? "Grupo atualizado." : "Grupo criado.");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar o grupo.")));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const payload = buildSwapReorderPayload(list, index, target);
    reorder.mutate(payload, {
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")),
    });
  };

  if (isError) {
    return <ErrorState description="Não foi possível carregar os adicionais." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/60">
          Grupos reutilizáveis (Ponto da carne, Molhos…), vinculados aos produtos na edição de cada um.
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} /> Novo grupo
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhum grupo de adicionais"
          description="Crie grupos de adicionais para oferecer opções e personalizações aos clientes."
          actionLabel="Novo grupo"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <ul className="divide-y divide-black/5">
            {list.map((group, i) => (
              <li key={group.id} className="flex items-center gap-3 px-4 py-3">
                <ReorderControls
                  index={i}
                  total={list.length}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  disabled={reorder.isPending}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{group.nome}</p>
                  <p className="text-xs text-black/50">
                    {detailQueries[i]?.data?.options.length ?? "—"} opções
                  </p>
                </div>
                <ActiveBadge active={group.active} />
                <Switch
                  checked={group.active}
                  aria-label={group.active ? "Desativar grupo" : "Ativar grupo"}
                  onCheckedChange={(checked) =>
                    setActive.mutate(
                      { groupId: group.id, active: checked },
                      {
                        onError: (err) =>
                          toast.error(getErrorMessage(err, "Não foi possível atualizar o grupo.")),
                      },
                    )
                  }
                />
                <Button variant="outline" size="sm" onClick={() => setOpenOptionsFor(group)}>
                  Opções
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditing(group); setFormOpen(true); }}
                >
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <GroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editing}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />

      <GroupOptionsSheet
        orgId={orgId}
        group={openOptionsFor}
        onOpenChange={(v) => !v && setOpenOptionsFor(null)}
      />
    </div>
  );
}
