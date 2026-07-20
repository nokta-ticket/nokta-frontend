"use client";

import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { centsToBRL } from "@/services/venue-menu";
import type { VenueTable } from "@/services/venue-operation";
import { useVenueAreaMutations, useVenueAreas, useVenueTableMutations, useVenueTables } from "../_hooks/use-venue-areas-tables";
import { CreateTabDialog } from "./create-tab-dialog";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function AreaFormDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (nome: string) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState("");
  useEffect(() => {
    if (open) setNome("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova área</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="area-nome">Nome</Label>
          <Input id="area-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Salão, Deck, Camarote" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button disabled={loading || !nome.trim()} onClick={() => onSubmit(nome.trim())}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TableFormDialog({
  open,
  onOpenChange,
  areas,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  areas: { id: number; nome: string }[];
  onSubmit: (values: { areaId: number; nome: string; capacidade?: number }) => void;
  loading: boolean;
}) {
  const [areaId, setAreaId] = useState<string>("");
  const [nome, setNome] = useState("");
  const [capacidade, setCapacidade] = useState("");

  // Radix só chama onOpenChange para fechamentos internos (Escape, overlay,
  // Close) — abrir o dialog é uma mudança de prop externa e NÃO dispara esse
  // callback. Por isso o reset/preenchimento inicial precisa reagir a `open`
  // via useEffect, nunca só dentro do onOpenChange.
  useEffect(() => {
    if (open) {
      setAreaId(areas[0] ? String(areas[0].id) : "");
      setNome("");
      setCapacidade("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova mesa</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Área</Label>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione a área" /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => (<SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mesa-nome">Nome/número</Label>
              <Input id="mesa-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: 12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mesa-capacidade">Capacidade (opcional)</Label>
              <Input id="mesa-capacidade" type="number" min={1} value={capacidade} onChange={(e) => setCapacidade(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button
            disabled={loading || !areaId || !nome.trim()}
            onClick={() => onSubmit({ areaId: Number(areaId), nome: nome.trim(), capacidade: capacidade ? Number(capacidade) : undefined })}
          >
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MesasTab({
  orgId,
  locationId,
  onOpenTabDetail,
  onAddOrder,
}: {
  orgId: number;
  locationId: number;
  onOpenTabDetail: (tabId: number) => void;
  onAddOrder: (tabId: number) => void;
}) {
  const { data: areas, isLoading: loadingAreas } = useVenueAreas(orgId, locationId);
  const { data: tables, isLoading: loadingTables, isError, refetch } = useVenueTables(orgId, locationId);
  const { create: createArea } = useVenueAreaMutations(orgId, locationId);
  const { create: createTable } = useVenueTableMutations(orgId, locationId);

  const [areaFormOpen, setAreaFormOpen] = useState(false);
  const [tableFormOpen, setTableFormOpen] = useState(false);
  const [openingTableId, setOpeningTableId] = useState<number | null>(null);

  const areaList = areas ?? [];
  const tableList = tables ?? [];

  if (isError) {
    return <ErrorState description="Não foi possível carregar as mesas." onRetry={() => refetch()} />;
  }
  if (loadingAreas || loadingTables) return <TableSkeleton />;

  if (areaList.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Nenhuma área cadastrada"
          description="Crie áreas como Salão, Deck ou Camarote para organizar as mesas."
          actionLabel="Nova área"
          onAction={() => setAreaFormOpen(true)}
        />
        <AreaFormDialog
          open={areaFormOpen}
          onOpenChange={setAreaFormOpen}
          loading={createArea.isPending}
          onSubmit={(nome) =>
            createArea.mutate(
              { nome },
              {
                onSuccess: () => { toast.success("Área criada."); setAreaFormOpen(false); },
                onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a área.")),
              },
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setAreaFormOpen(true)}>
          <Plus size={16} /> Nova área
        </Button>
        <Button size="sm" onClick={() => setTableFormOpen(true)}>
          <Plus size={16} /> Nova mesa
        </Button>
      </div>

      {areaList.map((area) => {
        const areaTables = tableList.filter((t) => t.areaId === area.id);
        return (
          <section key={area.id} className="space-y-3">
            <h3 className="text-sm font-semibold text-black/60">{area.nome}</h3>
            {areaTables.length === 0 ? (
              <p className="text-sm text-black/40">Nenhuma mesa nesta área ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {areaTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onOpen={() => setOpeningTableId(table.id)}
                    onViewTab={() => table.openTab && onOpenTabDetail(table.openTab.id)}
                    onAddOrder={() => table.openTab && onAddOrder(table.openTab.id)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <AreaFormDialog
        open={areaFormOpen}
        onOpenChange={setAreaFormOpen}
        loading={createArea.isPending}
        onSubmit={(nome) =>
          createArea.mutate(
            { nome },
            {
              onSuccess: () => { toast.success("Área criada."); setAreaFormOpen(false); },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a área.")),
            },
          )
        }
      />
      <TableFormDialog
        open={tableFormOpen}
        onOpenChange={setTableFormOpen}
        areas={areaList}
        loading={createTable.isPending}
        onSubmit={(values) =>
          createTable.mutate(values, {
            onSuccess: () => { toast.success("Mesa criada."); setTableFormOpen(false); },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a mesa.")),
          })
        }
      />
      {openingTableId !== null ? (
        <CreateTabDialog
          orgId={orgId}
          locationId={locationId}
          open={openingTableId !== null}
          onOpenChange={(v) => !v && setOpeningTableId(null)}
          presetTableId={openingTableId}
          onCreated={(tab) => { setOpeningTableId(null); onOpenTabDetail(tab.id); }}
        />
      ) : null}
    </div>
  );
}

function TableCard({
  table,
  onOpen,
  onViewTab,
  onAddOrder,
}: {
  table: VenueTable;
  onOpen: () => void;
  onViewTab: () => void;
  onAddOrder: () => void;
}) {
  const occupied = table.openTab !== null;

  return (
    <div
      className={`rounded-xl border p-3 ${occupied ? "border-amber-300 bg-amber-50" : "border-black/10 bg-white"} ${!table.active ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-900">{table.nome}</p>
        {table.capacidade ? (
          <span className="flex items-center gap-1 text-xs text-black/50">
            <Users size={12} /> {table.capacidade}
          </span>
        ) : null}
      </div>

      {occupied && table.openTab ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-black/60">Comanda {table.openTab.publicCode}</p>
          <p className="text-sm font-semibold text-gray-900">{centsToBRL(table.openTab.totalCents)}</p>
          <p className="text-xs text-black/40">{minutesSince(table.openTab.openedAt)} min aberta</p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-emerald-600">Livre</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {!occupied ? (
          <Button size="sm" variant="outline" disabled={!table.active} onClick={onOpen}>
            Abrir comanda
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={onAddOrder}>
              Adicionar pedido
            </Button>
            <Button size="sm" variant="outline" onClick={onViewTab}>
              Ver / pagar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
