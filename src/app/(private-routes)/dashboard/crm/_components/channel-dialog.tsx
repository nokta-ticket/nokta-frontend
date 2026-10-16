"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { crmKeys, type CrmChannel, type CrmContact } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys } from "@/services/crm-marketing";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { CHANNEL_LABEL, ChannelIcon, channelStatus, formatPhone, type CrmTabKey } from "./crm-ui";
import { Blockers, EstimateSummary, PreviewBox } from "./marketing-ui";

type Mark = "ok" | "no" | "na";

/**
 * Canal de UM contato: mostra por que ele pode ou não receber e, se puder,
 * deixa escolher um modelo, revisar e só então enviar. Abrir esta janela
 * nunca dispara nada.
 */
export function ChannelDialog({ orgId, target, onClose, onOpenContact, onGoTo, canSend }: { orgId: number; target: { contact: CrmContact; channel: CrmChannel } | null; onClose: () => void; onOpenContact: (contactId: number) => void; onGoTo: (tab: CrmTabKey) => void; /** Sem permissão de campanhas a janela só informa: nunca oferece envio. */ canSend: boolean }) {
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
  const address = contact ? (channel === "EMAIL" ? contact.email : channel === "PUSH" ? (contact.channels.PUSH.reason === "NO_ADDRESS" ? null : "App da Nokta Tickets") : formatPhone(contact.phone)) : null;

  const marks: [string, Mark, string][] = state
    ? [
        [channel === "EMAIL" ? "E-mail cadastrado" : channel === "PUSH" ? "Notificações ativas no celular" : "Telefone cadastrado", address ? "ok" : "no", address ?? "Não há"],
        ["Sem restrição", !address ? "na" : state.reason === "OPTED_OUT" || state.reason === "SUPPRESSED" ? "no" : "ok", !address ? "—" : state.reason === "OPTED_OUT" || state.reason === "SUPPRESSED" ? (status?.short ?? "") : "Não saiu nem está bloqueado"],
        ["Pode receber divulgação", eligible ? "ok" : !address || state.reason === "OPTED_OUT" || state.reason === "SUPPRESSED" ? "na" : "no", eligible ? (state.legalBasis === "CONSENT" ? "Autorizou receber" : "Tem ingresso de evento seu") : state.reason === "NO_CONSENT" ? "Ainda não autorizou" : "—"],
      ]
    : [];

  const showFooter = eligible && canSend && template && !channelBlocked;

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        {contact && state && status ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <ChannelIcon channel={channel} size={16} className={eligible ? "text-success" : "text-subtle-foreground"} />
                {CHANNEL_LABEL[channel]} de {contact.name}
              </DialogTitle>
              <DialogDescription>{address ?? (channel === "EMAIL" ? "Sem e-mail cadastrado" : channel === "PUSH" ? "Sem o app com notificações ativas" : "Sem telefone cadastrado")}</DialogDescription>
            </DialogHeader>

            <DialogBody className="gap-4 text-sm">
              <ul className="divide-y divide-border rounded-xl border border-border">
                {marks.map(([label, mark, detail]) => (
                  <li key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="flex items-center gap-2.5 text-foreground">
                      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", mark === "ok" ? "bg-success-bg text-success" : mark === "no" ? "bg-danger-bg text-danger" : "bg-surface-2 text-subtle-foreground")}>
                        <Icon name={mark === "ok" ? "check" : mark === "no" ? "close" : "minus"} size={9} />
                      </span>
                      {label}
                    </span>
                    <span className="min-w-0 truncate text-right text-caption text-muted-foreground">{detail}</span>
                  </li>
                ))}
              </ul>

              {!eligible ? (
                <Callout tone="neutral" title={`Este contato não recebe ${CHANNEL_LABEL[channel]} seu.`}>
                  {status.detail}
                  {state.reason === "NO_CONSENT" ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1.5 block h-auto"
                      onClick={() => {
                        onClose();
                        onOpenContact(contact.id);
                      }}
                    >
                      Registrar autorização no cadastro do contato
                    </Button>
                  ) : null}
                </Callout>
              ) : !canSend ? (
                <Callout tone="neutral">Este contato pode receber. Enviar mensagens depende de permissão: peça ao proprietário do workspace.</Callout>
              ) : templates.isLoading || estimate.isLoading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : channelBlocked ? (
                <>
                  <Blockers items={blockers} title={`Falta para enviar por ${CHANNEL_LABEL[channel]}`} />
                  <Button
                    variant="outline"
                    className="self-start"
                    onClick={() => {
                      onClose();
                      onGoTo("channels");
                    }}
                  >
                    Abrir Canais
                  </Button>
                </>
              ) : usable.length === 0 ? (
                <Callout
                  tone="neutral"
                  title={channel === "EMAIL" ? "Você ainda não tem um modelo de e-mail pronto." : channel === "PUSH" ? "Você ainda não tem um modelo de notificação pronto." : "Você ainda não tem um modelo de WhatsApp aprovado pela Meta."}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onGoTo("templates");
                      }}
                    >
                      Criar modelo
                    </Button>
                  }
                >
                  A mensagem individual usa um modelo, como as campanhas.
                </Callout>
              ) : (
                <>
                  <Field label="Modelo" htmlFor="channel-template">
                    <NativeSelect
                      id="channel-template"
                      value={templateId ?? ""}
                      onChange={(e) => {
                        setTemplateId(e.target.value ? Number(e.target.value) : null);
                        setConfirming(false);
                      }}
                    >
                      <option value="">Escolha o que enviar</option>
                      {usable.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  {template ? preview.data ? <PreviewBox preview={preview.data} height="h-[320px]" /> : <Skeleton className="h-48 rounded-xl" /> : null}

                  {template && estimate.data ? (
                    <>
                      <div className="rounded-xl border border-border px-4">
                        <EstimateSummary estimate={estimate.data} channel={channel} individual />
                      </div>
                      <Blockers items={blockers} />
                    </>
                  ) : null}
                </>
              )}
            </DialogBody>

            {showFooter ? (
              <DialogFooter>
                {confirming ? (
                  <>
                    <span className="mr-auto text-caption text-muted-foreground">Enviar agora para {contact.name.split(" ")[0]}?</span>
                    <Button variant="ghost" onClick={() => setConfirming(false)}>
                      Voltar
                    </Button>
                    <Button leftIcon="send" loading={send.isPending} onClick={() => send.mutate()}>
                      Enviar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={onClose}>
                      Fechar
                    </Button>
                    <Button disabled={blockers.length > 0 || !estimate.data} onClick={() => setConfirming(true)}>
                      Revisei, quero enviar
                    </Button>
                  </>
                )}
              </DialogFooter>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
