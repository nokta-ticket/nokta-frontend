"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { crmApi, crmKeys, type CrmChannel, type CrmContactDetail } from "@/services/crm";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { todayInBrasilia } from "@/lib/format";
import { brl, fmtDate, fmtDay } from "../../financeiro/_components/finance-ui";
import { CHANNEL_LABEL, ChannelIcon, SOURCE_LABEL, TONE_TEXT, ago, channelStatus, formatPhone } from "./crm-ui";

/** Detalhe de um contato: o que comprou, de onde veio e por que pode ou não receber. */
export function ContactSheet({ orgId, contactId, onClose, canManage }: { orgId: number; contactId: number | null; onClose: () => void; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<"block" | "remove" | null>(null);
  const detail = useQuery({
    queryKey: crmKeys.contact(orgId, contactId ?? -1),
    queryFn: () => crmApi.getContact(orgId, contactId as number),
    enabled: contactId !== null,
  });
  const contact = detail.data;

  function refresh(next?: CrmContactDetail) {
    if (next && contactId !== null) queryClient.setQueryData(crmKeys.contact(orgId, contactId), next);
    void queryClient.invalidateQueries({ queryKey: crmKeys.all(orgId) });
  }
  const onError = (error: unknown) => toast.error(getErrorMessage(error, "Não foi possível concluir."));

  const block = useMutation({ mutationFn: () => crmApi.block(orgId, contactId as number), onSuccess: (d) => (refresh(d), toast.success("Contato bloqueado. Ele não recebe mais nada seu.")), onError });
  const unblock = useMutation({ mutationFn: () => crmApi.unblock(orgId, contactId as number), onSuccess: (d) => (refresh(d), toast.success("Contato desbloqueado.")), onError });
  const remove = useMutation({
    mutationFn: () => crmApi.removeContact(orgId, contactId as number),
    onSuccess: () => {
      toast.success("Contato apagado. O endereço dele continua fora dos seus envios.");
      onClose();
      refresh();
    },
    onError,
  });

  const blocked = contact ? [contact.channels.EMAIL, contact.channels.WHATSAPP].some((c) => c.suppressionReason === "MANUAL_BLOCK") : false;

  return (
    <Sheet open={contactId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="sm:max-w-lg">
        {!contact ? (
          <>
            <SheetHeader>
              <SheetTitle>{detail.isError ? "Não foi possível abrir o contato" : "Carregando"}</SheetTitle>
              <SheetDescription className="sr-only">Detalhe do contato</SheetDescription>
            </SheetHeader>
            {detail.isError ? null : (
              <SheetBody>
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </SheetBody>
            )}
          </>
        ) : (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle>{contact.name}</SheetTitle>
              <SheetDescription>{[contact.email, formatPhone(contact.phone)].filter(Boolean).join(" · ") || "Sem e-mail nem telefone"}</SheetDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {contact.sources.map((s) => (
                  <StatusBadge key={s} tone={s === "PURCHASE" ? "brand" : "neutral"} dot={false}>
                    {SOURCE_LABEL[s]}
                  </StatusBadge>
                ))}
                {!contact.hasAccount ? (
                  <StatusBadge tone="neutral" dot={false}>
                    Sem conta na Nokta
                  </StatusBadge>
                ) : null}
              </div>
            </SheetHeader>

            <SheetBody className="text-sm">
              <DetailGrid columns={3} className="sm:grid-cols-3 lg:grid-cols-3">
                <DetailItem label="Compras" value={contact.ordersCount ? String(contact.ordersCount) : null} />
                <DetailItem label="Gasto" value={contact.spentCents ? brl(contact.spentCents) : null} />
                <DetailItem label="Última compra" value={contact.lastPurchaseAt ? ago(contact.lastPurchaseAt) : null} />
              </DetailGrid>

              <section>
                <h3 className="text-sm font-semibold text-foreground">Pode receber</h3>
                <div className="mt-2 divide-y divide-border rounded-xl border border-border">
                  {(["EMAIL", "WHATSAPP"] as CrmChannel[]).map((channel) => (
                    <ChannelRow key={channel} orgId={orgId} contact={contact} channel={channel} onChanged={refresh} canManage={canManage} />
                  ))}
                </div>
              </section>

              {contact.purchases.length > 0 ? (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">Compras</h3>
                  <ul className="mt-1 divide-y divide-border">
                    {contact.purchases.map((p) => (
                      <li key={p.orderId} className="flex items-start justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">{p.eventName ?? "Evento"}</span>
                          <span className="block text-caption text-muted-foreground">
                            {p.items.map((i) => `${i.quantity}× ${i.ticketType ?? "Ingresso"}`).join(", ")} · {fmtDate(p.boughtAt)}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold text-foreground tnum">{brl(p.ticketsValueCents)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {contact.tickets.length > 0 ? (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">Presença</h3>
                  <ul className="mt-1 space-y-2 pt-1">
                    {presenceByEvent(contact).map((e) => (
                      <li key={e.eventId} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-foreground">{e.eventName}</span>
                        <span className="flex shrink-0 items-center gap-1.5 text-caption text-muted-foreground">
                          {e.upcoming ? (
                            `Evento em ${e.date ? fmtDay(e.date) : "breve"}`
                          ) : e.attended ? (
                            <>
                              <Icon name="check" size={11} className="text-success" />
                              {e.attended === e.total ? "Foi" : `${e.attended} de ${e.total} ingressos usados`}
                            </>
                          ) : (
                            "Não foi"
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section>
                <h3 className="text-sm font-semibold text-foreground">De onde veio</h3>
                <ul className="mt-1 space-y-2.5 pt-1">
                  {originLines(contact).map((s, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-foreground">{s.type === "IMPORT" ? `Planilha ${s.import?.fileName ?? ""}` : `${s.type === "PURCHASE" ? "Primeira compra" : SOURCE_LABEL[s.type]}${s.eventName ? `: ${s.eventName}` : ""}`}</span>
                        {s.import ? <span className="block text-caption text-muted-foreground">{s.import.originDescription}</span> : null}
                      </span>
                      <span className="shrink-0 text-caption text-muted-foreground tnum">{fmtDate(s.occurredAt)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {canManage ? (
                <section className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  {blocked ? (
                    <Button variant="outline" size="sm" leftIcon="lock-open" loading={unblock.isPending} onClick={() => unblock.mutate()}>
                      Desbloquear contato
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" leftIcon="ban" onClick={() => setConfirm("block")}>
                      Bloquear contato
                    </Button>
                  )}
                  {!contact.hasAccount ? (
                    <Button variant="destructive-soft" size="sm" leftIcon="trash" onClick={() => setConfirm("remove")}>
                      Apagar contato
                    </Button>
                  ) : null}
                </section>
              ) : null}
            </SheetBody>
          </>
        )}
      </SheetContent>

      <ConfirmDialog open={confirm === "block"} onOpenChange={(o) => (!o ? setConfirm(null) : null)} danger icon="ban" title="Bloquear este contato?" description="Ele deixa de receber qualquer divulgação sua. Dá para desbloquear depois." confirmLabel="Bloquear" onConfirm={() => block.mutateAsync()} />
      <ConfirmDialog open={confirm === "remove"} onOpenChange={(o) => (!o ? setConfirm(null) : null)} danger icon="trash" title="Apagar este contato?" description="Apaga os dados e mantém o endereço fora dos seus envios." confirmLabel="Apagar" onConfirm={() => remove.mutateAsync()} />
    </Sheet>
  );
}

/** Compras já aparecem na seção própria: aqui entra só a primeira, mais as outras origens. */
function originLines(contact: CrmContactDetail) {
  const purchases = contact.sourceDetails.filter((s) => s.type === "PURCHASE");
  const first = purchases.length ? purchases.reduce((a, b) => (a.occurredAt < b.occurredAt ? a : b)) : null;
  const others = contact.sourceDetails.filter((s) => s.type !== "PURCHASE");
  return [...others, ...(first ? [first] : [])].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

function presenceByEvent(contact: CrmContactDetail) {
  const today = todayInBrasilia();
  const map = new Map<number, { eventId: number; eventName: string; date: string | null; total: number; attended: number; upcoming: boolean }>();
  for (const t of contact.tickets) {
    if (t.eventId === null) continue;
    const entry = map.get(t.eventId) ?? { eventId: t.eventId, eventName: t.eventName ?? "Evento", date: t.eventDate, total: 0, attended: 0, upcoming: (t.eventDate ?? "").slice(0, 10) >= today };
    entry.total++;
    if (t.attended) entry.attended++;
    map.set(t.eventId, entry);
  }
  return [...map.values()].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

function ChannelRow({ orgId, contact, channel, onChanged, canManage }: { orgId: number; contact: CrmContactDetail; channel: CrmChannel; onChanged: (next: CrmContactDetail) => void; canManage: boolean }) {
  const state = contact.channels[channel];
  const status = channelStatus(channel, state);
  const [asking, setAsking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [evidence, setEvidence] = useState("");
  useEffect(() => {
    setAsking(false);
    setEvidence("");
  }, [contact.id]);

  const onError = (error: unknown) => toast.error(getErrorMessage(error, "Não foi possível concluir."));
  const consent = useMutation({
    mutationFn: () => crmApi.recordConsent(orgId, contact.id, channel, evidence.trim()),
    onSuccess: (d) => {
      onChanged(d);
      setAsking(false);
      toast.success(`Autorização de ${CHANNEL_LABEL[channel]} registrada.`);
    },
    onError,
  });
  const unsubscribe = useMutation({
    mutationFn: () => crmApi.unsubscribe(orgId, contact.id, channel),
    onSuccess: (d) => {
      onChanged(d);
      toast.success(`${contact.name.split(" ")[0]} não recebe mais ${CHANNEL_LABEL[channel]} seu.`);
    },
    onError,
  });

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <ChannelIcon channel={channel} size={15} className={cn("mt-0.5 shrink-0", TONE_TEXT[status.tone])} />
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              {CHANNEL_LABEL[channel]}: <span className={TONE_TEXT[status.tone]}>{status.short.toLowerCase()}</span>
            </p>
            <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{status.detail}</p>
          </div>
        </div>
        {canManage ? (
          <div className="shrink-0">
            {state.eligible ? (
              <Button variant="link" size="sm" onClick={() => setLeaving(true)}>
                Registrar saída
              </Button>
            ) : state.reason === "NO_CONSENT" && !asking ? (
              <Button variant="link" size="sm" onClick={() => setAsking(true)}>
                Registrar autorização
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {asking ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (evidence.trim().length >= 5) consent.mutate();
          }}
        >
          <Field label="Como a pessoa autorizou?" htmlFor={`consent-${channel}`}>
            <Input id={`consent-${channel}`} autoFocus value={evidence} onChange={(e) => setEvidence(e.target.value)} maxLength={500} placeholder="Ex.: pediu na portaria em 12/10" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAsking(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={evidence.trim().length < 5} loading={consent.isPending}>
              Registrar
            </Button>
          </div>
        </form>
      ) : null}
      <ConfirmDialog open={leaving} onOpenChange={setLeaving} danger icon="x-circle" title="Registrar que a pessoa pediu para sair?" description={`${contact.name.split(" ")[0]} não recebe mais ${CHANNEL_LABEL[channel]} seu. Não dá para desfazer — só ela pode voltar a autorizar.`} confirmLabel="Confirmar saída" onConfirm={() => unsubscribe.mutateAsync()} />
    </div>
  );
}
