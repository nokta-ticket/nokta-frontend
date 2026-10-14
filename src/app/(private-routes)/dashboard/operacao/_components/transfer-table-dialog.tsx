"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueAreas, useVenueTables } from "../_hooks/use-venue-areas-tables";
import { useVenueTabMutations } from "../_hooks/use-venue-tabs";

/** Move a comanda pra outra mesa livre da unidade (a mesa atual é liberada). */
export function TransferTableDialog({ orgId, locationId, tabId, currentTableId, open, onOpenChange }: { orgId: number; locationId: number; tabId: number; currentTableId: number | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: tables, isLoading } = useVenueTables(orgId, open ? locationId : null);
  const { data: areas } = useVenueAreas(orgId, open ? locationId : null);
  const { transferTable } = useVenueTabMutations(orgId, locationId);
  const [tableId, setTableId] = useState<number | null>(null);

  useEffect(() => {
    if (open) setTableId(null);
  }, [open]);

  const free = (tables ?? []).filter((t) => t.active && t.openTab === null && t.id !== currentTableId);
  const groups = (areas ?? []).map((a) => ({ area: a, tables: free.filter((t) => t.areaId === a.id) })).filter((g) => g.tables.length > 0);

  const handleTransfer = () => {
    if (tableId === null) return;
    transferTable.mutate(
      { tabId, payload: { tableId } },
      {
        onSuccess: (tab) => {
          toast.success(`Comanda transferida para ${free.find((t) => t.id === tab.tableId)?.nome ?? "a nova mesa"}.`);
          onOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível transferir a mesa.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Transferir mesa</DialogTitle>
          <DialogDescription>Escolha a mesa livre que vai receber esta comanda.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : groups.length === 0 ? (
            <EmptyState compact icon="chair" title="Nenhuma mesa livre" description="Todas as mesas estão ocupadas agora." />
          ) : (
            groups.map(({ area, tables: list }) => (
              <section key={area.id} className="space-y-2">
                <h4 className="text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">{area.nome}</h4>
                <div className="flex flex-wrap gap-2">
                  {list.map((t) => {
                    const selected = t.id === tableId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTableId(t.id)}
                        aria-pressed={selected}
                        className={cn("press inline-flex h-11 items-center gap-2 rounded-input border px-3.5 text-sm font-medium transition-colors", selected ? "border-transparent bg-brand-soft text-brand ring-2 ring-brand" : "border-border bg-surface-2 text-foreground hover:bg-surface-3")}
                      >
                        {t.nome}
                        {t.capacidade ? (
                          <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                            <Icon name="chair" size={11} />
                            {t.capacidade}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={transferTable.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleTransfer} disabled={tableId === null} loading={transferTable.isPending} leftIcon="transfer">
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
