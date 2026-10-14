"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { VENUE_PAYMENT_METHOD_LABEL, VENUE_TAB_TYPE_LABEL, type VenueOrder, type VenueTabDetail } from "@/services/venue-operation";
import { useVenueOrderMutations } from "../_hooks/use-venue-orders";
import { useVenueTab, useVenueTabMutations } from "../_hooks/use-venue-tabs";
import { formatClock, formatSince } from "../_lib/time";
import { MoneyInput } from "./money-input";
import { OrderStatusBadge, TabStatusBadge } from "./op-status-badge";
import { OrderBuilderSheet } from "./order-builder-sheet";
import { PAYMENT_METHOD_ICON, PaymentDialog } from "./payment-dialog";
import { TransferTableDialog } from "./transfer-table-dialog";

export function tabTitle(tab: Pick<VenueTabDetail, "type" | "publicCode" | "table">): string {
  if (tab.type === "TABLE") return tab.table ? tab.table.nome : "Mesa";
  if (tab.type === "COUNTER") return `Balcão ${tab.publicCode}`;
  return `Comanda ${tab.publicCode}`;
}

function TotalsRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "in" | "pending" }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", strong ? "text-base font-semibold text-foreground" : "text-sm text-muted-foreground")}>
      <span>{label}</span>
      <span className={cn("tnum", strong && "text-foreground", tone === "in" && "text-money-in", tone === "pending" && "text-money-pending")}>{value}</span>
    </div>
  );
}

