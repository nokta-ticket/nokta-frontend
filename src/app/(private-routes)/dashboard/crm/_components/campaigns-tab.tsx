"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { CrmChannel, CrmFilterOptions, CrmSegment } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys, formatMicros, type CrmCampaign, type CrmTemplatePreview } from "@/services/crm-marketing";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { Pill, PRESSABLE, SURFACE, fmtDate, fmtTime } from "../../financeiro/_components/finance-ui";
import { BTN_PRIMARY, BTN_SECONDARY, CHANNEL_LABEL, ChannelIcon, FIELD, LINK, describeFilters, num } from "./crm-ui";
import { Blockers, CAMPAIGN_STATUS, EmailPreviewFrame, EstimateSummary, RECIPIENT_STATUS, SKIP_REASON, WhatsappBubble } from "./marketing-ui";

const TH = "px-5 py-3 font-semibold";
const NUM = "px-5 py-4 text-right font-poppins tabular-nums";
const when = (iso: string | null) => (iso ? `${fmtDate(iso)} às ${fmtTime(iso)}` : "");
const pct = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : "—");
const RUNNING = ["SCHEDULED", "VALIDATING", "QUEUED", "SENDING"];

/** Campanhas: lista com resultados, criação com estimativa de custo e acompanhamento. */
export function CampaignsTab({ orgId, segments, options, onGoTo, canManage }: { orgId: number; segments: CrmSegment[]; options?: CrmFilterOptions; onGoTo: (tab: "templates" | "channels" | "audiences") => void; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [composing, setComposing] = useState<CrmCampaign | "new" | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const list = useQuery({
    queryKey: crmMarketingKeys.campaigns(orgId),
    queryFn: () => crmMarketingApi.listCampaigns(orgId),
    // Enquanto algo está na fila, os números mudam sozinhos.
    refetchInterval: (query) => (query.state.data?.some((c) => RUNNING.includes(c.status)) ? 10_000 : false),
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: crmMarketingKeys.campaigns(orgId) });

  /** Custo zero num e-mail não é "de graça": saiu da franquia que o plano inclui. */
  const costLabel = (c: CrmCampaign) => (c.estimatedCostMicros === null ? null : c.estimatedCostMicros === 0 && c.channel === "EMAIL" ? "Incluído no plano" : formatMicros(c.estimatedCostMicros));
  const open = (c: CrmCampaign) => (c.status === "DRAFT" && canManage ? setComposing(c) : setOpenId(c.id));

  if (composing) {
    return (
      <Composer
        orgId={orgId}
        draft={composing === "new" ? null : composing}
        segments={segments}
        options={options}
        onGoTo={onGoTo}
        onClose={() => {
          setComposing(null);
          refresh();
        }}
      />
    );
  }

  const rows = list.data ?? [];
  const audienceOf = (c: CrmCampaign) => segments.find((s) => s.id === c.segmentId)?.name ?? (describeFilters(c.filters, options).join(" · ") || "Toda a lista");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[80ch] text-[14px] leading-relaxed text-[#5f5c6b]">Cada campanha mostra o custo antes de você confirmar e só vai para quem pode receber naquele canal.</p>
        <button type="button" onClick={() => setComposing("new")} className={cn(BTN_PRIMARY, "shrink-0", !canManage && "hidden", PRESSABLE)}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Nova campanha
        </button>
      </div>

      <div className={cn(SURFACE, "overflow-hidden")}>
        {list.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <BlockSkeleton key={i} className="h-14" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="mx-auto max-w-[52ch] text-[15px] font-semibold text-[#1c1a24]">Nenhuma campanha ainda.</p>
            <p className="mx-auto mt-2 max-w-[62ch] text-[14px] leading-relaxed text-[#5f5c6b]">Escolha um canal, um modelo e um público. Antes de confirmar você vê quantas pessoas recebem e quanto custa.</p>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-left text-[14px] lg:table">
              <thead className="bg-[#fbfaff] text-[13px] text-[#5f5c6b]">
                <tr className="border-b border-[#ebe8f2]">
                  <th scope="col" className={cn(TH, "w-[24%]")}>Campanha</th>
                  <th scope="col" className={cn(TH, "w-[22%]")}>Público</th>
                  <th scope="col" className={TH}>Situação</th>
                  <th scope="col" className={TH}>Quando</th>
                  <th scope="col" className={cn(TH, "text-right")}>Enviadas</th>
                  <th scope="col" className={cn(TH, "text-right")}>Entregues</th>
                  <th scope="col" className={cn(TH, "text-right")}>Abertas</th>
                  <th scope="col" className={cn(TH, "text-right")}>Custo estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f0f7]">
                {rows.map((c) => {
                  const sent = c.results.sent;
                  const started = !["DRAFT", "SCHEDULED", "CANCELLED"].includes(c.status);
                  return (
                    <tr key={c.id} tabIndex={0} className="cursor-pointer outline-none hover:bg-[#faf8ff] focus-visible:bg-[#f7f3ff]" onClick={() => open(c)} onKeyDown={(e) => e.key === "Enter" && open(c)}>
                      <td className="max-w-0 px-5 py-4">
                        <span className="flex items-center gap-2 font-medium text-[#1c1a24]">
                          <span className="shrink-0 text-[#6b6878]"><ChannelIcon channel={c.channel} /></span>
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="block truncate pl-[23px] text-[13px] text-[#6b6878]">{c.templateName ?? "Sem modelo"}</span>
                      </td>
                      <td className="max-w-0 px-5 py-4 text-[13.5px] text-[#3a3746]"><span className="block truncate">{audienceOf(c)}</span></td>
                      <td className="px-5 py-4"><Pill tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</Pill></td>
                      <td className="whitespace-nowrap px-5 py-4 font-poppins text-[13.5px] tabular-nums text-[#3a3746]">{when(c.status === "SCHEDULED" ? c.scheduledAt : (c.startedAt ?? c.scheduledAt)) || <span className="font-sans text-[#a19eae]">—</span>}</td>
                      <td className={NUM}>{started ? num(sent) : c.estimatedRecipients !== null ? <span className="text-[#8a8796]">~{num(c.estimatedRecipients)}</span> : <span className="text-[#a19eae]">—</span>}</td>
                      <td className={NUM}>{started && sent ? <>{num(c.results.delivered)} <span className="text-[13px] text-[#8a8796]">{pct(c.results.delivered, sent)}</span></> : <span className="text-[#a19eae]">—</span>}</td>
                      <td className={NUM}>{started && sent ? <>{num(c.results.opened)} <span className="text-[13px] text-[#8a8796]">{pct(c.results.opened, sent)}</span></> : <span className="text-[#a19eae]">—</span>}</td>
                      <td className={cn(NUM, "font-semibold")}>{costLabel(c) ?? <span className="font-normal text-[#a19eae]">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ul className="divide-y divide-[#f2f0f7] lg:hidden">
              {rows.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => open(c)} className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf8ff]">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="shrink-0 text-[#6b6878]"><ChannelIcon channel={c.channel} /></span>
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-[#5f5c6b]">{c.results.sent ? `${num(c.results.sent)} enviadas · ${num(c.results.delivered)} entregues` : audienceOf(c)}</span>
                    </span>
                    <Pill tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</Pill>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <CampaignSheet orgId={orgId} campaignId={openId} audienceOf={audienceOf} costLabel={costLabel} canManage={canManage} onClose={() => setOpenId(null)} onChanged={refresh} />
    </div>
  );
}

// ── criação ──

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-[#f2f0f7] pt-5 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2.5 text-[15px] font-semibold text-[#1c1a24]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3edff] font-poppins text-[12.5px] font-semibold tabular-nums text-[#6d28d9]">{n}</span>
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Data e hora locais no formato do <input type="datetime-local">. */
function localInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Composer({ orgId, draft, segments, options, onGoTo, onClose }: { orgId: number; draft: CrmCampaign | null; segments: CrmSegment[]; options?: CrmFilterOptions; onGoTo: (tab: "templates" | "channels" | "audiences") => void; onClose: () => void }) {
  const [id, setId] = useState<number | null>(draft?.id ?? null);
  const [name, setName] = useState(draft?.name ?? "");
  const [channel, setChannel] = useState<CrmChannel>(draft?.channel ?? "EMAIL");
  const [templateId, setTemplateId] = useState<number | null>(draft?.templateId ?? null);
  const [segmentId, setSegmentId] = useState<number | null>(draft?.segmentId ?? null);
  const [mode, setMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState(() => localInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [confirming, setConfirming] = useState(false);

  const templates = useQuery({ queryKey: [...crmMarketingKeys.templates(orgId), channel], queryFn: () => crmMarketingApi.listTemplates(orgId, channel) });
  const usable = (templates.data ?? []).filter((t) => t.status === "APPROVED");
  const template = usable.find((t) => t.id === templateId) ?? null;
  useEffect(() => {
    if (templates.data && templateId !== null && !usable.some((t) => t.id === templateId)) setTemplateId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.data]);

  const preview = useQuery({
    queryKey: [...crmMarketingKeys.templates(orgId), "preview", templateId],
    queryFn: () => crmMarketingApi.previewTemplate(orgId, channel, template!.content),
    enabled: template !== null,
  });
  const estimateInput = { channel, templateId, segmentId, filters: {} };
  const estimate = useQuery({ queryKey: crmMarketingKeys.estimate(orgId, estimateInput), queryFn: () => crmMarketingApi.estimate(orgId, estimateInput) });

  const input = { name: name.trim(), channel, templateId, segmentId, filters: {} };
  const onError = (error: unknown) => {
    setConfirming(false);
    toast.error(getErrorMessage(error, "Não foi possível concluir."));
  };
  const saveDraft = async () => {
    const saved = id ? await crmMarketingApi.updateCampaign(orgId, id, input) : await crmMarketingApi.createCampaign(orgId, input);
    setId(saved.id);
    return saved;
  };
  const save = useMutation({ mutationFn: saveDraft, onSuccess: () => toast.success("Rascunho salvo."), onError });
  const confirm = useMutation({
    mutationFn: async () => crmMarketingApi.scheduleCampaign(orgId, (await saveDraft()).id, mode === "later" ? new Date(scheduledAt).toISOString() : undefined),
    onSuccess: () => {
      toast.success(mode === "later" ? "Campanha agendada." : "Campanha confirmada. O envio começa em instantes.");
      onClose();
    },
    onError,
  });
  const discard = useMutation({ mutationFn: () => crmMarketingApi.removeCampaign(orgId, id as number), onSuccess: () => (toast.success("Rascunho apagado."), onClose()), onError });

  const blockers = estimate.data?.blockers ?? [];
  const validName = name.trim().length >= 2;
  const segment = segments.find((s) => s.id === segmentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onClose} className={cn("flex items-center gap-2 rounded-md text-[15px] font-semibold text-[#1c1a24] outline-none hover:text-[#7c3aed] focus-visible:ring-2 focus-visible:ring-[#7c3aed]", PRESSABLE)}>
          <ArrowLeft size={17} strokeWidth={2} aria-hidden="true" />
          {draft ? "Campanha em rascunho" : "Nova campanha"}
        </button>
        <div className="flex gap-2">
          {id ? (
            <button type="button" disabled={discard.isPending} onClick={() => discard.mutate()} className={cn(BTN_SECONDARY, "text-[#9b1c35]", PRESSABLE)}>
              Apagar rascunho
            </button>
          ) : null}
          <button type="button" disabled={!validName || save.isPending} onClick={() => save.mutate()} className={cn(BTN_SECONDARY, PRESSABLE)}>
            {save.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            Salvar rascunho
          </button>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={cn(SURFACE, "space-y-5 p-5 sm:p-6")}>
          <Step n={1} title="Nome e canal">
            <div className="space-y-3">
              <input aria-label="Nome da campanha" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} placeholder="Nome da campanha (só você vê)" className={cn(FIELD, "w-full px-3.5")} />
              <div role="radiogroup" aria-label="Canal" className="grid grid-cols-2 gap-2">
                {(["EMAIL", "WHATSAPP"] as CrmChannel[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={channel === c}
                    onClick={() => {
                      setChannel(c);
                      setTemplateId(null);
                      setConfirming(false);
                    }}
                    className={cn(
                      "flex h-12 items-center justify-center gap-2.5 rounded-[12px] border text-[14.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]",
                      channel === c ? "border-[#7c3aed] bg-[#f7f3ff] text-[#6d28d9]" : "border-[#e6e2ef] bg-white text-[#3a3746] hover:bg-[#faf8ff]",
                      PRESSABLE,
                    )}
                  >
                    <ChannelIcon channel={c} size={17} />
                    {CHANNEL_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
          </Step>

          <Step n={2} title="O que enviar">
            {templates.isLoading ? (
              <BlockSkeleton className="h-11" />
            ) : usable.length === 0 ? (
              <p className="rounded-[14px] bg-[#faf8ff] px-4 py-3.5 text-[14px] leading-relaxed text-[#3a3746]">
                {channel === "EMAIL" ? "Você ainda não tem um modelo de e-mail pronto." : "Você ainda não tem um modelo de WhatsApp aprovado pela Meta."}{" "}
                <button type="button" onClick={() => onGoTo("templates")} className={cn(LINK, "text-[14px]", PRESSABLE)}>
                  Criar um modelo
                </button>
              </p>
            ) : (
              <select aria-label="Modelo" value={templateId ?? ""} onChange={(e) => (setTemplateId(e.target.value ? Number(e.target.value) : null), setConfirming(false))} className={cn(FIELD, "w-full px-3")}>
                <option value="">Escolha um modelo</option>
                {usable.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </Step>

          <Step n={3} title="Para quem">
            <select aria-label="Público" value={segmentId ?? ""} onChange={(e) => (setSegmentId(e.target.value ? Number(e.target.value) : null), setConfirming(false))} className={cn(FIELD, "w-full px-3")}>
              <option value="">Toda a lista</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({num(s.counts.total)})
                </option>
              ))}
            </select>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b6878]">
              {segment ? describeFilters(segment.filters, options).join(" · ") : "Todos os seus contatos."} Só recebe quem pode receber por {channel === "EMAIL" ? "e-mail" : "WhatsApp"}.{" "}
              <button type="button" onClick={() => onGoTo("audiences")} className={cn(LINK, "text-[13px]", PRESSABLE)}>
                Ver públicos
              </button>
            </p>
          </Step>

          <Step n={4} title="Quando">
            <div role="radiogroup" aria-label="Quando enviar" className="space-y-2">
              {(
                [
                  ["now", "Assim que eu confirmar"],
                  ["later", "Agendar"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-3 text-[14px]">
                  <input type="radio" name="crm-when" checked={mode === key} onChange={() => (setMode(key), setConfirming(false))} className="h-[18px] w-[18px] cursor-pointer accent-[#7c3aed]" />
                  {label}
                </label>
              ))}
              {mode === "later" ? <input type="datetime-local" aria-label="Data e hora do envio" value={scheduledAt} min={localInput(new Date())} onChange={(e) => setScheduledAt(e.target.value)} className={cn(FIELD, "ml-[30px] px-3 font-poppins tabular-nums")} /> : null}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b6878]">A lista de quem recebe é conferida de novo na hora do envio: quem sair até lá não recebe.</p>
          </Step>
        </div>

        <div className={cn(SURFACE, "xl:sticky xl:top-4")}>
          <div className="space-y-4 p-5 sm:p-6">
            <h3 className="text-[15px] font-semibold text-[#1c1a24]">Antes de confirmar</h3>
            {estimate.data ? (
              <div className="rounded-[14px] border border-[#ebe8f2] px-4">
                <EstimateSummary estimate={estimate.data} channel={channel} />
              </div>
            ) : (
              <BlockSkeleton className="h-40" />
            )}
            <Blockers items={blockers} />
            {template ? preview.data ? <PreviewBox preview={preview.data} /> : <BlockSkeleton className="h-64" /> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#ebe8f2] px-5 py-4 sm:px-6">
            {confirming ? (
              <>
                <span className="mr-auto text-[13.5px] text-[#3a3746]">
                  {mode === "later" ? `Agendar para ${when(new Date(scheduledAt).toISOString())}` : "Enviar agora"} para {num(estimate.data?.audience.willReceive ?? 0)} {estimate.data?.audience.willReceive === 1 ? "pessoa" : "pessoas"}?
                </span>
                <button type="button" onClick={() => setConfirming(false)} className={cn(BTN_SECONDARY, PRESSABLE)}>
                  Voltar
                </button>
                <button type="button" disabled={confirm.isPending} onClick={() => confirm.mutate()} className={cn(BTN_PRIMARY, PRESSABLE)}>
                  {confirm.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                  Confirmar
                </button>
              </>
            ) : (
              <button type="button" disabled={!validName || !estimate.data || blockers.length > 0} onClick={() => setConfirming(true)} className={cn(BTN_PRIMARY, PRESSABLE)}>
                {mode === "later" ? "Agendar campanha" : "Enviar campanha"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBox({ preview }: { preview: CrmTemplatePreview }) {
  if (preview.channel === "WHATSAPP") return <WhatsappBubble preview={preview} />;
  return (
    <div>
      <p className="mb-2 text-[13.5px]">
        <span className="text-[#6b6878]">Assunto:</span> <span className="font-medium">{preview.subject}</span>
      </p>
      <EmailPreviewFrame html={preview.html} className="h-[420px]" />
    </div>
  );
}

// ── acompanhamento ──

function CampaignSheet({ orgId, campaignId, audienceOf, costLabel, canManage, onClose, onChanged }: { orgId: number; campaignId: number | null; audienceOf: (c: CrmCampaign) => string; costLabel: (c: CrmCampaign) => string | null; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [campaignId]);
  const campaign = useQuery({
    queryKey: crmMarketingKeys.campaign(orgId, campaignId ?? -1),
    queryFn: () => crmMarketingApi.getCampaign(orgId, campaignId as number),
    enabled: campaignId !== null,
    refetchInterval: (query) => (query.state.data && RUNNING.includes(query.state.data.status) ? 8_000 : false),
  });
  const recipients = useQuery({
    queryKey: crmMarketingKeys.recipients(orgId, campaignId ?? -1, page),
    queryFn: () => crmMarketingApi.campaignRecipients(orgId, campaignId as number, page),
    enabled: campaignId !== null,
    placeholderData: (prev) => prev,
  });
  const cancel = useMutation({
    mutationFn: () => crmMarketingApi.cancelCampaign(orgId, campaignId as number),
    onSuccess: () => {
      void campaign.refetch();
      onChanged();
      toast.success("Campanha cancelada. Nada foi enviado.");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível cancelar.")),
  });

  const c = campaign.data;
  const r = c?.results;
  const pages = Math.max(1, Math.ceil((recipients.data?.total ?? 0) / (recipients.data?.perPage ?? 50)));

  return (
    <Sheet open={campaignId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-white p-0 sm:max-w-[560px] [&>button>svg]:text-[#3a3746]">
        {!c || !r ? (
          <>
            <SheetHeader className="px-6 pb-4 pt-6">
              <SheetTitle>Carregando</SheetTitle>
              <SheetDescription className="sr-only">Detalhe da campanha</SheetDescription>
            </SheetHeader>
            <div className="space-y-3 px-6">
              <BlockSkeleton className="h-24" />
              <BlockSkeleton className="h-48" />
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="gap-1 px-6 pb-5 pt-6 pr-12">
              <SheetTitle className="flex items-center gap-2.5 text-[20px] font-semibold leading-tight text-[#1c1a24]">
                <span className="shrink-0 text-[#6b6878]"><ChannelIcon channel={c.channel} size={19} /></span>
                {c.name}
              </SheetTitle>
              <SheetDescription className="text-[14px] text-[#5f5c6b]">
                {c.templateName ?? "Sem modelo"} · {audienceOf(c)}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <Pill tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</Pill>
                <span className="text-[13px] text-[#6b6878]">{c.status === "SCHEDULED" ? `Envio em ${when(c.scheduledAt)}` : c.finishedAt ? `Terminou em ${when(c.finishedAt)}` : c.startedAt ? `Começou em ${when(c.startedAt)}` : ""}</span>
              </div>
            </SheetHeader>

            <div className="space-y-5 px-6 pb-8 text-[14px] text-[#1c1a24]">
              {c.lastError ? <Blockers items={[c.lastError]} title="A campanha não foi enviada" /> : null}

              {c.status === "SCHEDULED" && canManage ? (
                <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#faf8ff] px-4 py-3.5">
                  <p className="text-[13.5px] leading-relaxed text-[#3a3746]">Ainda dá para cancelar. Depois que o envio começa, o que saiu não volta.</p>
                  <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()} className={cn(BTN_SECONDARY, "shrink-0 text-[#9b1c35]", PRESSABLE)}>
                    {cancel.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                    Cancelar envio
                  </button>
                </div>
              ) : null}

              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-[#ebe8f2] bg-[#f2f0f7]">
                <Stat label="Aceitas pelo provedor" value={num(r.sent)} hint={c.estimatedRecipients !== null ? `de ${num(c.estimatedRecipients)} estimadas` : undefined} />
                <Stat label="Entregues" value={num(r.delivered)} hint={r.sent ? `${pct(r.delivered, r.sent)} das enviadas` : undefined} />
                <Stat label="Abertas" value={num(r.opened)} hint={r.sent ? pct(r.opened, r.sent) : undefined} />
                <Stat label="Clicaram" value={num(r.clicked)} hint={r.sent ? pct(r.clicked, r.sent) : undefined} />
                <Stat label="Falharam" value={num(r.failed)} loss={r.failed > 0} />
                <Stat label="Saíram da lista" value={num(r.unsubscribed)} loss={r.unsubscribed > 0} />
              </dl>
              <p className="text-[13px] leading-relaxed text-[#6b6878]">
                &quot;Aceita&quot; quer dizer que o provedor recebeu a mensagem; &quot;entregue&quot;, que ela chegou à caixa da pessoa.
                {r.skipped > 0 ? ` ${num(r.skipped)} não ${r.skipped === 1 ? "foi enviada" : "foram enviadas"} de propósito (a pessoa saiu da lista antes do envio ou faltou crédito).` : ""}
              </p>

              <div className="flex items-baseline justify-between gap-4 border-t border-[#f2f0f7] pt-4">
                <span className="text-[14px] text-[#3a3746]">Custo estimado na confirmação</span>
                <span className="font-poppins text-[16px] font-bold tabular-nums">{costLabel(c) ?? "Sem estimativa"}</span>
              </div>

              <section className="border-t border-[#f2f0f7] pt-5">
                <h3 className="text-[15px] font-semibold text-[#1c1a24]">Destinatários</h3>
                {!recipients.data ? (
                  <BlockSkeleton className="mt-3 h-40" />
                ) : recipients.data.items.length === 0 ? (
                  <p className="mt-2 text-[13.5px] text-[#6b6878]">{c.status === "SCHEDULED" ? "A lista é montada na hora do envio." : "Ninguém entrou nesta campanha."}</p>
                ) : (
                  <>
                    <ul className="mt-2 divide-y divide-[#f2f0f7]">
                      {recipients.data.items.map((rec) => (
                        <li key={rec.id} className="flex items-start justify-between gap-3 py-2.5">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{rec.name}</span>
                            <span className="block truncate text-[13px] text-[#6b6878]">{rec.error ?? (rec.skipReason ? (SKIP_REASON[rec.skipReason] ?? rec.skipReason) : rec.address)}</span>
                          </span>
                          <Pill tone={RECIPIENT_STATUS[rec.status].tone}>{rec.openedAt && rec.status === "DELIVERED" ? "Abriu" : RECIPIENT_STATUS[rec.status].label}</Pill>
                        </li>
                      ))}
                    </ul>
                    {pages > 1 ? (
                      <div className="mt-3 flex items-center justify-between gap-3 text-[13.5px]">
                        <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className={cn(LINK, "disabled:opacity-40", PRESSABLE)}>
                          Anteriores
                        </button>
                        <span className="font-poppins tabular-nums text-[#6b6878]">
                          {page} de {pages}
                        </span>
                        <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} className={cn(LINK, "disabled:opacity-40", PRESSABLE)}>
                          Próximos
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, hint, loss = false }: { label: string; value: string; hint?: string; loss?: boolean }) {
  return (
    <div className="bg-white px-4 py-3.5">
      <dt className="text-[12.5px] text-[#6b6878]">{label}</dt>
      <dd className={cn("mt-1 font-poppins text-[20px] font-bold tabular-nums", loss && "text-[#9b1c35]")}>{value}</dd>
      {hint ? <dd className="text-[12.5px] text-[#6b6878]">{hint}</dd> : null}
    </div>
  );
}
