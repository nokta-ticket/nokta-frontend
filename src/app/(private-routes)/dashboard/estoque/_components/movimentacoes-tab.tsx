"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { SectionHeader } from "@/components/ui/section-header";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import { formatStockQuantity, VENUE_STOCK_MOVEMENT_TYPE_LABEL, type VenueStockMovementType, type VenueStockTransfer } from "@/services/venue-stock";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockMovements, useVenueStockTransferMutations, useVenueStockTransfers } from "../_hooks/use-venue-stock-movements";
import { ManualMovementDialog } from "./manual-movement-dialog";
import { TransferFormDialog } from "./transfer-form-dialog";
import { TransferStatusBadge } from "./stock-status-badge";
import { formatShortDate, formatShortDateTime, MovementDelta, plural } from "./stock-primitives";

const PAGE_SIZE = 20;

/* ---------- transferências ---------- */

function transferSteps(t: VenueStockTransfer): StepperStep[] {
  const draft: StepperStep = { label: "Rascunho criado", description: t.notes ?? undefined, timestamp: formatShortDateTime(t.createdAt), status: "done" };
  if (t.status === "CANCELED") return [draft, { label: "Cancelada", timestamp: formatShortDateTime(t.canceledAt), status: "failed" }];
  const sent: StepperStep = t.sentAt ? { label: `Enviada de ${t.fromLocation.nome}`, description: "Saiu do saldo da origem.", timestamp: formatShortDateTime(t.sentAt), status: "done" } : { label: `Enviar de ${t.fromLocation.nome}`, description: "Ao enviar, os itens saem do saldo da origem.", status: "current" };
  const received: StepperStep = t.receivedAt ? { label: `Recebida em ${t.toLocation.nome}`, description: "Entrou no saldo do destino.", timestamp: formatShortDateTime(t.receivedAt), status: "done" } : { label: `Receber em ${t.toLocation.nome}`, description: "Ao receber, os itens entram no saldo do destino.", status: t.status === "SENT" ? "current" : "upcoming" };
  return [draft, sent, received];
}

