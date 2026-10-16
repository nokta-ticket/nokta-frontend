"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { crmApi, crmKeys, type CrmChannel } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys, formatMicros, type CrmChannelsOverview, type CrmDnsRecord } from "@/services/crm-marketing";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyField } from "@/components/ui/copy-field";
import { ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { fmtDate, fmtTime } from "../../financeiro/_components/finance-ui";
import { ChannelIcon, Note, ReadOnlyNote, formatPhone, num } from "./crm-ui";
import { ACCOUNT_STATUS, Blockers } from "./marketing-ui";

const RECORD_PURPOSE: Record<CrmDnsRecord["purpose"], string> = {
  DKIM: "Assinatura dos e-mails (DKIM)",
  MAIL_FROM: "Retorno das mensagens",
  SPF: "Autorização de envio (SPF)",
  DMARC: "Política do domínio (DMARC)",
};

/** Canais de envio do produtor: remetente de e-mail e conta do WhatsApp Business. */
export function ChannelsTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const queryClient = useQueryClient();
  const overview = useQuery({ queryKey: crmMarketingKeys.channels(orgId), queryFn: () => crmMarketingApi.channels(orgId) });
  const credits = useQuery({ queryKey: crmMarketingKeys.credits(orgId), queryFn: () => crmMarketingApi.credits(orgId) });
  const lists = useQuery({ queryKey: crmKeys.overview(orgId), queryFn: () => crmApi.overview(orgId) });

  const apply = (data: CrmChannelsOverview) => {
    queryClient.setQueryData(crmMarketingKeys.channels(orgId), data);
    void queryClient.invalidateQueries({ queryKey: crmKeys.all(orgId) });
  };

  if (overview.isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[420px] rounded-card" />
        <Skeleton className="h-[420px] rounded-card" />
      </div>
    );
  }
  if (!overview.data) return <ErrorState title="Não foi possível carregar os canais" onRetry={() => void overview.refetch()} />;

  return (
    <div className="space-y-4">
      {!canManage ? <ReadOnlyNote>Você pode consultar os canais. Só o proprietário do workspace configura o remetente de e-mail e conecta o WhatsApp.</ReadOnlyNote> : null}
      {/* Sem permissão, os botões de alterar somem (o backend recusa de qualquer forma). */}
      <div className={cn("grid items-start gap-4 xl:grid-cols-2", !canManage && "[&_[data-manage]]:hidden")}>
        <EmailChannel orgId={orgId} data={overview.data.email} credits={credits.data?.email} onChange={apply} />
        <WhatsappChannel orgId={orgId} data={overview.data.whatsapp} rates={credits.data?.whatsapp} onChange={apply} />
        <PushChannel data={overview.data.push} reachable={lists.data?.pushEligible} total={lists.data?.total} />
      </div>
    </div>
  );
}

