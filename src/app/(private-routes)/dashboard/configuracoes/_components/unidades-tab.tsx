"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import type { VenueLocation } from "@/services/venue-operation";
import { useVenueLocations, useVenueLocationMutations } from "../../operacao/_hooks/use-venue-locations";
import { LocationFormDialog } from "./location-form-dialog";

export function UnidadesTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: locations, isLoading } = useVenueLocations(orgId);
  const { setMain, archive } = useVenueLocationMutations(orgId);
  const [editLocation, setEditLocation] = useState<VenueLocation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<VenueLocation | null>(null);
  const [settingMainId, setSettingMainId] = useState<number | null>(null);

  const openCreate = () => {
    setEditLocation(null);
    setDialogOpen(true);
  };
  const openEdit = (loc: VenueLocation) => {
    setEditLocation(loc);
    setDialogOpen(true);
  };

  if (isLoading) return <Skeleton className="h-72 rounded-card" />;

  if (!locations || locations.length === 0) {
    return (
      <>
        <EmptyState icon="map-pin" title="Crie a primeira unidade" description="Toda operação do Venue (mesas, caixa, horários) vive dentro de uma unidade." action={canManage ? <Button onClick={openCreate} leftIcon="plus">Nova unidade</Button> : undefined} />
        {canManage ? <LocationFormDialog orgId={orgId} location={null} open={dialogOpen} onOpenChange={setDialogOpen} /> : null}
      </>
    );
  }

  const handleSetMain = (loc: VenueLocation) => {
    setSettingMainId(loc.id);
    setMain.mutate(loc.id, {
      onSuccess: () => toast.success("Unidade principal atualizada."),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível definir como principal.")),
      onSettled: () => setSettingMainId(null),
    });
  };

  const handleArchive = async () => {
    if (!confirmArchive) return;
    try {
      await archive.mutateAsync(confirmArchive.id);
      toast.success("Unidade arquivada.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível arquivar."));
      throw err;
    }
  };

  const rowActions = (loc: VenueLocation) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label={`Editar ${loc.nome}`} title="Editar" onClick={() => openEdit(loc)}>
        <Icon name="edit" size={14} />
      </Button>
      {canManage && !loc.isMain && loc.active ? (
        <Button variant="subtle" size="icon-sm" aria-label={`Tornar ${loc.nome} a unidade principal`} title="Tornar principal" loading={settingMainId === loc.id} onClick={() => handleSetMain(loc)} className="hover:text-warning">
          <Icon name="star" size={14} />
        </Button>
      ) : null}
      {canManage && loc.active ? (
        <Button variant="subtle" size="icon-sm" aria-label={`Arquivar ${loc.nome}`} title={loc.isMain ? "A unidade principal não pode ser arquivada" : "Arquivar"} disabled={loc.isMain} onClick={() => setConfirmArchive(loc)} className="hover:bg-danger-bg hover:text-danger disabled:opacity-40">
          <Icon name="box" size={14} />
        </Button>
      ) : null}
    </>
  );

  const statusBadge = (loc: VenueLocation) => <StatusBadge tone={loc.active ? "success" : "neutral"}>{loc.active ? "Ativa" : "Arquivada"}</StatusBadge>;

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={openCreate} leftIcon="plus">
            Nova unidade
          </Button>
        </div>
      ) : null}

      <DataTableShell
        maxHeight="calc(100dvh - 22rem)"
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Unidade</DataTableHeadCell>
                <DataTableHeadCell>Fuso horário</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell align="right">Ações</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {locations.map((loc, i) => (
                <DataTableRow key={loc.id} index={i}>
                  <DataTableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{loc.nome}</span>
                      {loc.isMain ? (
                        <StatusBadge tone="brand" dot={false}>
                          Principal
                        </StatusBadge>
                      ) : null}
                    </div>
                    {loc.endereco ? <p className="mt-0.5 text-caption text-muted-foreground">{loc.endereco}</p> : null}
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">{loc.timezone}</DataTableCell>
                  <DataTableCell>{statusBadge(loc)}</DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-0.5">{rowActions(loc)}</div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        }
        mobile={
          <MobileCardList>
            {locations.map((loc, i) => (
              <MobileCard
                key={loc.id}
                index={i}
                title={
                  <span className="flex items-center gap-2">
                    {loc.nome}
                    {loc.isMain ? (
                      <StatusBadge tone="brand" dot={false}>
                        Principal
                      </StatusBadge>
                    ) : null}
                  </span>
                }
                subtitle={loc.endereco ?? undefined}
                badge={statusBadge(loc)}
                meta={[{ label: "Fuso horário", value: loc.timezone }]}
                actions={rowActions(loc)}
              />
            ))}
          </MobileCardList>
        }
      />

      {canManage ? <LocationFormDialog orgId={orgId} location={editLocation} open={dialogOpen} onOpenChange={setDialogOpen} /> : null}

      <ConfirmDialog open={confirmArchive !== null} onOpenChange={(v) => !v && setConfirmArchive(null)} danger icon="box" title={`Arquivar ${confirmArchive?.nome ?? "unidade"}?`} description="A unidade sai da operação do dia a dia. Nenhum histórico é apagado." confirmLabel="Arquivar" onConfirm={handleArchive} />
    </div>
  );
}
