"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { formatStockQuantity, VENUE_PURCHASE_STATUS_LABEL, type VenuePurchase, type VenuePurchaseStatus, type VenueSupplier } from "@/services/venue-stock";
import { useVenueStockPurchaseMutations, useVenueStockPurchases } from "../_hooks/use-venue-stock-purchases";
import { PurchaseFormDialog } from "./purchase-form-dialog";
import { PurchaseStatusBadge } from "./stock-status-badge";
import { formatShortDate, formatShortDateTime, plural, UNIT_SHORT } from "./stock-primitives";

const PAGE_SIZE = 20;
type StatusFilter = "ALL" | VenuePurchaseStatus;

function purchaseSteps(p: VenuePurchase): StepperStep[] {
  const draft: StepperStep = { label: "Rascunho criado", description: p.documentNumber ? `Documento ${p.documentNumber}` : undefined, timestamp: formatShortDateTime(p.createdAt), status: "done" };
  if (p.status === "CANCELED") return [draft, { label: "Cancelada", description: p.cancelReason ?? undefined, timestamp: formatShortDateTime(p.canceledAt), status: "failed" }];
  if (p.status === "RECEIVED") return [draft, { label: "Recebida", description: "Estoque e custo médio atualizados.", timestamp: formatShortDateTime(p.receivedAt), status: "done" }];
  return [draft, { label: "Aguardando recebimento", description: "Ao receber, os itens entram no estoque e o custo médio é recalculado.", status: "current" }];
}