function ChannelCard({ channel, title, status, children }: { channel: CrmChannel; title: string; status: ReactNode; children: ReactNode }) {
  return (
    <Card className="fade-up">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2.5">
          <ChannelIcon channel={channel} size={16} className="text-brand" />
          {title}
        </CardTitle>
        {status}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function checkedAt(iso: string | null) {
  return iso ? `Conferido em ${fmtDate(iso)} às ${fmtTime(iso)}` : "Ainda não conferido";
}

// ── Notificações no app ──

/** Push não tem conta para conectar: sai pelo app da Nokta Tickets, com o nome do produtor no título. */
function PushChannel({ data, reachable, total }: { data?: CrmChannelsOverview["push"]; reachable?: number; total?: number }) {
  if (!data) return null;
  const status = !data.available ? <StatusBadge tone="neutral">Em breve</StatusBadge> : <StatusBadge tone="success">Pronto para usar</StatusBadge>;
  return (
    <ChannelCard channel="PUSH" title="Notificações no app" status={status}>
      <Note>
        Chega no celular de quem tem o app da Nokta Tickets (ou o site) com as notificações ativas. A notificação aparece com o nome da sua organização no título e abre a página do evento ao tocar.
      </Note>
      {data.available ? (
        <dl className="divide-y divide-border">
          <Detail label="Podem receber agora" value={reachable === undefined ? "…" : `${num(reachable)}${total !== undefined ? ` de ${num(total)}` : ""}`} />
          <Detail label="Custo" value="Incluído no plano" />
          <Detail label="Limite por pessoa" value="1 por dia · 3 por semana" />
        </dl>
      ) : (
        <Blockers title="Ainda não disponível" items={data.pending} />
      )}
      <Note>O limite soma as notificações de todos os produtores: quem recebe demais desliga o app inteiro, e aí perde também os avisos do ingresso. Cada notificação tem o botão &quot;Parar de receber&quot;, que vale só para a sua organização.</Note>
    </ChannelCard>
  );
}

// ── E-mail ──

function EmailChannel({ orgId, data, credits, onChange }: { orgId: number; data: CrmChannelsOverview["email"]; credits?: { freeMonthly: number; freeRemaining: number; paidBalance: number; creditPriceMicros: number | null }; onChange: (d: CrmChannelsOverview) => void }) {
  const sender = data.sender;
  const [editing, setEditing] = useState(!sender);
  const [showRecords, setShowRecords] = useState(sender?.status !== "CONNECTED");
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState({ fromName: sender?.fromName ?? "", localPart: sender?.localPart ?? "", domain: sender?.domain ?? "", replyTo: sender?.replyTo ?? "" });
  useEffect(() => {
    setEditing(!sender);
    setForm({ fromName: sender?.fromName ?? "", localPart: sender?.localPart ?? "", domain: sender?.domain ?? "", replyTo: sender?.replyTo ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sender?.address]);

  const onError = (error: unknown) => toast.error(getErrorMessage(error, "Não foi possível concluir."));
  const save = useMutation({
    mutationFn: () => crmMarketingApi.saveEmailSender(orgId, { fromName: form.fromName.trim(), localPart: form.localPart.trim(), domain: form.domain.trim(), replyTo: form.replyTo.trim() || undefined }),
    onSuccess: (d) => {
      onChange(d);
      setEditing(false);
      toast.success("Remetente salvo. Agora crie os registros de DNS abaixo.");
    },
    onError,
  });
  const verify = useMutation({
    mutationFn: () => crmMarketingApi.verifyEmailSender(orgId),
    onSuccess: (d) => {
      onChange(d);
      if (d.email.sender?.status === "CONNECTED") toast.success("Domínio verificado. O remetente está pronto.");
      else toast.info("O DNS ainda não foi reconhecido. Pode levar algumas horas depois de criar os registros.");
    },
    onError,
  });
  const remove = useMutation({ mutationFn: () => crmMarketingApi.removeEmailSender(orgId), onSuccess: (d) => (onChange(d), toast.success("Remetente removido")), onError });

  const status = !data.available ? <StatusBadge tone="neutral">Em breve</StatusBadge> : sender ? <StatusBadge tone={ACCOUNT_STATUS[sender.status].tone}>{sender.status === "CONNECTED" ? "Verificado" : sender.status === "PENDING" ? "Aguardando DNS" : ACCOUNT_STATUS[sender.status].label}</StatusBadge> : <StatusBadge tone="neutral">Não configurado</StatusBadge>;

  return (
    <ChannelCard channel="EMAIL" title="E-mail" status={status}>
      {!data.available ? (
        <Callout tone="neutral">
          O envio de e-mail pelo seu domínio ainda está sendo habilitado pela Nokta. Quando abrir, você cadastra aqui o endereço remetente (por exemplo, <span className="font-medium text-foreground">parceria@suaempresa.com.br</span>) e verifica o domínio.
        </Callout>
      ) : (
        <>
          {sender && !editing ? (
            <>
              <dl className="divide-y divide-border">
                <Detail label="Remetente" value={`${sender.fromName ?? ""} <${sender.address}>`} />
                <Detail label="Respostas vão para" value={sender.replyTo ?? sender.address} />
                <Detail label="Domínio" value={sender.domain} />
                <Detail label="Situação no provedor" value={sender.status === "CONNECTED" ? "Domínio verificado" : "Aguardando os registros de DNS"} />
              </dl>
              <div data-manage className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" leftIcon="edit" onClick={() => setEditing(true)}>
                  Alterar remetente
                </Button>
                <Button variant="destructive-soft" size="sm" onClick={() => setRemoving(true)}>
                  Remover
                </Button>
              </div>
            </>
          ) : (
            <form
              data-manage
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <Field label="Nome que aparece pra quem recebe" htmlFor="email-from">
                <Input id="email-from" value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} maxLength={60} placeholder="Ex.: Fervo Produções" />
              </Field>
              <Field label="Endereço remetente" hint="Use um domínio da sua empresa. Um subdomínio só pra divulgação (como news.suaempresa.com.br) protege a reputação do seu e-mail do dia a dia.">
                <div className="flex items-center gap-2">
                  <Input aria-label="Antes do @" value={form.localPart} onChange={(e) => setForm({ ...form, localPart: e.target.value })} maxLength={64} placeholder="parceria" className="min-w-0 flex-1" />
                  <span className="text-sm text-muted-foreground">@</span>
                  <Input aria-label="Domínio" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} maxLength={253} placeholder="suaempresa.com.br" className="min-w-0 flex-[1.4]" />
                </div>
              </Field>
              <Field label="E-mail que recebe as respostas" htmlFor="email-reply" optional hint="Se ficar vazio, as respostas vão pro próprio remetente.">
                <Input id="email-reply" type="email" value={form.replyTo} onChange={(e) => setForm({ ...form, replyTo: e.target.value })} maxLength={254} placeholder="contato@suaempresa.com.br" />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" leftIcon="save" loading={save.isPending} disabled={!form.fromName.trim() || !form.localPart.trim() || !form.domain.trim()}>
                  Salvar remetente
                </Button>
                {sender ? (
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          )}

          {sender && sender.records.length > 0 ? (
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Registros de DNS</h3>
                  <Note className="mt-0.5 max-w-[62ch]">
                    {sender.status === "CONNECTED" ? (
                      "O domínio está verificado. Mantenha estes registros: sem eles o envio para."
                    ) : (
                      <>
                        Crie estes registros onde o domínio <span className="font-medium text-foreground">{sender.domain}</span> é gerenciado. Não apague os que já existem.
                      </>
                    )}
                  </Note>
                </div>
                <Button data-manage variant="outline" size="sm" leftIcon="refresh" loading={verify.isPending} onClick={() => verify.mutate()}>
                  Verificar agora
                </Button>
              </div>
              {showRecords ? (
                <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                  {sender.records.map((r) => (
                    <li key={`${r.type}-${r.name}`} className="space-y-1.5 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-foreground">
                          {RECORD_PURPOSE[r.purpose]} <span className="text-caption text-muted-foreground">· {r.type}</span>
                        </span>
                        <StatusBadge tone={r.required ? "brand" : "neutral"} dot={false}>
                          {r.required ? "Obrigatório" : "Recomendado"}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-10 shrink-0 text-caption text-muted-foreground">Nome</span>
                        <CopyField value={r.name} mono size="sm" className="min-w-0 flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-10 shrink-0 text-caption text-muted-foreground">Valor</span>
                        <CopyField value={r.value} mono size="sm" className="min-w-0 flex-1" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Button variant="link" size="sm" className="mt-2" onClick={() => setShowRecords(true)}>
                  Ver os {sender.records.length} registros
                </Button>
              )}
              <Note className="mt-2">{checkedAt(sender.lastCheckedAt)}</Note>
              {sender.lastError ? <p className="mt-1 text-caption text-danger">A verificação falhou: {sender.lastError}</p> : null}
            </div>
          ) : null}

          {sender && sender.status !== "CONNECTED" ? <Blockers items={data.pending} title="Falta pra enviar e-mail" /> : null}
        </>
      )}

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">Créditos de e-mail</h3>
        {credits ? (
          <dl className="mt-1 divide-y divide-border">
            <Detail label="Franquia deste mês" value={credits.freeMonthly ? `${num(credits.freeRemaining)} de ${num(credits.freeMonthly)} e-mails` : "Sem franquia"} />
            <Detail label="Seus créditos" value={`${num(credits.paidBalance)} e-mails`} />
            <Detail label="Preço do crédito" value={credits.creditPriceMicros === null ? "Ainda não definido" : `${formatMicros(credits.creditPriceMicros)} por e-mail`} />
          </dl>
        ) : (
          <Skeleton className="mt-2 h-24 rounded-xl" />
        )}
        <Note className="mt-2">Cada e-mail enviado usa 1 crédito, primeiro da franquia do mês. E-mail que falha antes de sair devolve o crédito.</Note>
      </div>

      <ConfirmDialog open={removing} onOpenChange={setRemoving} danger icon="mail" title="Remover o remetente?" description="Campanhas por e-mail param até você configurar outro remetente e verificar o domínio de novo." confirmLabel="Remover" onConfirm={() => remove.mutateAsync()} />
    </ChannelCard>
  );
}

// ── WhatsApp ──

const QUALITY: Record<string, string> = { GREEN: "Alta", YELLOW: "Média", RED: "Baixa", UNKNOWN: "Ainda sem avaliação" };

/** "TIER_1K" → "1.000 conversas por dia". O limite é da conta do produtor e vem da Meta. */
function limitLabel(tier: string | null): string {
  if (!tier) return "Não informado pela Meta";
  if (/UNLIMITED/i.test(tier)) return "Sem limite";
  const m = /(\d+)(K|M)?/i.exec(tier);
  if (!m) return tier;
  const n = Number(m[1]) * (m[2]?.toUpperCase() === "M" ? 1_000_000 : m[2] ? 1_000 : 1);
  return `${num(n)} pessoas a cada 24 horas`;
}

interface EmbeddedSignupResult {
  code: string;
  wabaId: string;
  phoneNumberId: string;
}

/**
 * Abre o Embedded Signup oficial da Meta. O SDK devolve o código de
 * autorização; os ids da conta e do número chegam por mensagem da janela
 * do próprio fluxo (formato WA_EMBEDDED_SIGNUP da Meta).
 */
function runEmbeddedSignup(signup: { appId: string; configId: string; graphVersion: string }): Promise<EmbeddedSignupResult> {
  type FB = { init: (o: object) => void; login: (cb: (r: { authResponse?: { code?: string } }) => void, o: object) => void };
  const w = window as unknown as { FB?: FB; fbAsyncInit?: () => void };
  const loadSdk = () =>
    new Promise<FB>((resolve, reject) => {
      if (w.FB) return resolve(w.FB);
      w.fbAsyncInit = () => {
        w.FB!.init({ appId: signup.appId, autoLogAppEvents: true, xfbml: false, version: signup.graphVersion });
        resolve(w.FB!);
      };
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/pt_BR/sdk.js";
      script.async = true;
      script.onerror = () => reject(new Error("Não foi possível abrir a conexão da Meta."));
      document.body.appendChild(script);
    });

  return loadSdk().then(
    (FB) =>
      new Promise<EmbeddedSignupResult>((resolve, reject) => {
        let ids: { wabaId: string; phoneNumberId: string } | null = null;
        const onMessage = (event: MessageEvent) => {
          if (!/^https:\/\/(www\.|web\.)?facebook\.com$/.test(event.origin)) return;
          try {
            const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
            if (data?.type === "WA_EMBEDDED_SIGNUP" && data.event === "FINISH" && data.data?.waba_id && data.data?.phone_number_id) {
              ids = { wabaId: String(data.data.waba_id), phoneNumberId: String(data.data.phone_number_id) };
            }
          } catch {
            /* mensagem de outra origem do próprio Facebook */
          }
        };
        window.addEventListener("message", onMessage);
        FB.login(
          (response) => {
            window.removeEventListener("message", onMessage);
            const code = response.authResponse?.code;
            if (!code || !ids) return reject(new Error("A conexão não foi concluída na Meta."));
            resolve({ code, ...ids });
          },
          { config_id: signup.configId, response_type: "code", override_default_response_type: true, extras: { setup: {}, featureType: "", sessionInfoVersion: "3" } },
        );
      }),
  );
}

function WhatsappChannel({ orgId, data, rates, onChange }: { orgId: number; data: CrmChannelsOverview["whatsapp"]; rates?: { marketingRateMicros: number | null; utilityRateMicros: number | null; ratesCheckedAt: string | null }; onChange: (d: CrmChannelsOverview) => void }) {
  const account = data.account;
  const [disconnecting, setDisconnecting] = useState(false);
  const onError = (error: unknown) => toast.error(getErrorMessage(error, "Não foi possível concluir."));
  const connect = useMutation({
    mutationFn: async () => crmMarketingApi.connectWhatsapp(orgId, await runEmbeddedSignup(data.signup!)),
    onSuccess: (d) => (onChange(d), toast.success("WhatsApp Business conectado")),
    onError,
  });
  const sync = useMutation({ mutationFn: () => crmMarketingApi.syncWhatsapp(orgId), onSuccess: (d) => (onChange(d), toast.success("Dados atualizados com a Meta")), onError });
  const disconnect = useMutation({ mutationFn: () => crmMarketingApi.disconnectWhatsapp(orgId), onSuccess: (d) => (onChange(d), toast.success("WhatsApp desconectado")), onError });

  const status = !data.available ? <StatusBadge tone="neutral">Em breve</StatusBadge> : account ? <StatusBadge tone={ACCOUNT_STATUS[account.status].tone}>{ACCOUNT_STATUS[account.status].label}</StatusBadge> : <StatusBadge tone="neutral">Não conectado</StatusBadge>;

  return (
    <ChannelCard channel="WHATSAPP" title="WhatsApp Business" status={status}>
      {!data.available ? (
        <Callout tone="neutral">A conexão oficial com a Meta ainda está sendo habilitada pela Nokta. Quando abrir, você conecta aqui o número do WhatsApp Business da sua empresa, direto pela tela da Meta.</Callout>
      ) : account ? (
        <>
          <dl className="divide-y divide-border">
            <Detail label="Número" value={formatPhone(account.phoneNumber) || account.phoneNumber} />
            <Detail label="Nome verificado" value={account.verifiedName ?? "Ainda não verificado"} />
            <Detail label="Conta" value={account.businessName ?? "Não informado"} />
            <Detail label="Qualidade do número" value={QUALITY[account.qualityRating ?? "UNKNOWN"] ?? account.qualityRating} />
            <Detail label="Limite de envio" value={limitLabel(account.messagingLimitTier)} />
            <Detail label="Forma de pagamento na Meta" value={account.hasFunding ? "Cadastrada" : <span className="text-danger">Não cadastrada</span>} />
          </dl>
          <Note>Todos estes dados foram lidos da sua conta na Meta. {checkedAt(account.lastCheckedAt)}; a Nokta relê sozinha algumas vezes por dia. Qualidade e limite são definidos pela Meta e mudam com o tempo.</Note>
          {account.lastError ? <p className="text-caption text-danger">A última consulta à Meta falhou: {account.lastError}</p> : null}
          <div data-manage className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" leftIcon="refresh" loading={sync.isPending} onClick={() => sync.mutate()}>
              Atualizar com a Meta
            </Button>
            <Button variant="destructive-soft" size="sm" onClick={() => setDisconnecting(true)}>
              Desconectar
            </Button>
          </div>
          <Blockers items={data.pending} title="Falta pra enviar por WhatsApp" />
        </>
      ) : (
        <>
          <p className="max-w-[62ch] text-sm leading-relaxed text-foreground">Conecte o WhatsApp Business da sua empresa pela tela oficial da Meta. Você escolhe ou cadastra o número lá, e a Nokta recebe só a permissão de enviar os modelos que você aprovar.</p>
          <Button data-manage leftIcon="whatsapp" loading={connect.isPending} disabled={!data.signup} onClick={() => connect.mutate()}>
            Conectar WhatsApp Business
          </Button>
        </>
      )}

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">Quem paga as mensagens</h3>
        <p className="mt-1.5 max-w-[66ch] text-caption leading-relaxed text-foreground">Você. A Meta cobra cada mensagem direto na forma de pagamento da sua conta do WhatsApp Business. A Nokta não cobra, não repassa e não adianta esse valor.</p>
        <dl className="mt-1 divide-y divide-border">
          <Detail label="Divulgação, por mensagem" value={rates?.marketingRateMicros == null ? "Sem estimativa cadastrada" : `cerca de ${formatMicros(rates.marketingRateMicros)}`} />
          <Detail label="Serviço, por mensagem" value={rates?.utilityRateMicros == null ? "Sem estimativa cadastrada" : `cerca de ${formatMicros(rates.utilityRateMicros)}`} />
        </dl>
        <Note className="mt-2">Estimativa pelos valores de tabela da Meta pro Brasil{rates?.ratesCheckedAt ? `, cadastrados pela Nokta em ${fmtDate(rates.ratesCheckedAt)}` : ""}. Não é o valor da sua conta: o que você paga de verdade é o que aparece na sua fatura da Meta.</Note>
      </div>

      <ConfirmDialog open={disconnecting} onOpenChange={setDisconnecting} danger icon="whatsapp" title="Desconectar o WhatsApp Business?" description="Campanhas por WhatsApp param até você conectar de novo. Os modelos aprovados continuam na sua conta da Meta." confirmLabel="Desconectar" onConfirm={() => disconnect.mutateAsync()} />
    </ChannelCard>
  );
}
