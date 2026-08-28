"use client";

import { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { centsToBRL } from "@/services/venue-menu";
import {
  VENUE_PAYMENT_METHOD_LABEL,
  VENUE_TAB_TYPE_LABEL,
  type VenueOrder,
} from "@/services/venue-operation";
import { useVenueTab, useVenueTabMutations } from "../_hooks/use-venue-tabs";
import { useVenueOrderMutations } from "../_hooks/use-venue-orders";
import { OrderStatusBadge, TabStatusBadge } from "./op-status-badge";
import { ConfirmDialog } from "../../cardapio/_components/confirm-dialog";
import { MoneyField } from "../../cardapio/_components/money-field";
import { PaymentDialog } from "./payment-dialog";
import { OrderBuilderSheet } from "./order-builder-sheet";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

function OrderCard({ order, orgId }: { order: VenueOrder; orgId: number }) {
  const { cancelItem } = useVenueOrderMutations(orgId, order.tabId);
  const [canceling, setCanceling] = useState<{ itemId: number; nome: string } | null>(null);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Pedido {order.publicCode}</span>
        <OrderStatusBadge status={order.status} />
      </div>
      <ul className="space-y-1.5">
        {order.items.map((item) => (
          <li key={item.id} className={`text-sm ${item.status === "CANCELED" ? "opacity-40 line-through" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium">
                  {item.quantity}x {item.productNameSnapshot}
                </span>
                {item.variantNameSnapshot ? (
                  <span className="text-black/50"> ({item.variantNameSnapshot})</span>
                ) : null}
                {item.modifiers.length > 0 ? (
                  <p className="text-xs text-black/50">
                    {item.modifiers.map((m) => m.optionNameSnapshot).join(", ")}
                  </p>
                ) : null}
                {item.notes ? <p className="text-xs text-black/40 italic">{item.notes}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-black/70">{centsToBRL(item.lineTotalCents)}</span>
                {item.status !== "CANCELED" && item.status !== "DELIVERED" ? (
                  <button
                    className="text-xs text-red-500 underline"
                    onClick={() => setCanceling({ itemId: item.id, nome: item.productNameSnapshot })}
                  >
                    cancelar
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={canceling !== null}
        onOpenChange={(v) => !v && setCanceling(null)}
        title="Cancelar item"
        description={`Cancelar "${canceling?.nome}"? Não afeta os demais itens do pedido.`}
        confirmLabel="Cancelar item"
        loading={cancelItem.isPending}
        onConfirm={() => {
          if (!canceling) return;
          cancelItem.mutate(
            { itemId: canceling.itemId, payload: { reason: "Cancelado pelo operador" } },
            {
              onSuccess: () => { toast.success("Item cancelado."); setCanceling(null); },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar o item.")),
            },
          );
        }}
      />
    </div>
  );
}

export function TabDetailSheet({
  orgId,
  locationId,
  tabId,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  tabId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { can } = useVenueAccess();
  const { data: tab, isError, refetch } = useVenueTab(orgId, tabId);
  const {
    setDiscount,
    setServiceCharge,
    cancel,
    close,
    requestClose,
    cancelClose,
    cancelClosedTab,
    confirmPaymentRefund,
  } = useVenueTabMutations(orgId, locationId);

  const [orderBuilderOpen, setOrderBuilderOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [confirmingRefundId, setConfirmingRefundId] = useState<number | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [discountEditing, setDiscountEditing] = useState(false);
  const [serviceRatePct, setServiceRatePct] = useState("10");

  // Edição de consumo (itens/desconto/taxa) só em OPEN — CLOSING/
  // PAYMENT_IN_PROGRESS já congelaram o total para cobrança (mesma regra do
  // backend, VenueOrdersService.assertTabEditable).
  const isEditable = tab?.status === "OPEN";
  // A comanda ainda está sendo atendida (mesa ocupada), mesmo já em processo
  // de fechamento — usado para decidir o que ainda conta como "em aberto".
  const isOccupying = tab?.status === "OPEN" || tab?.status === "CLOSING" || tab?.status === "PAYMENT_IN_PROGRESS";

  if (isError) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <ErrorState description="Não foi possível carregar a comanda." onRetry={() => refetch()} />
        </SheetContent>
      </Sheet>
    );
  }

  // Espelha a regra do backend: só DELIVERED/CANCELED são terminais — qualquer
  // outro status ainda depende de preparo/entrega e bloqueia o fechamento.
  const pendingItemsCount =
    tab?.orders.reduce(
      (sum, order) => sum + order.items.filter((i) => i.status !== "DELIVERED" && i.status !== "CANCELED").length,
      0,
    ) ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {tab ? (
              <>
                Comanda {tab.publicCode}
                <TabStatusBadge status={tab.status} />
              </>
            ) : (
              "Comanda"
            )}
          </SheetTitle>
        </SheetHeader>

        {!tab ? (
          <div className="px-4"><BlockSkeleton className="h-96" /></div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
            <div className="rounded-xl border border-black/10 bg-white p-3 text-sm">
              <p className="text-black/60">
                {VENUE_TAB_TYPE_LABEL[tab.type]}
                {tab.customerName ? ` · ${tab.customerName}` : ""}
                {tab.guestCount ? ` · ${tab.guestCount} pessoas` : ""}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1 text-black/70">
                <span>Subtotal</span><span className="text-right">{centsToBRL(tab.subtotalCents)}</span>
                <span>Taxa de serviço</span><span className="text-right">{centsToBRL(tab.serviceChargeCents)}</span>
                <span>Desconto</span><span className="text-right">-{centsToBRL(tab.discountCents)}</span>
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-right font-semibold text-gray-900">{centsToBRL(tab.totalCents)}</span>
                <span>Pago</span><span className="text-right">{centsToBRL(tab.paidCents)}</span>
                <span className="font-semibold">Restante</span>
                <span className="text-right font-semibold">{centsToBRL(tab.remainingCents)}</span>
              </div>
            </div>

            {isOccupying ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-2">
                  {isEditable ? (
                    <Button size="sm" onClick={() => setOrderBuilderOpen(true)}>
                      <Plus size={14} /> Novo pedido
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)} disabled={tab.remainingCents <= 0}>
                    <Receipt size={14} /> Registrar pagamento
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={tab.remainingCents !== 0 || pendingItemsCount > 0}
                    onClick={() =>
                      close.mutate(tab.id, {
                        onSuccess: () => toast.success("Comanda fechada."),
                        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível fechar a comanda.")),
                      })
                    }
                  >
                    Fechar comanda
                  </Button>
                  {/* "Fechar a conta" é opcional (trava o consumo antes de
                      cobrar, útil para o cliente ver o total fechado antes
                      de decidir a forma de pagamento) — cobrar direto sem
                      passar por aqui (botão acima) continua funcionando. */}
                  {tab.status === "OPEN" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        requestClose.mutate(tab.id, {
                          onSuccess: () => toast.success("Fechamento iniciado — consumo travado."),
                          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível iniciar o fechamento.")),
                        })
                      }
                    >
                      Fechar a conta
                    </Button>
                  ) : null}
                  {tab.status === "CLOSING" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        cancelClose.mutate(tab.id, {
                          onSuccess: () => toast.success("Fechamento cancelado — comanda aberta de novo."),
                          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar o fechamento.")),
                        })
                      }
                    >
                      Cancelar fechamento
                    </Button>
                  ) : null}
                  {isEditable ? (
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCancelOpen(true)}>
                      Cancelar comanda
                    </Button>
                  ) : null}
                </div>
                {pendingItemsCount > 0 ? (
                  <p className="text-xs text-amber-600">
                    Finalize ou cancele os pedidos pendentes antes de fechar a comanda.
                    {" "}({pendingItemsCount} {pendingItemsCount === 1 ? "item pendente" : "itens pendentes"})
                  </p>
                ) : null}
              </div>
            ) : null}

            {tab.status === "CLOSED" && !tab.postCloseCanceledAt && can("venue.operation.tabs.void_after_close") ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setVoidOpen(true)}>
                  Cancelar venda
                </Button>
                <p className="mt-1 text-xs text-black/50">
                  Marca a venda como cancelada e sinaliza cada pagamento para estorno manual — não devolve dinheiro automaticamente.
                </p>
              </div>
            ) : null}

            {tab.postCloseCanceledAt ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
                <p className="font-semibold text-red-700">Venda cancelada</p>
                {tab.postCloseCancelReason ? <p className="text-black/60">Motivo: {tab.postCloseCancelReason}</p> : null}
              </div>
            ) : null}

            {isEditable ? (
              <div className="space-y-3 rounded-xl border border-black/10 p-3">
                <div className="flex items-end gap-2">
                  {discountEditing ? (
                    <>
                      <MoneyField label="Desconto" cents={discountCents} onChange={setDiscountCents} />
                      <Button
                        size="sm"
                        onClick={() =>
                          setDiscount.mutate(
                            { tabId: tab.id, payload: { discountCents, reason: discountCents > 0 ? "Desconto operacional" : undefined } },
                            {
                              onSuccess: () => { toast.success("Desconto aplicado."); setDiscountEditing(false); },
                              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível aplicar o desconto.")),
                            },
                          )
                        }
                      >
                        Aplicar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setDiscountCents(tab.discountCents); setDiscountEditing(true); }}>
                      Definir desconto
                    </Button>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Taxa de serviço (%)</Label>
                    <input
                      className="h-9 w-20 rounded-md border border-input bg-transparent px-2 text-sm"
                      value={serviceRatePct}
                      onChange={(e) => setServiceRatePct(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const pct = parseFloat(serviceRatePct.replace(",", "."));
                      const rateBps = Number.isFinite(pct) ? Math.round(pct * 100) : 0;
                      setServiceCharge.mutate(
                        { tabId: tab.id, payload: { rateBps } },
                        {
                          onSuccess: () => toast.success("Taxa de serviço atualizada."),
                          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a taxa.")),
                        },
                      );
                    }}
                  >
                    Aplicar taxa
                  </Button>
                </div>
              </div>
            ) : null}

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-black/60">Pedidos</h4>
              {tab.orders.length === 0 ? (
                <p className="text-sm text-black/40">Nenhum pedido lançado ainda.</p>
              ) : (
                tab.orders.map((order) => <OrderCard key={order.id} order={order} orgId={orgId} />)
              )}
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-black/60">Pagamentos</h4>
              {tab.payments.length === 0 ? (
                <p className="text-sm text-black/40">Nenhum pagamento registrado ainda.</p>
              ) : (
                <ul className="space-y-1.5">
                  {tab.payments.map((p) => (
                    <li key={p.id} className="space-y-1">
                      <div className={`flex justify-between text-sm ${p.status === "CANCELED" ? "opacity-40 line-through" : ""}`}>
                        <span>{VENUE_PAYMENT_METHOD_LABEL[p.method]}</span>
                        <span>{centsToBRL(p.amountCents)}{p.changeCents > 0 ? ` (troco ${centsToBRL(p.changeCents)})` : ""}</span>
                      </div>
                      {p.refundStatus === "PENDING_MANUAL" ? (
                        <div className="flex items-center justify-between rounded-md bg-amber-50 px-2 py-1">
                          <span className="text-xs text-amber-700">Estorno pendente — devolva o dinheiro manualmente</span>
                          {can("venue.operation.tabs.void_after_close") ? (
                            <button
                              className="text-xs font-medium text-amber-800 underline"
                              onClick={() => setConfirmingRefundId(p.id)}
                            >
                              Já devolvi
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                      {p.refundStatus === "COMPLETED" ? (
                        <p className="text-xs text-emerald-600">Estorno confirmado</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab ? (
          <>
            <OrderBuilderSheet orgId={orgId} tabId={tab.id} open={orderBuilderOpen} onOpenChange={setOrderBuilderOpen} />
            <PaymentDialog
              orgId={orgId}
              tabId={tab.id}
              remainingCents={tab.remainingCents}
              open={paymentOpen}
              onOpenChange={setPaymentOpen}
            />
            <ConfirmDialog
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              title="Cancelar comanda"
              description="Tem certeza? A mesa será liberada e a comanda não pode mais ser editada."
              confirmLabel="Cancelar comanda"
              loading={cancel.isPending}
              onConfirm={() =>
                cancel.mutate(
                  { tabId: tab.id, payload: { reason: "Cancelada pelo operador" } },
                  {
                    onSuccess: () => { toast.success("Comanda cancelada."); setCancelOpen(false); onOpenChange(false); },
                    onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar a comanda.")),
                  },
                )
              }
            />
            <ConfirmDialog
              open={voidOpen}
              onOpenChange={setVoidOpen}
              title="Cancelar venda"
              description="Isto marca a venda como cancelada e sinaliza cada pagamento para estorno manual — o dinheiro NÃO é devolvido automaticamente. A devolução em si (na maquininha, Pix ou espécie) precisa acontecer fora do sistema; depois, confirme aqui em cada pagamento."
              confirmLabel="Cancelar venda"
              loading={cancelClosedTab.isPending}
              onConfirm={() =>
                cancelClosedTab.mutate(
                  { tabId: tab.id, payload: { reason: "Venda cancelada pelo gerente" } },
                  {
                    onSuccess: () => { toast.success("Venda cancelada. Estorno pendente para cada pagamento."); setVoidOpen(false); },
                    onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar a venda.")),
                  },
                )
              }
            />
            <ConfirmDialog
              open={confirmingRefundId !== null}
              onOpenChange={(v) => !v && setConfirmingRefundId(null)}
              title="Confirmar estorno"
              description="Confirme só depois de já ter devolvido o dinheiro de verdade (na maquininha, Pix ou espécie) fora do sistema. Isto apenas registra que a devolução aconteceu — não dispara nenhum estorno."
              confirmLabel="Já devolvi o dinheiro"
              loading={confirmPaymentRefund.isPending}
              onConfirm={() => {
                if (confirmingRefundId === null) return;
                confirmPaymentRefund.mutate(
                  { paymentId: confirmingRefundId, payload: {}, tabId: tab.id },
                  {
                    onSuccess: () => { toast.success("Estorno confirmado."); setConfirmingRefundId(null); },
                    onError: (err) => toast.error(getErrorMessage(err, "Não foi possível confirmar o estorno.")),
                  },
                );
              }}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
