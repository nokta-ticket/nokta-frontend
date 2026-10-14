"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Minus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { crmKeys, type CrmChannel, type CrmContact } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys, type CrmTemplatePreview } from "@/services/crm-marketing";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { PRESSABLE } from "../../financeiro/_components/finance-ui";
import { BTN_PRIMARY, BTN_SECONDARY, CHANNEL_LABEL, ChannelIcon, FIELD, LINK, channelStatus, formatPhone } from "./crm-ui";
import { Blockers, EmailPreviewFrame, EstimateSummary, WhatsappBubble } from "./marketing-ui";

type Mark = "ok" | "no" | "na";

/**
 * Canal de UM contato: mostra por que ele pode ou não receber e, se puder,
 * deixa escolher um modelo, revisar e só então enviar. Abrir esta janela
 * nunca dispara nada.
 */
export function ChannelDialog({
  orgId,
  target,
  onClose,
  onOpenContact,
  onGoTo,
  canSend,
}: {
  orgId: number;
  target: { contact: CrmContact; channel: CrmChannel } | null;
  onClose: () => void;
  onOpenContact: (contactId: number) => void;
  onGoTo: (tab: "templates" | "channels") => void;
  /** Sem permissão de campanhas a janela só informa: nunca oferece envio. */
  canSend: boolean;
}) {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  const contact = target?.contact ?? null;
  const channel = target?.channel ?? "EMAIL";
  const state = contact?.channels[channel];
  const status = state ? channelStatus(channel, state) : null;
  const eligible = Boolean(state?.eligible);

  useEffect(() => {
    setTemplateId(null);
    setConfirming(false);
  }, [contact?.id, channel]);

  const templates = useQuery({
    queryKey: [...crmMarketingKeys.templates(orgId), channel],
    queryFn: () => crmMarketingApi.listTemplates(orgId, channel),
    enabled: target !== null && eligible && canSend,
  });
  const usable = (templates.data ?? []).filter((t) => t.status === "APPROVED");
  const template = usable.find((t) => t.id === templateId) ?? null;

  const preview = useQuery({
    queryKey: [...crmMarketingKeys.templates(orgId), "preview", templateId, contact?.id],
    queryFn: () => crmMarketingApi.previewTemplate(orgId, channel, template!.content, contact!.name),
    enabled: template !== null,
  });
  const estimateInput = { channel, templateId, contactId: contact?.id };
  const estimate = useQuery({
    queryKey: crmMarketingKeys.estimate(orgId, estimateInput),
    queryFn: () => crmMarketingApi.estimate(orgId, { channel, templateId, contactId: contact!.id }),
    enabled: target !== null && eligible && canSend,
  });

  const send = useMutation({
    mutationFn: () => crmMarketingApi.sendIndividual(orgId, contact!.id, { channel, templateId: templateId as number }),
    onSuccess: ({ recipient }) => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.all(orgId) });
      if (recipient?.status === "SENT" || recipient?.status === "DELIVERED") toast.success(`Mensagem enviada para ${contact!.name.split(" ")[0]}.`);
      else toast.error(recipient?.error ?? "A mensagem não foi enviada.");
      onClose();
    },
    onError: (error) => {
      setConfirming(false);
      toast.error(getErrorMessage(error, "Não foi possível enviar."));
    },
  });

  // "Escolha um modelo" não é bloqueio enquanto a pessoa ainda está escolhendo.
  const blockers = (estimate.data?.blockers ?? []).filter((b) => template !== null || b !== "Escolha um modelo.");
  const channelBlocked = (estimate.data?.blockers ?? []).some((b) => /Canais|habilitad|validando|pendentes na Meta|forma de pagamento/.test(b));
  const address = contact ? (channel === "EMAIL" ? contact.email : formatPhone(contact.phone)) : null;

  const marks: [string, Mark, string][] = state
    ? [
        [channel === "EMAIL" ? "E-mail cadastrado" : "Telefone cadastrado", address ? "ok" : "no", address ?? "Não há"],
        [
          "Sem restrição",
          !address ? "na" : state.reason === "OPTED_OUT" || state.reason === "SUPPRESSED" ? "no" : "ok",
          !address ? "—" : state.reason === "OPTED_OUT" || state.reason === "SUPPRESSED" ? (status?.short ?? "") : "Não saiu nem está bloqueado",
        ],
        [
          "Pode receber divulgação",
          eligible ? "ok" : !address || state.reason === "OPTED_OUT" || state.reason === "SUPPRESSED" ? "na" : "no",
          eligible ? (state.legalBasis === "CONSENT" ? "Autorizou receber" : "Tem ingresso de evento seu") : state.reason === "NO_CONSENT" ? "Ainda não autorizou" : "—",
        ],
      ]
    : [];

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
        {contact && state && status ? (
          <>
            <DialogHeader className="gap-1 border-b border-[#ebe8f2] px-6 pb-4 pt-6 pr-12 text-left">
              <DialogTitle className="flex items-center gap-2.5 text-[18px] font-semibold text-[#1c1a24]">
                <span className={eligible ? "text-emerald-700" : "text-[#8a8796]"}>
                  <ChannelIcon channel={channel} size={19} />
                </span>
                {CHANNEL_LABEL[channel]} de {contact.name}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-[#5f5c6b]">{address ?? (channel === "EMAIL" ? "Sem e-mail cadastrado" : "Sem telefone cadastrado")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-5 text-[14px] text-[#1c1a24]">
              <ul className="divide-y divide-[#f2f0f7] rounded-[14px] border border-[#ebe8f2]">
                {marks.map(([label, mark, detail]) => (
                  <li key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", mark === "ok" ? "bg-emerald-50 text-emerald-700" : mark === "no" ? "bg-[#fcf2f4] text-[#9b1c35]" : "bg-[#f4f2f8] text-[#a19eae]")}>
                        {mark === "ok" ? <Check size={13} strokeWidth={2.6} aria-hidden="true" /> : mark === "no" ? <X size={13} strokeWidth={2.6} aria-hidden="true" /> : <Minus size={13} strokeWidth={2.6} aria-hidden="true" />}
                      </span>
                      {label}
                    </span>
                    <span className="min-w-0 truncate text-right text-[13.5px] text-[#5f5c6b]">{detail}</span>
                  </li>
                ))}
              </ul>

              {!eligible ? (
                <div className="rounded-[14px] bg-[#faf8ff] px-4 py-3.5">
                  <p className="font-semibold">Este contato não recebe {CHANNEL_LABEL[channel]} seu.</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#5f5c6b]">{status.detail}</p>
                  {state.reason === "NO_CONSENT" ? (
                    <button type="button" onClick={() => (onClose(), onOpenContact(contact.id))} className={cn(LINK, "mt-2.5", PRESSABLE)}>
                      Registrar autorização no cadastro do contato
                    </button>
                  ) : null}
                </div>
              ) : !canSend ? (
                <p className="rounded-[14px] bg-[#faf8ff] px-4 py-3.5 text-[13.5px] leading-relaxed text-[#3a3746]">Este contato pode receber. Enviar mensagens depende de permissão: peça ao proprietário do workspace.</p>
              ) : templates.isLoading || estimate.isLoading ? (
                <BlockSkeleton className="h-32" />
              ) : channelBlocked ? (
                <>
                  <Blockers items={blockers} title={`Falta para enviar por ${CHANNEL_LABEL[channel]}`} />
                  <button type="button" onClick={() => (onClose(), onGoTo("channels"))} className={cn(BTN_SECONDARY, PRESSABLE)}>
                    Abrir Canais
                  </button>
                </>
              ) : usable.length === 0 ? (
                <div className="rounded-[14px] bg-[#faf8ff] px-4 py-3.5">
                  <p className="font-semibold">{channel === "EMAIL" ? "Você ainda não tem um modelo de e-mail pronto." : "Você ainda não tem um modelo de WhatsApp aprovado pela Meta."}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#5f5c6b]">A mensagem individual usa um modelo, como as campanhas.</p>
                  <button type="button" onClick={() => (onClose(), onGoTo("templates"))} className={cn(LINK, "mt-2.5", PRESSABLE)}>
                    Criar um modelo
                  </button>
                </div>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-[13.5px] font-semibold">Modelo</span>
                    <select
                      value={templateId ?? ""}
                      onChange={(e) => {
                        setTemplateId(e.target.value ? Number(e.target.value) : null);
                        setConfirming(false);
                      }}
                      className={cn(FIELD, "w-full px-3")}
                    >
                      <option value="">Escolha o que enviar</option>
                      {usable.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {template ? (
                    preview.data ? (
                      <Preview preview={preview.data} />
                    ) : (
                      <BlockSkeleton className="h-48" />
                    )
                  ) : null}

                  {template && estimate.data ? (
                    <>
                      <div className="rounded-[14px] border border-[#ebe8f2] px-4">
                        <EstimateSummary estimate={estimate.data} channel={channel} individual />
                      </div>
                      <Blockers items={blockers} />
                    </>
                  ) : null}
                </>
              )}
            </div>

            {eligible && canSend && template && !channelBlocked ? (
              <div className="flex items-center justify-end gap-2 border-t border-[#ebe8f2] px-6 py-4">
                {confirming ? (
                  <>
                    <span className="mr-auto text-[13.5px] text-[#3a3746]">Enviar agora para {contact.name.split(" ")[0]}?</span>
                    <button type="button" onClick={() => setConfirming(false)} className={cn(BTN_SECONDARY, PRESSABLE)}>
                      Voltar
                    </button>
                    <button type="button" disabled={send.isPending} onClick={() => send.mutate()} className={cn(BTN_PRIMARY, PRESSABLE)}>
                      {send.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                      Enviar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={onClose} className={cn(BTN_SECONDARY, PRESSABLE)}>
                      Fechar
                    </button>
                    <button type="button" disabled={blockers.length > 0 || !estimate.data} onClick={() => setConfirming(true)} className={cn(BTN_PRIMARY, PRESSABLE)}>
                      Revisei, quero enviar
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Preview({ preview }: { preview: CrmTemplatePreview }) {
  if (preview.channel === "WHATSAPP") return <WhatsappBubble preview={preview} />;
  return (
    <div>
      <p className="mb-2 text-[13.5px]">
        <span className="text-[#6b6878]">Assunto:</span> <span className="font-medium">{preview.subject}</span>
      </p>
      <EmailPreviewFrame html={preview.html} className="h-[320px]" />
    </div>
  );
}
