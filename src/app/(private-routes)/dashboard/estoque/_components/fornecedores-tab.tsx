"use client";

import { useState } from "react";
import { Archive, Plus, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueSupplier } from "@/services/venue-stock";
import { useVenueStockSupplierMutations, useVenueStockSuppliers } from "../_hooks/use-venue-stock-catalog";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { ArchivedBadge } from "./stock-status-badge";
import { ConfirmDialog } from "../../cardapio/_components/confirm-dialog";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";

export function FornecedoresTab({ orgId }: { orgId: number }) {
  const { data: suppliers, isLoading } = useVenueStockSuppliers(orgId);
  const { archive } = useVenueStockSupplierMutations(orgId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueSupplier | null>(null);
  const [archiving, setArchiving] = useState<VenueSupplier | null>(null);

  const list = suppliers ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/60">Fornecedores usados nas compras de estoque.</p>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} /> Novo fornecedor
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhum fornecedor cadastrado"
          description="Cadastre fornecedores para vincular às compras e acompanhar o histórico."
          actionLabel="Novo fornecedor"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell>
                    {s.phone ? (
                      <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 text-sm text-black/70 hover:underline">
                        <Phone size={12} /> {s.phone}
                      </a>
                    ) : (
                      s.email ?? "—"
                    )}
                  </TableCell>
                  <TableCell><ArchivedBadge archived={!!s.archivedAt} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(s); setFormOpen(true); }}>
                        Editar
                      </Button>
                      {!s.archivedAt ? (
                        <Button size="sm" variant="ghost" onClick={() => setArchiving(s)}>
                          <Archive size={14} />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SupplierFormDialog orgId={orgId} supplier={editing} open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Arquivar fornecedor"
        description={`"${archiving?.nome}" não poderá ser selecionado em novas compras. O histórico continua acessível.`}
        confirmLabel="Arquivar"
        loading={archive.isPending}
        onConfirm={() =>
          archiving &&
          archive.mutate(archiving.id, {
            onSuccess: () => {
              toast.success("Fornecedor arquivado.");
              setArchiving(null);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar.")),
          })
        }
      />
    </div>
  );
}