function OrderCard({ order, orgId, editable, index }: { order: VenueOrder; orgId: number; editable: boolean; index: number }) {
  const { cancelItem } = useVenueOrderMutations(orgId, order.tabId);
  const [canceling, setCanceling] = useState<{ itemId: number; nome: string } | null>(null);

  return (
    <div className="row-in rounded-xl border border-border bg-surface p-3.5 shadow-card" style={{ ["--i" as string]: index } as never}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          Pedido {order.publicCode}
          <span className="ml-2 text-caption font-normal text-muted-foreground tnum">{formatClock(order.sentAt ?? order.createdAt)}</span>
        </p>
        <OrderStatusBadge status={order.status} />
      </div>
      <ul className="divide-y divide-border/70">
        {order.items.map((item) => {
          const canceled = item.status === "CANCELED";
          return (
            <li key={item.id} className={cn("flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0", canceled && "opacity-50")}>
              <div className="min-w-0">
                <p className={cn("text-sm text-foreground", canceled && "line-through")}>
                  <span className="font-semibold tnum">{item.quantity}×</span> {item.productNameSnapshot}
                  {item.variantNameSnapshot ? <span className="text-muted-foreground"> · {item.variantNameSnapshot}</span> : null}
                </p>
                {item.modifiers.length > 0 ? <p className="text-caption text-muted-foreground">{item.modifiers.map((m) => m.optionNameSnapshot).join(", ")}</p> : null}
                {item.notes ? <p className="text-caption italic text-subtle-foreground">{item.notes}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-sm text-foreground tnum">{formatBRLCents(item.lineTotalCents)}</span>
                {editable && !canceled && item.status !== "DELIVERED" ? (
                  <Button variant="subtle" size="icon-sm" aria-label={`Cancelar ${item.productNameSnapshot}`} className="hover:bg-danger-bg hover:text-danger" onClick={() => setCanceling({ itemId: item.id, nome: item.productNameSnapshot })}>
                    <Icon name="close" size={12} />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={canceling !== null}
        onOpenChange={(v) => !v && setCanceling(null)}
        danger
        title="Cancelar item"
        description={`Cancelar "${canceling?.nome}"? Os outros itens do pedido continuam.`}
        confirmLabel="Cancelar item"
        onConfirm={async () => {
          if (!canceling) return;
          try {
            await cancelItem.mutateAsync({ itemId: canceling.itemId, payload: { reason: "Cancelado pelo operador" } });
            toast.success("Item cancelado.");
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível cancelar o item."));
          }
        }}
      />
    </div>
  );
}

export function TabDetailSheet({ orgId, locationId, tabId, open, onOpenChange }: { orgId: number; locationId: number; tabId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const isMobile = useIsMobile();
  const { can } = useVenueAccess();
  const { data: tab, isError, refetch } = useVenueTab(orgId, tabId);
  const { setDiscount, setServiceCharge, cancel, close, requestClose, cancelClose, cancelClosedTab, confirmPaymentRefund } = useVenueTabMutations(orgId, locationId);

  const [orderBuilderOpen, setOrderBuilderOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [confirmingRefundId, setConfirmingRefundId] = useState<number | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [discountEditing, setDiscountEditing] = useState(false);
  const [serviceRatePct, setServiceRatePct] = useState("10");

  // Edição de consumo (itens/desconto/taxa) só em OPEN — CLOSING/
  // PAYMENT_IN_PROGRESS já congelaram o total pra cobrança (mesma regra do
  // backend). A comanda continua "ocupando" a mesa enquanto não fecha.
  const isEditable = tab?.status === "OPEN";
  const isOccupying = tab?.status === "OPEN" || tab?.status === "CLOSING" || tab?.status === "PAYMENT_IN_PROGRESS";

  // Só DELIVERED/CANCELED são terminais — o resto ainda depende de preparo.
  const pendingItemsCount = tab?.orders.reduce((sum, order) => sum + order.items.filter((i) => i.status !== "DELIVERED" && i.status !== "CANCELED").length, 0) ?? 0;
  const canVoid = can("venue.operation.tabs.void_after_close");

  const side = isMobile ? "bottom" : "right";

  let body: ReactNode;
  if (isError) {
    body = <ErrorState title="Não deu pra carregar a comanda" onRetry={() => refetch()} />;
  } else if (!tab) {
    body = (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  } else {
    body = (
      <>
        <SheetSection>
          <div className="space-y-1.5">
            <TotalsRow label="Subtotal" value={formatBRLCents(tab.subtotalCents)} />
            <TotalsRow label={`Taxa de serviço (${(tab.serviceChargeRateBps / 100).toLocaleString("pt-BR")}%)`} value={formatBRLCents(tab.serviceChargeCents)} />
            {tab.discountCents > 0 ? <TotalsRow label={tab.discountReason ? `Desconto · ${tab.discountReason}` : "Desconto"} value={`−${formatBRLCents(tab.discountCents)}`} /> : null}
            <div className="my-2 border-t border-border" />
            <TotalsRow label="Total" value={formatBRLCents(tab.totalCents)} strong />
            <TotalsRow label="Pago" value={formatBRLCents(tab.paidCents)} tone="in" />
            <TotalsRow label="Restante" value={formatBRLCents(tab.remainingCents)} strong tone={tab.remainingCents > 0 ? "pending" : undefined} />
          </div>
        </SheetSection>

        {isOccupying ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {isEditable ? (
                <Button size="lg" leftIcon="plus" onClick={() => setOrderBuilderOpen(true)}>
                  Novo pedido
                </Button>
              ) : null}
              <Button size="lg" variant="contrast" leftIcon="receipt" disabled={tab.remainingCents <= 0} onClick={() => setPaymentOpen(true)} className={cn(!isEditable && "col-span-2")}>
                Receber
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tab.status === "OPEN" ? (
                <Button variant="outline" size="sm" leftIcon="lock" loading={requestClose.isPending} onClick={() => requestClose.mutate(tab.id, { onSuccess: () => toast.success("Fechamento iniciado — consumo travado."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível iniciar o fechamento.")) })}>
                  Fechar a conta
                </Button>
              ) : null}
              {tab.status === "CLOSING" ? (
                <Button variant="outline" size="sm" leftIcon="lock-open" loading={cancelClose.isPending} onClick={() => cancelClose.mutate(tab.id, { onSuccess: () => toast.success("Fechamento cancelado — comanda aberta de novo."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar o fechamento.")) })}>
                  Reabrir consumo
                </Button>
              ) : null}
              {isEditable && tab.type === "TABLE" ? (
                <Button variant="outline" size="sm" leftIcon="transfer" onClick={() => setTransferOpen(true)}>
                  Transferir mesa
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                leftIcon="check-double"
                disabled={tab.remainingCents !== 0 || pendingItemsCount > 0}
                title={tab.remainingCents !== 0 ? "Receba o saldo restante antes de fechar." : pendingItemsCount > 0 ? "Entregue ou cancele os itens pendentes antes de fechar." : undefined}
                className="disabled:opacity-40"
                loading={close.isPending}
                onClick={() => close.mutate(tab.id, { onSuccess: () => toast.success("Comanda fechada."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível fechar a comanda.")) })}
              >
                Fechar comanda
              </Button>
              {isEditable ? (
                <Button variant="destructive-soft" size="sm" leftIcon="ban" onClick={() => setCancelOpen(true)}>
                  Cancelar comanda
                </Button>
              ) : null}
            </div>
            {pendingItemsCount > 0 ? (
              <Callout tone="warning" icon="clock">
                {pendingItemsCount === 1 ? "1 item ainda em preparo ou a entregar" : `${pendingItemsCount} itens ainda em preparo ou a entregar`} — entregue ou cancele antes de fechar a comanda.
              </Callout>
            ) : null}
          </div>
        ) : null}

        {tab.status === "CLOSED" && !tab.postCloseCanceledAt && canVoid ? (
          <Callout
            tone="neutral"
            icon="undo"
            title="Precisa desfazer esta venda?"
            action={
              <Button variant="destructive-soft" size="sm" onClick={() => setVoidOpen(true)}>
                Cancelar venda
              </Button>
            }
          >
            Marca a venda como cancelada e sinaliza cada pagamento pra estorno manual — não devolve dinheiro sozinho.
          </Callout>
        ) : null}

        {tab.postCloseCanceledAt ? (
          <Callout tone="danger" title="Venda cancelada">
            {tab.postCloseCancelReason ? `Motivo: ${tab.postCloseCancelReason}. ` : null}
            Confirme abaixo cada estorno depois de devolver o dinheiro.
          </Callout>
        ) : null}

        {isEditable ? (
          <SheetSection title="Ajustes">
            <div className="space-y-4">
              <Field label="Desconto" htmlFor="tab-discount">
                {discountEditing ? (
                  <div className="flex gap-2">
                    <MoneyInput id="tab-discount" cents={discountCents} onChange={setDiscountCents} autoFocus className="flex-1" />
                    <Button
                      loading={setDiscount.isPending}
                      onClick={() =>
                        setDiscount.mutate(
                          { tabId: tab.id, payload: { discountCents, reason: discountCents > 0 ? "Desconto operacional" : undefined } },
                          {
                            onSuccess: () => {
                              toast.success("Desconto aplicado.");
                              setDiscountEditing(false);
                            },
                            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível aplicar o desconto.")),
                          },
                        )
                      }
                    >
                      Aplicar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground tnum">{tab.discountCents > 0 ? formatBRLCents(tab.discountCents) : "Sem desconto"}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon="percent"
                      onClick={() => {
                        setDiscountCents(tab.discountCents);
                        setDiscountEditing(true);
                      }}
                    >
                      {tab.discountCents > 0 ? "Alterar" : "Dar desconto"}
                    </Button>
                  </div>
                )}
              </Field>
              <Field label="Taxa de serviço" htmlFor="tab-service">
                <div className="flex gap-2">
                  <Input id="tab-service" inputMode="decimal" suffix="%" className="w-32" value={serviceRatePct} onChange={(e) => setServiceRatePct(e.target.value)} />
                  <Button
                    variant="outline"
                    loading={setServiceCharge.isPending}
                    onClick={() => {
                      const pct = parseFloat(serviceRatePct.replace(",", "."));
                      const rateBps = Number.isFinite(pct) ? Math.round(pct * 100) : 0;
                      setServiceCharge.mutate({ tabId: tab.id, payload: { rateBps } }, { onSuccess: () => toast.success("Taxa de serviço atualizada."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a taxa.")) });
                    }}
                  >
                    Aplicar taxa
                  </Button>
                </div>
              </Field>
            </div>
          </SheetSection>
        ) : null}

        <section className="space-y-2.5">
          <h4 className="text-sm font-semibold text-foreground">Pedidos</h4>
          {tab.orders.length === 0 ? <EmptyState compact icon="receipt" title="Nenhum pedido ainda" description={isEditable ? "Toque em Novo pedido pra lançar o primeiro item." : undefined} /> : <div className="space-y-2.5">{tab.orders.map((order, i) => <OrderCard key={order.id} order={order} orgId={orgId} editable={isEditable} index={i} />)}</div>}
        </section>

        <section className="space-y-2.5">
          <h4 className="text-sm font-semibold text-foreground">Pagamentos</h4>
          {tab.payments.length === 0 ? (
            <EmptyState compact icon="wallet" title="Nenhum pagamento ainda" />
          ) : (
            <ul className="space-y-2">
              {tab.payments.map((p) => (
                <li key={p.id} className={cn("rounded-xl border border-border bg-surface p-3.5 shadow-card", p.status === "CANCELED" && "opacity-50")}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground">
                      <Icon name={PAYMENT_METHOD_ICON[p.method]} size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-semibold text-foreground", p.status === "CANCELED" && "line-through")}>{VENUE_PAYMENT_METHOD_LABEL[p.method]}</p>
                      <p className="text-caption text-muted-foreground tnum">
                        {formatClock(p.confirmedAt)}
                        {p.changeCents > 0 ? ` · troco ${formatBRLCents(p.changeCents)}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tnum">{formatBRLCents(p.amountCents)}</span>
                  </div>
                  {p.refundStatus === "PENDING_MANUAL" ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <StatusBadge tone="warning">Estorno pendente</StatusBadge>
                      {canVoid ? (
                        <Button size="sm" variant="outline" leftIcon="check" onClick={() => setConfirmingRefundId(p.id)}>
                          Já devolvi
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  {p.refundStatus === "COMPLETED" ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <StatusBadge tone="success">Estorno confirmado</StatusBadge>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn(isMobile ? "h-[92dvh]" : "sm:max-w-xl")}>
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {tab ? (
              <>
                {tabTitle(tab)}
                <TabStatusBadge status={tab.status} pulse={tab.status === "OPEN"} />
              </>
            ) : (
              "Comanda"
            )}
          </SheetTitle>
          <SheetDescription>
            {tab ? [VENUE_TAB_TYPE_LABEL[tab.type] + " " + tab.publicCode, tab.customerName, tab.guestCount ? `${tab.guestCount} ${tab.guestCount === 1 ? "pessoa" : "pessoas"}` : null, `aberta ${formatSince(tab.openedAt)}`].filter(Boolean).join(" · ") : "Carregando a comanda…"}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>{body}</SheetBody>

        {tab ? (
          <>
            <OrderBuilderSheet orgId={orgId} tabId={tab.id} tabLabel={tabTitle(tab)} open={orderBuilderOpen} onOpenChange={setOrderBuilderOpen} />
            <PaymentDialog orgId={orgId} tabId={tab.id} remainingCents={tab.remainingCents} open={paymentOpen} onOpenChange={setPaymentOpen} />
            <TransferTableDialog orgId={orgId} locationId={locationId} tabId={tab.id} currentTableId={tab.tableId} open={transferOpen} onOpenChange={setTransferOpen} />
            <ConfirmDialog
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              danger
              title="Cancelar comanda"
              description="A mesa é liberada e a comanda não pode mais ser editada."
              confirmLabel="Cancelar comanda"
              onConfirm={async () => {
                try {
                  await cancel.mutateAsync({ tabId: tab.id, payload: { reason: "Cancelada pelo operador" } });
                  toast.success("Comanda cancelada.");
                  onOpenChange(false);
                } catch (err) {
                  toast.error(getErrorMessage(err, "Não foi possível cancelar a comanda."));
                }
              }}
            />
            <ConfirmDialog
              open={voidOpen}
              onOpenChange={setVoidOpen}
              danger
              title="Cancelar venda"
              description="A venda fica marcada como cancelada e cada pagamento entra como estorno pendente — o dinheiro NÃO volta sozinho. Devolva na maquininha, Pix ou espécie e depois confirme aqui em cada pagamento."
              confirmLabel="Cancelar venda"
              onConfirm={async () => {
                try {
                  await cancelClosedTab.mutateAsync({ tabId: tab.id, payload: { reason: "Venda cancelada pelo gerente" } });
                  toast.success("Venda cancelada. Estorno pendente em cada pagamento.");
                } catch (err) {
                  toast.error(getErrorMessage(err, "Não foi possível cancelar a venda."));
                }
              }}
            />
            <ConfirmDialog
              open={confirmingRefundId !== null}
              onOpenChange={(v) => !v && setConfirmingRefundId(null)}
              icon="check-circle"
              title="Confirmar estorno"
              description="Confirme só depois de já ter devolvido o dinheiro de verdade fora do sistema. Isto apenas registra que a devolução aconteceu."
              confirmLabel="Já devolvi o dinheiro"
              onConfirm={async () => {
                if (confirmingRefundId === null) return;
                try {
                  await confirmPaymentRefund.mutateAsync({ paymentId: confirmingRefundId, payload: {}, tabId: tab.id });
                  toast.success("Estorno confirmado.");
                } catch (err) {
                  toast.error(getErrorMessage(err, "Não foi possível confirmar o estorno."));
                }
              }}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
