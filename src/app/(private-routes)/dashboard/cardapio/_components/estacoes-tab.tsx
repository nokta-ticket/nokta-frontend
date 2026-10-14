"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { VenuePreparationStation } from "@/services/venue-menu";
import { useVenueStationMutations, useVenueStations } from "../_hooks/use-venue-stations";
import { ReorderControls, buildSwapReorderPayload } from "./reorder-controls";

function StationFormDialog({ open, onOpenChange, station, onSubmit, loading }: { open: boolean; onOpenChange: (v: boolean) => void; station: VenuePreparationStation | null; onSubmit: (values: { nome: string; tipo: string }) => void; loading: boolean }) {
  const [nome, setNome] = useState(station?.nome ?? "");
  const [tipo, setTipo] = useState(station?.tipo ?? "");

  useEffect(() => {
    if (open) {
      setNome(station?.nome ?? "");
      setTipo(station?.tipo ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, station?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{station ? "Editar estação" : "Nova estação"}</DialogTitle>
          <DialogDescription>Cada produto é preparado em uma estação — é pra lá que o pedido vai.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="estacao-nome" required>
            <Input id="estacao-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Bar, Cozinha, Churrasqueira" />
          </Field>
          <Field label="Tipo" htmlFor="estacao-tipo" optional hint="Só pra organizar (bar, cozinha…)">
            <Input id="estacao-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="bar" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={!nome.trim()} loading={loading} onClick={() => onSubmit({ nome: nome.trim(), tipo: tipo.trim() })}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Estações de preparo (Bar, Cozinha…) — direcionam o preparo dos pedidos. */
export function EstacoesTab({ orgId }: { orgId: number }) {
  const { data: stations, isLoading, isError, refetch } = useVenueStations(orgId);
  const { create, update, setActive, reorder } = useVenueStationMutations(orgId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenuePreparationStation | null>(null);

  const list = stations ?? [];

  const handleSubmit = (values: { nome: string; tipo: string }) => {
    const payload = { nome: values.nome, tipo: values.tipo || undefined };
    const mutation = editing ? update.mutateAsync({ stationId: editing.id, payload }) : create.mutateAsync(payload);
    mutation
      .then(() => {
        toast.success(editing ? "Estação atualizada" : "Estação criada");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a estação.")));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    reorder.mutate(buildSwapReorderPayload(list, index, target), { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")) });
  };

  if (isError) return <ErrorState description="Não foi possível carregar as estações." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body text-muted-foreground">Bar, cozinha, copa — o pedido vai pra estação do produto.</p>
        <Button size="sm" leftIcon="plus" onClick={() => { setEditing(null); setFormOpen(true); }}>
          Nova estação
        </Button>
      </div>

      {isLoading ? (
        <RowsSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState icon="fire" title="Nenhuma estação cadastrada" description="Cadastre Bar e Cozinha pra direcionar o preparo dos pedidos." action={<Button leftIcon="plus" onClick={() => setFormOpen(true)}>Nova estação</Button>} />
      ) : (
        <ul className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          {list.map((station, i) => (
            <li key={station.id} className={cn("row-in flex items-center gap-3 px-3 py-3 sm:px-4", i > 0 && "border-t border-border")} style={{ ["--i" as string]: i } as never}>
              <ReorderControls index={i} total={list.length} onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)} disabled={reorder.isPending} />
              <Icon name={station.tipo?.toLowerCase().includes("coz") || station.tipo?.toUpperCase() === "KITCHEN" ? "utensils" : "cocktail"} size={14} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", station.active ? "text-foreground" : "text-muted-foreground")}>{station.nome}</p>
                {station.tipo ? <p className="truncate text-caption text-muted-foreground">{station.tipo}</p> : null}
              </div>
              <Switch checked={station.active} aria-label={station.active ? "Desativar estação" : "Ativar estação"} onCheckedChange={(checked) => setActive.mutate({ stationId: station.id, active: checked }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a estação.")) })} />
              <Button variant="subtle" size="icon-sm" aria-label="Editar" onClick={() => { setEditing(station); setFormOpen(true); }}>
                <Icon name="edit" size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <StationFormDialog open={formOpen} onOpenChange={setFormOpen} station={editing} onSubmit={handleSubmit} loading={create.isPending || update.isPending} />
    </div>
  );
}