function TransferDetailSheet({ transfer, open, onOpenChange, onSend, onReceive, onCancel }: { transfer: VenueStockTransfer | null; open: boolean; onOpenChange: (v: boolean) => void; onSend: (t: VenueStockTransfer) => void; onReceive: (t: VenueStockTransfer) => void; onCancel: (t: VenueStockTransfer) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        {transfer ? (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>Transferência {transfer.publicCode}</SheetTitle>
                <TransferStatusBadge status={transfer.status} />
              </div>
              <SheetDescription className="flex items-center gap-1.5">
                <span className="truncate">{transfer.fromLocation.nome}</span>
                <Icon name="arrow-right" size={11} className="shrink-0" />
                <span className="truncate">{transfer.toLocation.nome}</span>
              </SheetDescription>
            </SheetHeader>

            <SheetBody>
              <Stepper steps={transferSteps(transfer)} />

              <SheetSection title={plural(transfer.items.length, "item", "itens")}>
                <ul className="-my-1 divide-y divide-border/70">
                  {transfer.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                      <p className="min-w-0 truncate text-sm font-medium text-foreground">{it.inventoryItem.nome}</p>
                      <span className="shrink-0 text-sm font-semibold tnum text-foreground">{formatStockQuantity(it.quantity, it.inventoryItem.baseUnit)}</span>
                    </li>
                  ))}
                </ul>
              </SheetSection>
            </SheetBody>

            {transfer.status === "DRAFT" ? (
              <SheetFooter>
                <Button variant="destructive-soft" onClick={() => onCancel(transfer)}>
                  Cancelar
                </Button>
                <Button leftIcon="send" onClick={() => onSend(transfer)}>
                  Enviar transferência
                </Button>
              </SheetFooter>
            ) : transfer.status === "SENT" ? (
              <SheetFooter>
                <Button leftIcon="check" onClick={() => onReceive(transfer)}>
                  Confirmar recebimento
                </Button>
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TransfersSection({ orgId, locations, locationId }: { orgId: number; locations: VenueLocation[]; locationId: number }) {
  const { data: transfers, isLoading, isError, refetch } = useVenueStockTransfers(orgId);
  const { send, receive, cancel } = useVenueStockTransferMutations(orgId);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [sending, setSending] = useState<VenueStockTransfer | null>(null);
  const [receiving, setReceiving] = useState<VenueStockTransfer | null>(null);
  const [canceling, setCanceling] = useState<VenueStockTransfer | null>(null);

  const list = transfers ?? [];
  const detail = list.find((t) => t.id === detailId) ?? null;
  const canTransfer = locations.length > 1;

  const run = async (label: string, fn: () => Promise<unknown>, fallback: string) => {
    try {
      await fn();
      toast.success(label);
      setDetailId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, fallback));
    }
  };

  const rowActions = (t: VenueStockTransfer) => (
    <>
      {t.status === "DRAFT" ? (
        <>
          <Button variant="subtle" size="icon-sm" aria-label={`Enviar ${t.publicCode}`} title="Enviar" className="hover:text-success" onClick={() => setSending(t)}>
            <Icon name="send" size={13} />
          </Button>
          <Button variant="subtle" size="icon-sm" aria-label={`Cancelar ${t.publicCode}`} title="Cancelar" className="hover:bg-danger-bg hover:text-danger" onClick={() => setCanceling(t)}>
            <Icon name="close" size={14} />
          </Button>
        </>
      ) : t.status === "SENT" ? (
        <Button variant="subtle" size="icon-sm" aria-label={`Receber ${t.publicCode}`} title="Receber" className="hover:text-success" onClick={() => setReceiving(t)}>
          <Icon name="check" size={14} />
        </Button>
      ) : (
        <Button variant="subtle" size="icon-sm" aria-label={`Ver ${t.publicCode}`} title="Ver detalhes" onClick={() => setDetailId(t.id)}>
          <Icon name="eye" size={14} />
        </Button>
      )}
    </>
  );

  const route = (t: VenueStockTransfer) => (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate">{t.fromLocation.nome}</span>
      <Icon name="arrow-right" size={10} className="shrink-0 text-subtle-foreground" />
      <span className="truncate">{t.toLocation.nome}</span>
    </span>
  );

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Transferências entre unidades"
        description={canTransfer ? "Saldo que sai de uma unidade e entra em outra." : "Cadastre uma segunda unidade pra transferir estoque."}
        action={
          canTransfer ? (
            <Button variant="outline" size="sm" leftIcon="transfer" onClick={() => setFormOpen(true)}>
              Nova transferência
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorState description="Não foi possível carregar as transferências." onRetry={() => refetch()} />
      ) : isLoading ? (
        <RowsSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState compact icon="transfer" title="Nenhuma transferência ainda" description={canTransfer ? "Mova saldo entre unidades sem passar por compra." : undefined} />
      ) : (
        <DataTableShell
          maxHeight="24rem"
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Transferência</DataTableHeadCell>
                  <DataTableHeadCell>Rota</DataTableHeadCell>
                  <DataTableHeadCell align="right">Itens</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right">Ações</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.map((t, i) => (
                  <DataTableRow key={t.id} index={i} onClick={() => setDetailId(t.id)}>
                    <DataTableCell>
                      <p className="font-semibold text-foreground">{t.publicCode}</p>
                      <p className="text-caption text-muted-foreground tnum">{formatShortDate(t.createdAt)}</p>
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground">{route(t)}</DataTableCell>
                    <DataTableCell num>{t.items.length}</DataTableCell>
                    <DataTableCell>
                      <TransferStatusBadge status={t.status} />
                    </DataTableCell>
                    <DataTableCell align="right" stopPropagation>
                      <div className="flex items-center justify-end gap-0.5">{rowActions(t)}</div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {list.map((t, i) => (
                <MobileCard key={t.id} index={i} title={t.publicCode} subtitle={route(t)} badge={<TransferStatusBadge status={t.status} />} meta={[{ label: "Itens", value: plural(t.items.length, "item", "itens"), num: true }, { label: "Criada", value: formatShortDate(t.createdAt), num: true }]} onClick={() => setDetailId(t.id)} actions={rowActions(t)} />
              ))}
            </MobileCardList>
          }
        />
      )}

      {canTransfer ? <TransferFormDialog orgId={orgId} locations={locations} defaultFromLocationId={locationId} open={formOpen} onOpenChange={setFormOpen} /> : null}

      <TransferDetailSheet transfer={detail} open={detailId !== null} onOpenChange={(v) => !v && setDetailId(null)} onSend={setSending} onReceive={setReceiving} onCancel={setCanceling} />

      <ConfirmDialog
        open={sending !== null}
        onOpenChange={(v) => !v && setSending(null)}
        icon="send"
        title={`Enviar ${sending?.publicCode ?? "transferência"}?`}
        description={sending ? `Os itens saem agora do saldo de ${sending.fromLocation.nome}. Eles entram em ${sending.toLocation.nome} quando o recebimento for confirmado.` : undefined}
        confirmLabel="Enviar"
        onConfirm={() => (sending ? run("Transferência enviada.", () => send.mutateAsync(sending.id), "Não foi possível enviar.") : undefined)}
      />
      <ConfirmDialog
        open={receiving !== null}
        onOpenChange={(v) => !v && setReceiving(null)}
        icon="check-circle"
        title={`Receber ${receiving?.publicCode ?? "transferência"}?`}
        description={receiving ? `Os itens entram no saldo de ${receiving.toLocation.nome}.` : undefined}
        confirmLabel="Confirmar recebimento"
        onConfirm={() => (receiving ? run("Transferência recebida — saldo atualizado.", () => receive.mutateAsync(receiving.id), "Não foi possível receber.") : undefined)}
      />
      <ConfirmDialog
        open={canceling !== null}
        onOpenChange={(v) => !v && setCanceling(null)}
        danger
        title={`Cancelar ${canceling?.publicCode ?? "transferência"}?`}
        description="O rascunho é cancelado sem mexer em nenhum saldo."
        confirmLabel="Cancelar transferência"
        cancelLabel="Voltar"
        onConfirm={() => (canceling ? run("Transferência cancelada.", () => cancel.mutateAsync(canceling.id), "Não foi possível cancelar.") : undefined)}
      />
    </section>
  );
}

