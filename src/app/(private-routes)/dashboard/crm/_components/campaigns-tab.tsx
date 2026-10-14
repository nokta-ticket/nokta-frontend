"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { CrmChannel, CrmFilterOptions, CrmSegment } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys, formatMicros, type CrmCampaign } from "@/services/crm-marketing";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChoiceCard } from "@/components/ui/choice-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { fmtDate, fmtTime } from "../../financeiro/_components/finance-ui";
import { CHANNEL_LABEL, ChannelIcon, Note, describeFilters, num, type CrmTabKey } from "./crm-ui";
import { Blockers, CAMPAIGN_STATUS, EstimateSummary, PreviewBox, RECIPIENT_STATUS, SKIP_REASON } from "./marketing-ui";

const when = (iso: string | null) => (iso ? `${fmtDate(iso)} às ${fmtTime(iso)}` : "");
const pct = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : "—");
const RUNNING = ["SCHEDULED", "VALIDATING", "QUEUED", "SENDING"];

/** Campanhas: lista com resultados, criação com estimativa de custo e acompanhamento. */
export function CampaignsTab({ orgId, segments, options, onGoTo, canManage }: { orgId: number; segments: CrmSegment[]; options?: CrmFilterOptions; onGoTo: (tab: CrmTabKey) => void; canManage: boolean }) {
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
  const started = (c: CrmCampaign) => !["DRAFT", "SCHEDULED", "CANCELLED"].includes(c.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[80ch] text-sm leading-relaxed text-muted-foreground">Cada campanha mostra o custo antes de você confirmar e só vai pra quem pode receber naquele canal.</p>
        {canManage ? (
          <Button leftIcon="plus" onClick={() => setComposing("new")} className="shrink-0">
            Nova campanha
          </Button>
        ) : null}
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : rows.length === 0 ? (
        <EmptyState icon="megaphone" title="Nenhuma campanha ainda" description="Escolha um canal, um modelo e um público. Antes de confirmar você vê quantas pessoas recebem e quanto custa." action={canManage ? <Button leftIcon="plus" onClick={() => setComposing("new")}>Nova campanha</Button> : undefined} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Campanha</DataTableHeadCell>
                  <DataTableHeadCell>Público</DataTableHeadCell>
                  <DataTableHeadCell>Situação</DataTableHeadCell>
                  <DataTableHeadCell>Quando</DataTableHeadCell>
                  <DataTableHeadCell align="right">Enviadas</DataTableHeadCell>
                  <DataTableHeadCell>Resultado</DataTableHeadCell>
                  <DataTableHeadCell align="right">Custo</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.map((c, i) => {
                  const sent = c.results.sent;
                  const on = started(c);
                  return (
                    <DataTableRow key={c.id} index={i} onClick={() => open(c)}>
                      <DataTableCell className="max-w-[260px]">
                        <span className="flex items-center gap-2 font-semibold">
                          <ChannelIcon channel={c.channel} size={12} className="shrink-0 text-muted-foreground" />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="block truncate pl-5 text-caption text-muted-foreground">{c.templateName ?? "Sem modelo"}</span>
                      </DataTableCell>
                      <DataTableCell className="max-w-[220px] truncate text-muted-foreground">{audienceOf(c)}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</StatusBadge>
                      </DataTableCell>
                      <DataTableCell className={cn("whitespace-nowrap tnum", !when(c.status === "SCHEDULED" ? c.scheduledAt : (c.startedAt ?? c.scheduledAt)) && "text-subtle-foreground")}>{when(c.status === "SCHEDULED" ? c.scheduledAt : (c.startedAt ?? c.scheduledAt)) || "—"}</DataTableCell>
                      <DataTableCell num className={cn(!on && "text-subtle-foreground")}>
                        {on ? num(sent) : c.estimatedRecipients !== null ? `~${num(c.estimatedRecipients)}` : "—"}
                      </DataTableCell>
                      <DataTableCell className={cn("whitespace-nowrap tnum", !(on && sent) && "text-subtle-foreground")}>
                        {on && sent ? (
                          <>
                            <span className="block">
                              {num(c.results.delivered)} entregues <span className="text-caption text-muted-foreground">{pct(c.results.delivered, sent)}</span>
                            </span>
                            <span className="block text-caption text-muted-foreground">
                              {num(c.results.opened)} abertas · {num(c.results.clicked)} cliques
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </DataTableCell>
                      <DataTableCell num className={cn("whitespace-nowrap font-semibold", !costLabel(c) && "font-normal text-subtle-foreground")}>
                        {costLabel(c) ?? "—"}
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {rows.map((c, i) => (
                <MobileCard key={c.id} index={i} onClick={() => open(c)} title={c.name} subtitle={`${CHANNEL_LABEL[c.channel]} · ${c.results.sent ? `${num(c.results.sent)} enviadas · ${num(c.results.delivered)} entregues` : audienceOf(c)}`} badge={<StatusBadge tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</StatusBadge>} meta={[{ label: "Quando", value: when(c.status === "SCHEDULED" ? c.scheduledAt : (c.startedAt ?? c.scheduledAt)) || "—", num: true }, { label: "Custo", value: costLabel(c) ?? "—", num: true }]} />
              ))}
            </MobileCardList>
          }
        />
      )}

      <CampaignSheet orgId={orgId} campaignId={openId} audienceOf={audienceOf} costLabel={costLabel} canManage={canManage} onClose={() => setOpenId(null)} onChanged={refresh} />
    </div>
  );
}

// ── criação ──

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-caption font-semibold text-brand tnum">{n}</span>
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

function Composer({ orgId, draft, segments, options, onGoTo, onClose }: { orgId: number; draft: CrmCampaign | null; segments: CrmSegment[]; options?: CrmFilterOptions; onGoTo: (tab: CrmTabKey) => void; onClose: () => void }) {
  const [id, setId] = useState<number | null>(draft?.id ?? null);
  const [name, setName] = useState(draft?.name ?? "");
  const [channel, setChannel] = useState<CrmChannel>(draft?.channel ?? "EMAIL");
  const [templateId, setTemplateId] = useState<number | null>(draft?.templateId ?? null);
  const [segmentId, setSegmentId] = useState<number | null>(draft?.segmentId ?? null);
  const [mode, setMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState(() => localInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [confirming, setConfirming] = useState(false);
  const [discarding, setDiscarding] = useState(false);

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
  const save = useMutation({ mutationFn: saveDraft, onSuccess: () => toast.success("Rascunho salvo"), onError });
  const confirm = useMutation({
    mutationFn: async () => crmMarketingApi.scheduleCampaign(orgId, (await saveDraft()).id, mode === "later" ? new Date(scheduledAt).toISOString() : undefined),
    onSuccess: () => {
      toast.success(mode === "later" ? "Campanha agendada" : "Campanha confirmada. O envio começa em instantes.");
      onClose();
    },
    onError,
  });
  const discard = useMutation({ mutationFn: () => crmMarketingApi.removeCampaign(orgId, id as number), onSuccess: () => (toast.success("Rascunho apagado"), onClose()), onError });

  const blockers = estimate.data?.blockers ?? [];
  const validName = name.trim().length >= 2;
  const segment = segments.find((s) => s.id === segmentId);
  const willReceive = estimate.data?.audience.willReceive ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        back={onClose}
        title={draft ? "Campanha em rascunho" : "Nova campanha"}
        actions={
          <>
            {id ? (
              <Button variant="destructive-soft" onClick={() => setDiscarding(true)}>
                Apagar rascunho
              </Button>
            ) : null}
            <Button variant="outline" leftIcon="save" disabled={!validName} loading={save.isPending} onClick={() => save.mutate()}>
              Salvar rascunho
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-5">
            <Step n={1} title="Nome e canal">
              <div className="space-y-3">
                <Field label="Nome da campanha" htmlFor="camp-nome" hint="Só você vê.">
                  <Input id="camp-nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} placeholder="Ex.: Último lote — Baile Neon" />
                </Field>
                <div role="radiogroup" aria-label="Canal" className="grid grid-cols-2 gap-2">
                  {(["EMAIL", "WHATSAPP"] as CrmChannel[]).map((c) => (
                    <ChoiceCard
                      key={c}
                      selected={channel === c}
                      icon={c === "EMAIL" ? "mail" : "whatsapp"}
                      title={CHANNEL_LABEL[c]}
                      onSelect={() => {
                        setChannel(c);
                        setTemplateId(null);
                        setConfirming(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            </Step>

            <Step n={2} title="O que enviar">
              {templates.isLoading ? (
                <Skeleton className="h-11 rounded-input" />
              ) : usable.length === 0 ? (
                <Callout tone="neutral" action={<Button variant="outline" size="sm" onClick={() => onGoTo("templates")}>Criar modelo</Button>}>
                  {channel === "EMAIL" ? "Você ainda não tem um modelo de e-mail pronto." : "Você ainda não tem um modelo de WhatsApp aprovado pela Meta."}
                </Callout>
              ) : (
                <NativeSelect
                  aria-label="Modelo"
                  value={templateId ?? ""}
                  onChange={(e) => {
                    setTemplateId(e.target.value ? Number(e.target.value) : null);
                    setConfirming(false);
                  }}
                >
                  <option value="">Escolha um modelo</option>
                  {usable.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Step>

            <Step n={3} title="Para quem">
              <NativeSelect
                aria-label="Público"
                value={segmentId ?? ""}
                onChange={(e) => {
                  setSegmentId(e.target.value ? Number(e.target.value) : null);
                  setConfirming(false);
                }}
              >
                <option value="">Toda a lista</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({num(s.counts.total)})
                  </option>
                ))}
              </NativeSelect>
              <Note className="mt-2">
                {segment ? describeFilters(segment.filters, options).join(" · ") : "Todos os seus contatos."} Só recebe quem pode receber por {channel === "EMAIL" ? "e-mail" : "WhatsApp"}.{" "}
                <Button variant="link" size="sm" className="h-auto text-caption" onClick={() => onGoTo("audiences")}>
                  Ver públicos
                </Button>
              </Note>
            </Step>

            <Step n={4} title="Quando">
              <div role="radiogroup" aria-label="Quando enviar" className="grid gap-2 sm:grid-cols-2">
                <ChoiceCard selected={mode === "now"} icon="bolt" title="Assim que eu confirmar" onSelect={() => (setMode("now"), setConfirming(false))} />
                <ChoiceCard selected={mode === "later"} icon="calendar" title="Agendar" onSelect={() => (setMode("later"), setConfirming(false))} />
              </div>
              {mode === "later" ? <Input type="datetime-local" aria-label="Data e hora do envio" value={scheduledAt} min={localInput(new Date())} onChange={(e) => setScheduledAt(e.target.value)} className="mt-2 tnum sm:max-w-xs" /> : null}
              <Note className="mt-2">A lista de quem recebe é conferida de novo na hora do envio: quem sair até lá não recebe.</Note>
            </Step>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-24">
          <CardHeader>
            <CardTitle>Antes de confirmar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {estimate.data ? (
              <div className="rounded-xl border border-border px-4">
                <EstimateSummary estimate={estimate.data} channel={channel} />
              </div>
            ) : (
              <Skeleton className="h-40 rounded-xl" />
            )}
            <Blockers items={blockers} />
            {template ? preview.data ? <PreviewBox preview={preview.data} /> : <Skeleton className="h-64 rounded-xl" /> : null}
          </CardContent>
          <CardFooter className="flex-wrap justify-end">
            {confirming ? (
              <>
                <span className="mr-auto text-caption text-muted-foreground">
                  {mode === "later" ? `Agendar para ${when(new Date(scheduledAt).toISOString())}` : "Enviar agora"} para {num(willReceive)} {willReceive === 1 ? "pessoa" : "pessoas"}?
                </span>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Voltar
                </Button>
                <Button leftIcon="send" loading={confirm.isPending} onClick={() => confirm.mutate()}>
                  Confirmar
                </Button>
              </>
            ) : (
              <Button leftIcon={mode === "later" ? "calendar" : "send"} disabled={!validName || !estimate.data || blockers.length > 0} onClick={() => setConfirming(true)}>
                {mode === "later" ? "Agendar campanha" : "Enviar campanha"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <ConfirmDialog open={discarding} onOpenChange={setDiscarding} danger icon="trash" title="Apagar este rascunho?" description="A campanha some da lista. Nada foi enviado." confirmLabel="Apagar" onConfirm={() => discard.mutateAsync()} />
    </div>
  );
}

// ── acompanhamento ──

function CampaignSheet({ orgId, campaignId, audienceOf, costLabel, canManage, onClose, onChanged }: { orgId: number; campaignId: number | null; audienceOf: (c: CrmCampaign) => string; costLabel: (c: CrmCampaign) => string | null; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState(false);
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
      <SheetContent side="right" className="sm:max-w-xl">
        {!c || !r ? (
          <>
            <SheetHeader>
              <SheetTitle>Carregando</SheetTitle>
              <SheetDescription className="sr-only">Detalhe da campanha</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </SheetBody>
          </>
        ) : (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="flex items-center gap-2">
                <ChannelIcon channel={c.channel} size={16} className="text-muted-foreground" />
                {c.name}
              </SheetTitle>
              <SheetDescription>
                {c.templateName ?? "Sem modelo"} · {audienceOf(c)}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <StatusBadge tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</StatusBadge>
                <span className="text-caption text-muted-foreground">{c.status === "SCHEDULED" ? `Envio em ${when(c.scheduledAt)}` : c.finishedAt ? `Terminou em ${when(c.finishedAt)}` : c.startedAt ? `Começou em ${when(c.startedAt)}` : ""}</span>
              </div>
            </SheetHeader>

            <SheetBody className="text-sm">
              {c.lastError ? <Blockers items={[c.lastError]} title="A campanha não foi enviada" /> : null}

              {c.status === "SCHEDULED" && canManage ? (
                <Callout tone="info" icon="clock" action={<Button variant="outline" size="sm" onClick={() => setCancelling(true)}>Cancelar envio</Button>}>
                  Ainda dá pra cancelar. Depois que o envio começa, o que saiu não volta.
                </Callout>
              ) : null}

              <DetailGrid columns={2} className="sm:grid-cols-2 lg:grid-cols-2">
                <DetailItem label="Aceitas pelo provedor" value={`${num(r.sent)}${c.estimatedRecipients !== null ? ` de ~${num(c.estimatedRecipients)}` : ""}`} />
                <DetailItem label="Entregues" value={r.sent ? `${num(r.delivered)} · ${pct(r.delivered, r.sent)}` : num(r.delivered)} />
                <DetailItem label="Abertas" value={r.sent ? `${num(r.opened)} · ${pct(r.opened, r.sent)}` : num(r.opened)} />
                <DetailItem label="Clicaram" value={r.sent ? `${num(r.clicked)} · ${pct(r.clicked, r.sent)}` : num(r.clicked)} />
                <DetailItem label="Falharam">
                  <span className={cn(r.failed > 0 && "text-danger")}>{num(r.failed)}</span>
                </DetailItem>
                <DetailItem label="Saíram da lista">
                  <span className={cn(r.unsubscribed > 0 && "text-danger")}>{num(r.unsubscribed)}</span>
                </DetailItem>
              </DetailGrid>
              <Note>
                “Aceita” quer dizer que o provedor recebeu a mensagem; “entregue”, que ela chegou à caixa da pessoa.
                {r.skipped > 0 ? ` ${num(r.skipped)} não ${r.skipped === 1 ? "foi enviada" : "foram enviadas"} de propósito (a pessoa saiu da lista antes do envio ou faltou crédito).` : ""}
              </Note>

              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                <span className="text-muted-foreground">Custo estimado na confirmação</span>
                <span className="text-base font-semibold text-foreground tnum">{costLabel(c) ?? "Sem estimativa"}</span>
              </div>

              <section className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">Destinatários</h3>
                {!recipients.data ? (
                  <Skeleton className="mt-3 h-40 rounded-xl" />
                ) : recipients.data.items.length === 0 ? (
                  <Note className="mt-2">{c.status === "SCHEDULED" ? "A lista é montada na hora do envio." : "Ninguém entrou nesta campanha."}</Note>
                ) : (
                  <>
                    <ul className="mt-1 divide-y divide-border">
                      {recipients.data.items.map((rec) => (
                        <li key={rec.id} className="flex items-start justify-between gap-3 py-2.5">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">{rec.name}</span>
                            <span className="block truncate text-caption text-muted-foreground">{rec.error ?? (rec.skipReason ? (SKIP_REASON[rec.skipReason] ?? rec.skipReason) : rec.address)}</span>
                          </span>
                          <StatusBadge tone={RECIPIENT_STATUS[rec.status].tone}>{rec.openedAt && rec.status === "DELIVERED" ? "Abriu" : RECIPIENT_STATUS[rec.status].label}</StatusBadge>
                        </li>
                      ))}
                    </ul>
                    {pages > 1 ? (
                      <div className="mt-3 flex items-center justify-between gap-3 text-caption">
                        <Button variant="link" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                          Anteriores
                        </Button>
                        <span className="text-muted-foreground tnum">
                          {page} de {pages}
                        </span>
                        <Button variant="link" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>
                          Próximos
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </section>
            </SheetBody>
          </>
        )}
      </SheetContent>

      <ConfirmDialog open={cancelling} onOpenChange={setCancelling} danger icon="ban" title="Cancelar o envio desta campanha?" description="Nada é enviado. A campanha fica marcada como cancelada." confirmLabel="Cancelar envio" cancelLabel="Voltar" onConfirm={() => cancel.mutateAsync()} />
    </Sheet>
  );
}
