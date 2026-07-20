"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCentsBRL, VENUE_PAYMENT_METHOD_LABEL, VENUE_RECONCILIATION_STATUS_LABEL, type VenuePaymentReconciliation } from "@/services/venue-finance";
import { useVenueFinanceReconciliations } from "../_hooks/use-venue-finance-reconciliation";
import { ReconciliationFormDialog } from "./reconciliation-form-dialog";
import { GenericStatusBadge } from "../../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";

function statusTone(status: VenuePaymentReconciliation["status"]) {
  if (status === "MATCHED") return "success" as const;
  if (status === "DIVERGENT") return "danger" as const;
  return "neutral" as const;
}

export function ConciliacaoTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data, isLoading } = useVenueFinanceReconciliations(orgId, locationId);
  const [editing, setEditing] = useState<VenuePaymentReconciliation | null>(null);

  const list = data ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-black/60">
        Conciliação gerencial — sem integração bancária. Informe o valor realmente recebido para comparar com o esperado.
      </p>

      {isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState title="Nenhum recebimento no período" description="A conciliação aparece por data e forma de pagamento conforme houver vendas confirmadas." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Bruto esperado</TableHead>
                <TableHead className="text-right">Líquido esperado</TableHead>
                <TableHead className="text-right">Líquido informado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={`${row.date}-${row.method}`}>
                  <TableCell className="text-xs">{new Date(`${row.date}T12:00:00`).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{VENUE_PAYMENT_METHOD_LABEL[row.method]}</TableCell>
                  <TableCell className="text-right">{formatCentsBRL(row.expectedGrossCents)}</TableCell>
                  <TableCell className="text-right">{formatCentsBRL(row.expectedNetCents)}</TableCell>
                  <TableCell className="text-right">{row.actualNetCents !== null ? formatCentsBRL(row.actualNetCents) : "—"}</TableCell>
                  <TableCell className={`text-right ${row.differenceCents ? "font-medium text-red-600" : ""}`}>
                    {row.differenceCents !== null ? formatCentsBRL(row.differenceCents) : "—"}
                  </TableCell>
                  <TableCell>
                    <GenericStatusBadge label={VENUE_RECONCILIATION_STATUS_LABEL[row.status]} tone={statusTone(row.status)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                      {row.status === "PENDING" ? "Conciliar" : "Editar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReconciliationFormDialog orgId={orgId} locationId={locationId} row={editing} open={editing !== null} onOpenChange={(v) => !v && setEditing(null)} />
    </div>
  );
}