/* ---------- movimentações ---------- */

export function MovimentacoesTab({ orgId, locationId, locations }: { orgId: number; locationId: number; locations: VenueLocation[] }) {
  const [type, setType] = useState<string>("all");
  const [itemId, setItemId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [manualOpen, setManualOpen] = useState(false);

  const { data: itemsData } = useVenueStockItems(orgId, { status: "ACTIVE", limit: 200 });
  const items = itemsData?.data ?? [];

  const { data, isLoading, isError, isFetching, refetch } = useVenueStockMovements(orgId, locationId, {
    type: type !== "all" ? (type as VenueStockMovementType) : undefined,
    inventoryItemId: itemId !== "all" ? Number(itemId) : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const list = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = type !== "all" || itemId !== "all";

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <DataTableToolbar>
          <NativeSelect
            aria-label="Tipo de movimentação"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="min-w-[160px] flex-1 sm:w-52 sm:flex-none"
          >
            <option value="all">Todos os tipos</option>
            {(Object.keys(VENUE_STOCK_MOVEMENT_TYPE_LABEL) as VenueStockMovementType[]).map((t) => (
              <option key={t} value={t}>
                {VENUE_STOCK_MOVEMENT_TYPE_LABEL[t]}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Item"
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value);
              setPage(1);
            }}
            className="min-w-[160px] flex-1 sm:w-60 sm:flex-none"
          >
            <option value="all">Todos os itens</option>
            {items.map((i) => (
              <option key={i.id} value={String(i.id)}>
                {i.nome}
              </option>
            ))}
          </NativeSelect>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="subtle" size="icon-sm" aria-label="Atualizar lista" title="Atualizar" onClick={() => refetch()}>
              <Icon name="refresh" size={14} className={cn(isFetching && "animate-spin")} />
            </Button>
            <Button size="sm" leftIcon="sliders" onClick={() => setManualOpen(true)}>
              Lançamento manual
            </Button>
          </div>
        </DataTableToolbar>

        {isError ? (
          <ErrorState description="Não foi possível carregar as movimentações." onRetry={() => refetch()} />
        ) : isLoading ? (
          <RowsSkeleton rows={6} />
        ) : list.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon="search"
              title="Nenhuma movimentação com esses filtros"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setType("all");
                    setItemId("all");
                    setPage(1);
                  }}
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState icon="history" title="Nenhuma movimentação ainda" description="Compras, consumo de vendas, perdas e ajustes aparecem aqui." />
          )
        ) : (
          <DataTableShell
            maxHeight="calc(100dvh - 30rem)"
            table={
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableHeadCell>Quando</DataTableHeadCell>
                    <DataTableHeadCell>Item</DataTableHeadCell>
                    <DataTableHeadCell>Tipo</DataTableHeadCell>
                    <DataTableHeadCell align="right">Quantidade</DataTableHeadCell>
                    <DataTableHeadCell align="right">Saldo após</DataTableHeadCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {list.map((m, i) => (
                    <DataTableRow key={m.id} index={i}>
                      <DataTableCell className="whitespace-nowrap text-muted-foreground tnum">{formatShortDateTime(m.createdAt)}</DataTableCell>
                      <DataTableCell className="font-medium">{m.inventoryItem?.nome ?? `Item ${m.inventoryItemId}`}</DataTableCell>
                      <DataTableCell>
                        <p className="text-foreground">{VENUE_STOCK_MOVEMENT_TYPE_LABEL[m.type]}</p>
                        {m.reason ? <p className="max-w-xs truncate text-caption text-muted-foreground">{m.reason}</p> : null}
                      </DataTableCell>
                      <DataTableCell align="right">{m.inventoryItem ? <MovementDelta delta={m.quantityDelta} unit={m.inventoryItem.baseUnit} /> : <span className="tnum">{m.quantityDelta}</span>}</DataTableCell>
                      <DataTableCell num className="text-muted-foreground">
                        {m.inventoryItem ? formatStockQuantity(m.balanceAfter, m.inventoryItem.baseUnit) : m.balanceAfter}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            }
            mobile={
              <MobileCardList>
                {list.map((m, i) => (
                  <MobileCard
                    key={m.id}
                    index={i}
                    title={m.inventoryItem?.nome ?? `Item ${m.inventoryItemId}`}
                    subtitle={`${VENUE_STOCK_MOVEMENT_TYPE_LABEL[m.type]} · ${formatShortDateTime(m.createdAt)}`}
                    badge={m.inventoryItem ? <MovementDelta delta={m.quantityDelta} unit={m.inventoryItem.baseUnit} size="md" /> : undefined}
                    meta={[
                      { label: "Saldo após", value: m.inventoryItem ? formatStockQuantity(m.balanceAfter, m.inventoryItem.baseUnit) : m.balanceAfter, num: true },
                      ...(m.reason ? [{ label: "Motivo", value: m.reason }] : []),
                    ]}
                  />
                ))}
              </MobileCardList>
            }
            footer={<DataTablePagination page={page} lastPage={lastPage} total={total} perPage={PAGE_SIZE} noun="movimentações" onPageChange={setPage} />}
          />
        )}
      </div>

      <TransfersSection orgId={orgId} locations={locations} locationId={locationId} />

      <ManualMovementDialog orgId={orgId} locationId={locationId} open={manualOpen} onOpenChange={setManualOpen} />
    </div>
  );
}