function PurchaseDetailSheet({ purchase, open, onOpenChange, onReceive, onCancel }: { purchase: VenuePurchase | null; open: boolean; onOpenChange: (v: boolean) => void; onReceive: (p: VenuePurchase) => void; onCancel: (p: VenuePurchase) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        {purchase ? (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>Compra {purchase.publicCode}</SheetTitle>
                <PurchaseStatusBadge status={purchase.status} />
              </div>
              <SheetDescription>
                {purchase.supplier?.nome ?? "Sem fornecedor"} · {plural(purchase.items.length, "item", "itens")} · {formatBRLCents(purchase.totalCostCents)}
              </SheetDescription>
            </SheetHeader>

            <SheetBody>
              <Stepper steps={purchaseSteps(purchase)} />

              <SheetSection title="Itens">
                <ul className="-my-1 divide-y divide-border/70">
                  {purchase.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{it.inventoryItem.nome}</p>
                        <p className="text-caption text-muted-foreground tnum">
                          {formatStockQuantity(it.quantityBase, it.inventoryItem.baseUnit)}
                          {it.packageQuantity && it.packageSizeBase ? ` (${Number(it.packageQuantity).toLocaleString("pt-BR")} × ${Number(it.packageSizeBase).toLocaleString("pt-BR")} ${UNIT_SHORT[it.inventoryItem.baseUnit]})` : ""}
                          {" · "}
                          {formatBRLCents(Number(it.unitCostCents))}/{UNIT_SHORT[it.inventoryItem.baseUnit]}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tnum text-foreground">{formatBRLCents(it.totalCostCents)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold tnum text-foreground">{formatBRLCents(purchase.totalCostCents)}</span>
                </div>
              </SheetSection>

              <DetailGrid columns={2}>
                <DetailItem label="Fornecedor" icon="truck" value={purchase.supplier?.nome} />
                <DetailItem label="Documento" icon="receipt" value={purchase.documentNumber} />
                <DetailItem label="Comprada em" icon="calendar" value={formatShortDateTime(purchase.purchasedAt)} />
                <DetailItem label="Recebida em" icon="check-circle" value={purchase.receivedAt ? formatShortDateTime(purchase.receivedAt) : null} />
                {purchase.notes ? <DetailItem label="Observações" icon="file-lines" value={purchase.notes} span /> : null}
              </DetailGrid>
            </SheetBody>

            {purchase.status === "DRAFT" ? (
              <SheetFooter>
                <Button variant="destructive-soft" onClick={() => onCancel(purchase)}>
                  Cancelar compra
                </Button>
                <Button leftIcon="check" onClick={() => onReceive(purchase)}>
                  Receber compra
                </Button>
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function ComprasTab({ orgId, locationId, suppliers, onRegister }: { orgId: number; locationId: number; suppliers: VenueSupplier[]; onRegister: () => void }) {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [receiving, setReceiving] = useState<VenuePurchase | null>(null);
  const [canceling, setCanceling] = useState<VenuePurchase | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useVenueStockPurchases(orgId, locationId, { status: status !== "ALL" ? status : undefined, page, limit: PAGE_SIZE });
  const { cancel, receive } = useVenueStockPurchaseMutations(orgId, locationId);

  const list = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const detail = list.find((p) => p.id === detailId) ?? null;

  const handleReceive = async () => {
    if (!receiving) return;
    try {
      await receive.mutateAsync(receiving.id);
      toast.success("Compra recebida — estoque atualizado.");
      setDetailId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível receber a compra."));
    }
  };

  const handleCancel = async () => {
    if (!canceling) return;
    try {
      await cancel.mutateAsync({ purchaseId: canceling.id });
      toast.success("Compra cancelada.");
      setDetailId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível cancelar."));
    }
  };

  const rowActions = (p: VenuePurchase) =>
    p.status === "DRAFT" ? (
      <>
        <Button variant="subtle" size="icon-sm" aria-label={`Receber ${p.publicCode}`} title="Receber" className="hover:text-success" onClick={() => setReceiving(p)}>
          <Icon name="check" size={14} />
        </Button>
        <Button variant="subtle" size="icon-sm" aria-label={`Cancelar ${p.publicCode}`} title="Cancelar" className="hover:bg-danger-bg hover:text-danger" onClick={() => setCanceling(p)}>
          <Icon name="close" size={14} />
        </Button>
      </>
    ) : (
      <Button variant="subtle" size="icon-sm" aria-label={`Ver ${p.publicCode}`} title="Ver detalhes" onClick={() => setDetailId(p.id)}>
        <Icon name="eye" size={14} />
      </Button>
    );

  return (
    <div className="space-y-4">
      <DataTableToolbar>
        <NativeSelect
          aria-label="Status da compra"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="w-full sm:w-48"
        >
          <option value="ALL">Todas as compras</option>
          {(Object.keys(VENUE_PURCHASE_STATUS_LABEL) as VenuePurchaseStatus[]).map((s) => (
            <option key={s} value={s}>
              {VENUE_PURCHASE_STATUS_LABEL[s]}
            </option>
          ))}
        </NativeSelect>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="subtle" size="icon-sm" aria-label="Atualizar lista" title="Atualizar" onClick={() => refetch()}>
            <Icon name="refresh" size={14} className={cn(isFetching && "animate-spin")} />
          </Button>
          <Button size="sm" leftIcon="truck" onClick={() => setFormOpen(true)}>
            Registrar compra
          </Button>
        </div>
      </DataTableToolbar>

      {isError ? (
        <ErrorState description="Não foi possível carregar as compras." onRetry={() => refetch()} />
      ) : isLoading ? (
        <RowsSkeleton rows={5} />
      ) : list.length === 0 ? (
        status !== "ALL" ? (
          <EmptyState
            icon="truck"
            title={`Nenhuma compra ${VENUE_PURCHASE_STATUS_LABEL[status].toLowerCase()}`}
            description="Troque o filtro pra ver as outras compras desta unidade."
            action={
              <Button variant="outline" onClick={() => setStatus("ALL")}>
                Ver todas
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="truck"
            title="Nenhuma compra registrada"
            description="Registre a primeira compra pra dar entrada nos itens desta unidade."
            action={
              <Button leftIcon="truck" onClick={onRegister}>
                Registrar compra
              </Button>
            }
          />
        )
      ) : (
        <DataTableShell
          maxHeight="calc(100dvh - 30rem)"
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Compra</DataTableHeadCell>
                  <DataTableHeadCell>Fornecedor</DataTableHeadCell>
                  <DataTableHeadCell>Data</DataTableHeadCell>
                  <DataTableHeadCell align="right">Itens</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right">Total</DataTableHeadCell>
                  <DataTableHeadCell align="right">Ações</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.map((p, i) => (
                  <DataTableRow key={p.id} index={i} onClick={() => setDetailId(p.id)}>
                    <DataTableCell>
                      <p className="font-semibold text-foreground">{p.publicCode}</p>
                      {p.documentNumber ? <p className="text-caption text-muted-foreground">{p.documentNumber}</p> : null}
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground">{p.supplier?.nome ?? <span className="text-subtle-foreground">Sem fornecedor</span>}</DataTableCell>
                    <DataTableCell className="text-muted-foreground tnum">{formatShortDate(p.purchasedAt)}</DataTableCell>
                    <DataTableCell num>{p.items.length}</DataTableCell>
                    <DataTableCell>
                      <PurchaseStatusBadge status={p.status} />
                    </DataTableCell>
                    <DataTableCell num className="font-semibold">
                      {formatBRLCents(p.totalCostCents)}
                    </DataTableCell>
                    <DataTableCell align="right" stopPropagation>
                      <div className="flex items-center justify-end gap-0.5">{rowActions(p)}</div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {list.map((p, i) => (
                <MobileCard
                  key={p.id}
                  index={i}
                  title={p.publicCode}
                  subtitle={`${p.supplier?.nome ?? "Sem fornecedor"} · ${formatShortDate(p.purchasedAt)}`}
                  badge={<PurchaseStatusBadge status={p.status} />}
                  meta={[
                    { label: "Total", value: formatBRLCents(p.totalCostCents), num: true },
                    { label: "Itens", value: plural(p.items.length, "item", "itens"), num: true },
                  ]}
                  onClick={() => setDetailId(p.id)}
                  actions={rowActions(p)}
                />
              ))}
            </MobileCardList>
          }
          footer={<DataTablePagination page={page} lastPage={lastPage} total={total} perPage={PAGE_SIZE} noun="compras" onPageChange={setPage} />}
        />
      )}

      <PurchaseFormDialog orgId={orgId} locationId={locationId} suppliers={suppliers} open={formOpen} onOpenChange={setFormOpen} />

      <PurchaseDetailSheet purchase={detail} open={detailId !== null} onOpenChange={(v) => !v && setDetailId(null)} onReceive={setReceiving} onCancel={setCanceling} />

      <ConfirmDialog
        open={receiving !== null}
        onOpenChange={(v) => !v && setReceiving(null)}
        icon="check-circle"
        title={`Receber ${receiving?.publicCode ?? "compra"}?`}
        description="Os itens entram no estoque e o custo médio é recalculado. Depois de recebida, a compra não pode mais ser editada."
        confirmLabel="Confirmar recebimento"
        onConfirm={handleReceive}
      />

      <ConfirmDialog
        open={canceling !== null}
        onOpenChange={(v) => !v && setCanceling(null)}
        danger
        title={`Cancelar ${canceling?.publicCode ?? "compra"}?`}
        description="A compra em rascunho é cancelada sem mexer no estoque."
        confirmLabel="Cancelar compra"
        cancelLabel="Voltar"
        onConfirm={handleCancel}
      />
    </div>
  );
}
