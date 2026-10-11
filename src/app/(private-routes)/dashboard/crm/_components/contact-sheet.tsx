"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { crmApi, crmKeys, type CrmChannel, type CrmContactDetail } from "@/services/crm";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { Pill, PRESSABLE, brl, fmtDate, fmtDay } from "../../financeiro/_components/finance-ui";
import { BTN_SECONDARY, CHANNEL_LABEL, ChannelIcon, FIELD, LINK, SOURCE_LABEL, ago, channelStatus, formatPhone } from "./crm-ui";

const SECTION = "border-t border-[#f2f0f7] pt-5";
const H = "text-[15px] font-semibold text-[#1c1a24]";

/** Detalhe de um contato: o que comprou, de onde veio e por que pode ou não receber. */
export function ContactSheet({ orgId, contactId, onClose, canManage }: { orgId: number; contactId: number | null; onClose: () => void; canManage: boolean }) {
  const queryClient = useQueryClient();
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
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-white p-0 sm:max-w-[520px] [&>button>svg]:text-[#3a3746]">
        {!contact ? (
          <>
            <SheetHeader className="px-6 pb-4 pt-6">
              <SheetTitle>{detail.isError ? "Não foi possível abrir o contato" : "Carregando"}</SheetTitle>
              <SheetDescription className="sr-only">Detalhe do contato</SheetDescription>
            </SheetHeader>
            {detail.isError ? null : (
              <div className="space-y-3 px-6">
                <BlockSkeleton className="h-20" />
                <BlockSkeleton className="h-40" />
              </div>
            )}
          </>
        ) : (
          <>
            <SheetHeader className="gap-1 px-6 pb-5 pt-6 pr-12">
              <SheetTitle className="text-[20px] font-semibold leading-tight text-[#1c1a24]">{contact.name}</SheetTitle>
              <SheetDescription className="text-[14px] text-[#5f5c6b]">
                {[contact.email, formatPhone(contact.phone)].filter(Boolean).join(" · ") || "Sem e-mail nem telefone"}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {contact.sources.map((s) => (
                  <Pill key={s} tone={s === "PURCHASE" ? "violet" : "neutral"}>
                    {SOURCE_LABEL[s]}
                  </Pill>
                ))}
                {!contact.hasAccount ? <Pill tone="neutral">Sem conta na Nokta</Pill> : null}
              </div>
            </SheetHeader>

            <div className="space-y-5 px-6 pb-8 text-[14px] text-[#1c1a24]">
              <dl className="grid grid-cols-3 divide-x divide-[#f2f0f7] rounded-[14px] border border-[#ebe8f2]">
                <Fact label="Compras" value={contact.ordersCount ? String(contact.ordersCount) : "—"} />
                <Fact label="Gasto em ingressos" value={contact.spentCents ? brl(contact.spentCents) : "—"} />
                <Fact label="Última compra" value={contact.lastPurchaseAt ? ago(contact.lastPurchaseAt) : "—"} small />
              </dl>

              <section className={SECTION}>
                <h3 className={H}>Pode receber</h3>
                <div className="mt-3 divide-y divide-[#f2f0f7] rounded-[14px] border border-[#ebe8f2]">
                  {(["EMAIL", "WHATSAPP"] as CrmChannel[]).map((channel) => (
                    <ChannelRow key={channel} orgId={orgId} contact={contact} channel={channel} onChanged={refresh} canManage={canManage} />
                  ))}
                </div>
              </section>

              {contact.purchases.length > 0 ? (
                <section className={SECTION}>
                  <h3 className={H}>Compras</h3>
                  <ul className="mt-3 divide-y divide-[#f2f0f7]">
                    {contact.purchases.map((p) => (
                      <li key={p.orderId} className="flex items-start justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.eventName ?? "Evento"}</span>
                          <span className="block text-[13px] text-[#6b6878]">
                            {p.items.map((i) => `${i.quantity}× ${i.ticketType ?? "Ingresso"}`).join(", ")} · {fmtDate(p.boughtAt)}
                          </span>
                        </span>
                        <span className="shrink-0 font-poppins font-semibold tabular-nums">{brl(p.ticketsValueCents)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {contact.tickets.length > 0 ? (
                <section className={SECTION}>
                  <h3 className={H}>Presença</h3>
                  <ul className="mt-3 space-y-2">
                    {presenceByEvent(contact).map((e) => (
                      <li key={e.eventId} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate">{e.eventName}</span>
                        <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-[#5f5c6b]">
                          {e.upcoming ? (
                            `Evento em ${e.date ? fmtDay(e.date) : "breve"}`
                          ) : e.attended ? (
                            <>
                              <Check size={15} strokeWidth={2.2} className="text-emerald-700" aria-hidden="true" />
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

              <section className={SECTION}>
                <h3 className={H}>De onde veio</h3>
                <ul className="mt-3 space-y-2.5">
                  {originLines(contact).map((s, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block">{s.type === "IMPORT" ? `Planilha ${s.import?.fileName ?? ""}` : `${s.type === "PURCHASE" ? "Primeira compra" : SOURCE_LABEL[s.type]}${s.eventName ? `: ${s.eventName}` : ""}`}</span>
                        {s.import ? <span className="block text-[13px] text-[#6b6878]">{s.import.originDescription}</span> : null}
                      </span>
                      <span className="shrink-0 font-poppins text-[13px] tabular-nums text-[#6b6878]">{fmtDate(s.occurredAt)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={cn(SECTION, "flex flex-wrap items-center gap-2", !canManage && "hidden")}>
                {blocked ? (
                  <button type="button" disabled={unblock.isPending} onClick={() => unblock.mutate()} className={cn(BTN_SECONDARY, PRESSABLE)}>
                    {unblock.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                    Desbloquear contato
                  </button>
                ) : (
                  <Confirm label="Bloquear contato" question="Ele deixa de receber qualquer divulgação sua." confirm="Bloquear" pending={block.isPending} onConfirm={() => block.mutate()} />
                )}
                {!contact.hasAccount ? (
                  <Confirm label="Apagar contato" question="Apaga os dados e mantém o endereço fora dos seus envios." confirm="Apagar" danger pending={remove.isPending} onConfirm={() => remove.mutate()} />
                ) : null}
              </section>
            </div>
          </>
        )}
      </SheetContent>
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

function Fact({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="px-4 py-3.5">
      <dt className="text-[12.5px] text-[#6b6878]">{label}</dt>
      <dd className={cn("mt-1 font-poppins font-semibold tabular-nums", small ? "text-[15px]" : "text-[18px]")}>{value}</dd>
    </div>
  );
}

function presenceByEvent(contact: CrmContactDetail) {
  const today = new Date().toISOString().slice(0, 10);
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

const TONE_TEXT = { ok: "text-emerald-700", off: "text-[#6b6878]", out: "text-[#9b1c35]" } as const;

function ChannelRow({ orgId, contact, channel, onChanged, canManage }: { orgId: number; contact: CrmContactDetail; channel: CrmChannel; onChanged: (next: CrmContactDetail) => void; canManage: boolean }) {
  const state = contact.channels[channel];
  const status = channelStatus(channel, state);
  const [asking, setAsking] = useState(false);
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
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className={cn("mt-0.5 shrink-0", TONE_TEXT[status.tone])}>
            <ChannelIcon channel={channel} size={17} />
          </span>
          <div className="min-w-0">
            <p className="font-medium">
              {CHANNEL_LABEL[channel]}: <span className={TONE_TEXT[status.tone]}>{status.short.toLowerCase()}</span>
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[#6b6878]">{status.detail}</p>
          </div>
        </div>
        <div className={cn("shrink-0", !canManage && "hidden")}>
          {state.eligible ? (
            <Confirm label="Registrar saída" question="A pessoa pediu para sair? Não dá para desfazer." confirm="Confirmar" pending={unsubscribe.isPending} onConfirm={() => unsubscribe.mutate()} link />
          ) : state.reason === "NO_CONSENT" && !asking ? (
            <button type="button" onClick={() => setAsking(true)} className={cn(LINK, PRESSABLE)}>
              Registrar autorização
            </button>
          ) : null}
        </div>
      </div>
      {asking ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (evidence.trim().length >= 5) consent.mutate();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium">Como a pessoa autorizou?</span>
            <input autoFocus value={evidence} onChange={(e) => setEvidence(e.target.value)} maxLength={500} placeholder="Ex.: pediu na portaria em 12/10" className={cn(FIELD, "w-full px-3.5")} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAsking(false)} className={cn(BTN_SECONDARY, "h-9", PRESSABLE)}>
              Cancelar
            </button>
            <button type="submit" disabled={evidence.trim().length < 5 || consent.isPending} className={cn("inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#1c1a24] px-3.5 text-[13.5px] font-semibold text-white disabled:opacity-50", PRESSABLE)}>
              {consent.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
              Registrar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/** Ação em dois toques, no lugar: sem modal para uma confirmação de uma linha. */
function Confirm({ label, question, confirm, onConfirm, pending, danger = false, link = false }: { label: string; question: string; confirm: string; onConfirm: () => void; pending: boolean; danger?: boolean; link?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(link ? LINK : BTN_SECONDARY, danger && !link && "text-[#9b1c35]", PRESSABLE)}>
        {label}
      </button>
    );
  }
  return (
    <ConfirmBox link={link}>
      <span className="text-[13px] text-[#3a3746]">{question}</span>
      <span className="flex shrink-0 gap-2">
        <button type="button" onClick={() => setOpen(false)} className={cn(LINK, "text-[#5f5c6b] hover:text-[#1c1a24]", PRESSABLE)}>
          Voltar
        </button>
        <button type="button" disabled={pending} onClick={onConfirm} className={cn(LINK, "flex items-center gap-1 text-[#9b1c35] hover:text-[#7f1529]", PRESSABLE)}>
          {pending ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : null}
          {confirm}
        </button>
      </span>
    </ConfirmBox>
  );
}

function ConfirmBox({ link, children }: { link: boolean; children: ReactNode }) {
  return <span className={cn("flex items-center gap-3 rounded-[10px] bg-[#fcf5f6] px-3 py-2", link ? "max-w-[230px] flex-col items-end text-right" : "w-full justify-between")}>{children}</span>;
}
