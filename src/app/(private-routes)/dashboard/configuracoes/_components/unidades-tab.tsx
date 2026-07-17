"use client";

import { useState } from "react";
import { Plus, Star, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import type { VenueLocation } from "@/services/venue-operation";
import { useVenueLocations, useVenueLocationMutations } from "../../venue/operacao/_hooks/use-venue-locations";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { LocationFormDialog } from "./location-form-dialog";

export function UnidadesTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: locations, isLoading } = useVenueLocations(orgId);
  const { setMain, archive } = useVenueLocationMutations(orgId);
  const [editLocation, setEditLocation] = useState<VenueLocation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) return <BlockSkeleton className="h-72" />;

  if (!locations || locations.length === 0) {
    return (
      <>
        <EmptyState
          title="Crie a primeira unidade"
          description="Crie a primeira unidade para começar a configurar o Venue."
          actionLabel={canManage ? "Nova unidade" : undefined}
          onAction={canManage ? () => { setEditLocation(null); setDialogOpen(true); } : undefined}
        />
        {canManage ? (
          <LocationFormDialog orgId={orgId} location={null} open={dialogOpen} onOpenChange={setDialogOpen} />
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={() => { setEditLocation(null); setDialogOpen(true); }}>
            <Plus size={16} /> Nova unidade
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Timezone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {loc.nome}
                    {loc.isMain ? <Badge variant="secondary">Principal</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-black/60">{loc.timezone}</TableCell>
                <TableCell>
                  <Badge variant={loc.active ? "outline" : "destructive"}>{loc.active ? "Ativa" : "Arquivada"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditLocation(loc); setDialogOpen(true); }}>
                      Editar
                    </Button>
                    {canManage && !loc.isMain && loc.active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setMain.mutate(loc.id, {
                            onSuccess: () => toast.success("Unidade principal atualizada."),
                            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível definir como principal.")),
                          })
                        }
                      >
                        <Star size={14} /> Tornar principal
                      </Button>
                    ) : null}
                    {canManage && loc.active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          archive.mutate(loc.id, {
                            onSuccess: () => toast.success("Unidade arquivada."),
                            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar.")),
                          })
                        }
                      >
                        <Archive size={14} /> Arquivar
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canManage ? (
        <LocationFormDialog orgId={orgId} location={editLocation} open={dialogOpen} onOpenChange={setDialogOpen} />
      ) : null}
    </div>
  );
}
