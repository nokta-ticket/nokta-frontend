"use client";

import { useState } from "react";
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
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenuePreparationStation } from "@/services/venue-menu";
import { useVenueStationMutations, useVenueStations } from "../_hooks/use-venue-stations";
import { ActiveBadge } from "./venue-status-badge";
import { ReorderControls, buildSwapReorderPayload } from "./reorder-controls";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

function StationFormDialog({
  open,
  onOpenChange,
  station,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  station: VenuePreparationStation | null;
  onSubmit: (values: { nome: string; tipo: string }) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState(station?.nome ?? "");
  const [tipo, setTipo] = useState(station?.tipo ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setNome(station?.nome ?? "");
          setTipo(station?.tipo ?? "");
        }
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{station ? "Editar estação" : "Nova estação"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="estacao-nome">Nome</Label>
            <Input
              id="estacao-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Bar, Cozinha, Churrasqueira"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estacao-tipo">Tipo (opcional)</Label>
            <Input
              id="estacao-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ex.: bar, cozinha"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            disabled={loading || !nome.trim()}
            onClick={() => onSubmit({ nome: nome.trim(), tipo: tipo.trim() })}
          >
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EstacoesTab({ orgId }: { orgId: number }) {
  const { data: stations, isLoading, isError, refetch } = useVenueStations(orgId);
  const { create, update, setActive, reorder } = useVenueStationMutations(orgId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenuePreparationStation | null>(null);

  const list = stations ?? [];

  const handleSubmit = (values: { nome: string; tipo: string }) => {
    const payload = { nome: values.nome, tipo: values.tipo || undefined };
    const mutation = editing
      ? update.mutateAsync({ stationId: editing.id, payload })
      : create.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(editing ? "Estação atualizada." : "Estação criada.");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a estação.")));
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
    return <ErrorState description="Não foi possível carregar as estações." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/60">
          Direcione produtos para o setor correto de preparo (Bar, Cozinha, Copa…).
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} /> Nova estação
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhuma estação cadastrada"
          description="Cadastre estações como Bar e Cozinha para direcionar o preparo dos pedidos."
          actionLabel="Nova estação"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <ul className="divide-y divide-black/5">
            {list.map((station, i) => (
              <li key={station.id} className="flex items-center gap-3 px-4 py-3">
                <ReorderControls
                  index={i}
                  total={list.length}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  disabled={reorder.isPending}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{station.nome}</p>
                  {station.tipo ? <p className="text-xs text-black/50">{station.tipo}</p> : null}
                </div>
                <ActiveBadge active={station.active} />
                <Switch
                  checked={station.active}
                  aria-label={station.active ? "Desativar estação" : "Ativar estação"}
                  onCheckedChange={(checked) =>
                    setActive.mutate(
                      { stationId: station.id, active: checked },
                      {
                        onError: (err) =>
                          toast.error(getErrorMessage(err, "Não foi possível atualizar a estação.")),
                      },
                    )
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(station);
                    setFormOpen(true);
                  }}
                >
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <StationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        station={editing}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />
    </div>
  );
}
