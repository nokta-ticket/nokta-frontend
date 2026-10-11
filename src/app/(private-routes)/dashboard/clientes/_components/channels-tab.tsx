"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { crmKeys, type CrmChannel } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys, formatMicros, type CrmChannelsOverview, type CrmDnsRecord } from "@/services/crm-marketing";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { Pill, PRESSABLE, SURFACE, fmtDate, fmtTime } from "../../financeiro/_components/finance-ui";
import { BTN_PRIMARY, BTN_SECONDARY, ChannelIcon, FIELD, LINK, ReadOnlyNote, formatPhone, num } from "./crm-ui";
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

  const apply = (data: CrmChannelsOverview) => {
    queryClient.setQueryData(crmMarketingKeys.channels(orgId), data);
    void queryClient.invalidateQueries({ queryKey: crmKeys.all(orgId) });
  };

  if (overview.isLoading) {
    return (
      <div className="grid gap-4 2xl:grid-cols-2">
        <BlockSkeleton className="h-[420px] rounded-[20px]" />
        <BlockSkeleton className="h-[420px] rounded-[20px]" />
      </div>
    );
  }
  if (!overview.data) {
    return (
      <div className={cn(SURFACE, "px-6 py-14 text-center")}>
        <p className="text-[14px] text-[#5f5c6b]">Não foi possível carregar os canais.</p>
        <button type="button" onClick={() => void overview.refetch()} className={cn(LINK, "mt-2", PRESSABLE)}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!canManage ? <ReadOnlyNote>Você pode consultar os canais. Só o proprietário do workspace configura o remetente de e-mail e conecta o WhatsApp.</ReadOnlyNote> : null}
      {/* Sem permissão, os botões de alterar somem (o backend recusa de qualquer forma). */}
      <div className={cn("grid items-start gap-4 2xl:grid-cols-2", !canManage && "[&_[data-manage]]:hidden")}>
        <EmailChannel orgId={orgId} data={overview.data.email} credits={credits.data?.email} onChange={apply} />
        <WhatsappChannel orgId={orgId} data={overview.data.whatsapp} rates={credits.data?.whatsapp} onChange={apply} />
      </div>
    </div>
  );
}

function ChannelCard({ channel, title, status, children }: { channel: CrmChannel; title: string; status: ReactNode; children: ReactNode }) {
  return (
    <section className={cn(SURFACE, "overflow-hidden")}>
      <header className="flex items-center justify-between gap-3 border-b border-[#ebe8f2] px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2.5 text-[16px] font-semibold text-[#1c1a24]">
          <span className="text-[#7c3aed]">
            <ChannelIcon channel={channel} size={18} />
          </span>
          {title}
        </h2>
        {status}
      </header>
      <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[13.5px] text-[#5f5c6b]">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[14px] font-medium text-[#1c1a24]">{value}</dd>
    </div>
  );
}

function checkedAt(iso: string | null) {
  return iso ? `Conferido em ${fmtDate(iso)} às ${fmtTime(iso)}` : "Ainda não conferido";
}

// ── E-mail ──

function EmailChannel({ orgId, data, credits, onChange }: { orgId: number; data: CrmChannelsOverview["email"]; credits?: { freeMonthly: number; freeRemaining: number; paidBalance: number; creditPriceMicros: number | null }; onChange: (d: CrmChannelsOverview) => void }) {
  const sender = data.sender;
  const [editing, setEditing] = useState(!sender);
  const [showRecords, setShowRecords] = useState(sender?.status !== "CONNECTED");
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
  const remove = useMutation({ mutationFn: () => crmMarketingApi.removeEmailSender(orgId), onSuccess: (d) => (onChange(d), toast.success("Remetente removido.")), onError });

  const status = !data.available ? <Pill tone="neutral">Em breve</Pill> : sender ? <Pill tone={ACCOUNT_STATUS[sender.status].tone}>{sender.status === "CONNECTED" ? "Verificado" : sender.status === "PENDING" ? "Aguardando DNS" : ACCOUNT_STATUS[sender.status].label}</Pill> : <Pill tone="neutral">Não configurado</Pill>;

  return (
    <ChannelCard channel="EMAIL" title="E-mail" status={status}>
      {!data.available ? (
        <p className="rounded-[14px] bg-[#faf8ff] px-4 py-3.5 text-[14px] leading-relaxed text-[#3a3746]">
          O envio de e-mail pelo seu domínio ainda está sendo habilitado pela Nokta. Quando abrir, você cadastra aqui o endereço remetente (por exemplo, <span className="font-medium">parceria@suaempresa.com.br</span>) e verifica o domínio.
        </p>
      ) : (
        <>
          {sender && !editing ? (
            <>
              <dl className="divide-y divide-[#f2f0f7]">
                <Detail label="Remetente" value={`${sender.fromName ?? ""} <${sender.address}>`} />
                <Detail label="Respostas vão para" value={sender.replyTo ?? sender.address} />
                <Detail label="Domínio" value={sender.domain} />
                <Detail label="Situação no provedor de e-mail" value={sender.status === "CONNECTED" ? "Domínio verificado" : "Aguardando os registros de DNS"} />
              </dl>
              <div data-manage className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditing(true)} className={cn(BTN_SECONDARY, PRESSABLE)}>
                  Alterar remetente
                </button>
                <RemoveButton label="Remover" pending={remove.isPending} onConfirm={() => remove.mutate()} />
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
              <Field label="Nome que aparece para quem recebe">
                <input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} maxLength={60} placeholder="Ex.: Fervo Produções" className={cn(FIELD, "w-full px-3.5")} />
              </Field>
              <Field label="Endereço remetente" hint="Use um domínio da sua empresa. Um subdomínio só para divulgação (como news.suaempresa.com.br) protege a reputação do seu e-mail do dia a dia.">
                <div className="flex items-center gap-2">
                  <input aria-label="Antes do @" value={form.localPart} onChange={(e) => setForm({ ...form, localPart: e.target.value })} maxLength={64} placeholder="parceria" className={cn(FIELD, "w-full min-w-0 flex-1 px-3.5")} />
                  <span className="text-[15px] text-[#6b6878]">@</span>
                  <input aria-label="Domínio" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} maxLength={253} placeholder="suaempresa.com.br" className={cn(FIELD, "w-full min-w-0 flex-[1.4] px-3.5")} />
                </div>
              </Field>
              <Field label="E-mail que recebe as respostas" hint="Opcional. Se ficar vazio, as respostas vão para o próprio remetente.">
                <input type="email" value={form.replyTo} onChange={(e) => setForm({ ...form, replyTo: e.target.value })} maxLength={254} placeholder="contato@suaempresa.com.br" className={cn(FIELD, "w-full px-3.5")} />
              </Field>
              <div className="flex gap-2">
                <button type="submit" disabled={save.isPending || !form.fromName.trim() || !form.localPart.trim() || !form.domain.trim()} className={cn(BTN_PRIMARY, PRESSABLE)}>
                  {save.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                  Salvar remetente
                </button>
                {sender ? (
                  <button type="button" onClick={() => setEditing(false)} className={cn(BTN_SECONDARY, PRESSABLE)}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          )}

          {sender && sender.records.length > 0 ? (
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1c1a24]">Registros de DNS</h3>
                  <p className="mt-0.5 max-w-[62ch] text-[13.5px] leading-relaxed text-[#5f5c6b]">
                    {sender.status === "CONNECTED" ? "O domínio está verificado. Mantenha estes registros: sem eles o envio para." : (
                      <>
                        Crie estes registros onde o domínio <span className="font-medium text-[#1c1a24]">{sender.domain}</span> é gerenciado. Não apague os que já existem.
                      </>
                    )}
                  </p>
                </div>
                <button data-manage type="button" disabled={verify.isPending} onClick={() => verify.mutate()} className={cn(BTN_SECONDARY, PRESSABLE)}>
                  {verify.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} strokeWidth={1.8} aria-hidden="true" />}
                  Verificar agora
                </button>
              </div>
              {showRecords ? (
                <ul className="mt-3 divide-y divide-[#f2f0f7] rounded-[14px] border border-[#ebe8f2]">
                  {sender.records.map((r) => (
                    <DnsRow key={`${r.type}-${r.name}`} record={r} />
                  ))}
                </ul>
              ) : (
                <button type="button" onClick={() => setShowRecords(true)} className={cn(LINK, "mt-3", PRESSABLE)}>
                  Ver os {sender.records.length} registros
                </button>
              )}
              <p className="mt-2 text-[12.5px] text-[#6b6878]">{checkedAt(sender.lastCheckedAt)}</p>
              {sender.lastError ? <p className="mt-1 text-[13px] text-[#9b1c35]">A verificação falhou: {sender.lastError}</p> : null}
            </div>
          ) : null}

          {sender && sender.status !== "CONNECTED" ? <Blockers items={data.pending} title="Falta para enviar e-mail" /> : null}
        </>
      )}

      <div className="border-t border-[#f2f0f7] pt-4">
        <h3 className="text-[15px] font-semibold text-[#1c1a24]">Créditos de e-mail</h3>
        {credits ? (
          <dl className="mt-1 divide-y divide-[#f2f0f7]">
            <Detail label="Franquia deste mês" value={credits.freeMonthly ? `${num(credits.freeRemaining)} de ${num(credits.freeMonthly)} e-mails` : "Sem franquia"} />
            <Detail label="Seus créditos" value={`${num(credits.paidBalance)} e-mails`} />
            <Detail label="Preço do crédito" value={credits.creditPriceMicros === null ? "Ainda não definido" : `${formatMicros(credits.creditPriceMicros)} por e-mail`} />
          </dl>
        ) : (
          <BlockSkeleton className="mt-2 h-24" />
        )}
        <p className="mt-2 text-[13px] leading-relaxed text-[#6b6878]">Cada e-mail enviado usa 1 crédito, primeiro da franquia do mês. E-mail que falha antes de sair devolve o crédito.</p>
      </div>
    </ChannelCard>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-semibold text-[#1c1a24]">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[13px] leading-relaxed text-[#6b6878]">{hint}</span> : null}
    </label>
  );
}

function DnsRow({ record }: { record: CrmDnsRecord }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13.5px] font-medium text-[#1c1a24]">
          {RECORD_PURPOSE[record.purpose]} <span className="font-poppins text-[12.5px] font-medium text-[#6b6878]">· {record.type}</span>
        </span>
        <Pill tone={record.required ? "violet" : "neutral"}>{record.required ? "Obrigatório" : "Recomendado"}</Pill>
      </div>
      <CopyLine label="Nome" value={record.name} />
      <CopyLine label="Valor" value={record.value} />
    </li>
  );
}

function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <span className="w-11 shrink-0 text-[12.5px] text-[#6b6878]">{label}</span>
      <code className="min-w-0 flex-1 truncate rounded-md bg-[#f7f6fa] px-2 py-1 font-mono text-[12.5px] text-[#1c1a24]">{value}</code>
      <button
        type="button"
        aria-label={`Copiar ${label.toLowerCase()}`}
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5b5868] outline-none hover:bg-[#f3f1f8] focus-visible:ring-2 focus-visible:ring-[#7c3aed]", PRESSABLE)}
      >
        {copied ? <Check size={15} strokeWidth={2.2} className="text-emerald-700" aria-hidden="true" /> : <Copy size={15} strokeWidth={1.8} aria-hidden="true" />}
      </button>
    </div>
  );
}

function RemoveButton({ label, pending, onConfirm }: { label: string; pending: boolean; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(BTN_SECONDARY, "text-[#9b1c35]", PRESSABLE)}>
        {label}
      </button>
    );
  }
  return (
    <span className="flex items-center gap-3 rounded-[10px] bg-[#fcf5f6] px-3 text-[13.5px]">
      <span className="text-[#3a3746]">Tem certeza?</span>
      <button type="button" onClick={() => setOpen(false)} className={cn(LINK, "text-[#5f5c6b]", PRESSABLE)}>
        Voltar
      </button>
      <button type="button" disabled={pending} onClick={onConfirm} className={cn(LINK, "flex items-center gap-1 text-[#9b1c35] hover:text-[#7f1529]", PRESSABLE)}>
        {pending ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : null}
        {label}
      </button>
    </span>
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
  const onError = (error: unknown) => toast.error(getErrorMessage(error, "Não foi possível concluir."));
  const connect = useMutation({
    mutationFn: async () => crmMarketingApi.connectWhatsapp(orgId, await runEmbeddedSignup(data.signup!)),
    onSuccess: (d) => (onChange(d), toast.success("WhatsApp Business conectado.")),
    onError,
  });
  const sync = useMutation({ mutationFn: () => crmMarketingApi.syncWhatsapp(orgId), onSuccess: (d) => (onChange(d), toast.success("Dados atualizados com a Meta.")), onError });
  const disconnect = useMutation({ mutationFn: () => crmMarketingApi.disconnectWhatsapp(orgId), onSuccess: (d) => (onChange(d), toast.success("WhatsApp desconectado.")), onError });

  const status = !data.available ? <Pill tone="neutral">Em breve</Pill> : account ? <Pill tone={ACCOUNT_STATUS[account.status].tone}>{ACCOUNT_STATUS[account.status].label}</Pill> : <Pill tone="neutral">Não conectado</Pill>;

  return (
    <ChannelCard channel="WHATSAPP" title="WhatsApp Business" status={status}>
      {!data.available ? (
        <p className="rounded-[14px] bg-[#faf8ff] px-4 py-3.5 text-[14px] leading-relaxed text-[#3a3746]">
          A conexão oficial com a Meta ainda está sendo habilitada pela Nokta. Quando abrir, você conecta aqui o número do WhatsApp Business da sua empresa, direto pela tela da Meta.
        </p>
      ) : account ? (
        <>
          <dl className="divide-y divide-[#f2f0f7]">
            <Detail label="Número" value={formatPhone(account.phoneNumber) || account.phoneNumber} />
            <Detail label="Nome verificado" value={account.verifiedName ?? "Ainda não verificado"} />
            <Detail label="Conta" value={account.businessName ?? "Não informado"} />
            <Detail label="Qualidade do número" value={QUALITY[account.qualityRating ?? "UNKNOWN"] ?? account.qualityRating} />
            <Detail label="Limite de envio" value={limitLabel(account.messagingLimitTier)} />
            <Detail label="Forma de pagamento na Meta" value={account.hasFunding ? "Cadastrada" : <span className="text-[#9b1c35]">Não cadastrada</span>} />
          </dl>
          <p className="text-[12.5px] leading-relaxed text-[#6b6878]">
            Todos estes dados foram lidos da sua conta na Meta. {checkedAt(account.lastCheckedAt)}; a Nokta relê sozinha algumas vezes por dia. Qualidade e limite são definidos pela Meta e mudam com o tempo.
          </p>
          {account.lastError ? <p className="text-[13px] text-[#9b1c35]">A última consulta à Meta falhou: {account.lastError}</p> : null}
          <div data-manage className="flex flex-wrap gap-2">
            <button type="button" disabled={sync.isPending} onClick={() => sync.mutate()} className={cn(BTN_SECONDARY, PRESSABLE)}>
              {sync.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} strokeWidth={1.8} aria-hidden="true" />}
              Atualizar com a Meta
            </button>
            <RemoveButton label="Desconectar" pending={disconnect.isPending} onConfirm={() => disconnect.mutate()} />
          </div>
          <Blockers items={data.pending} title="Falta para enviar por WhatsApp" />
        </>
      ) : (
        <>
          <p className="max-w-[62ch] text-[14px] leading-relaxed text-[#3a3746]">
            Conecte o WhatsApp Business da sua empresa pela tela oficial da Meta. Você escolhe ou cadastra o número lá, e a Nokta recebe só a permissão de enviar os modelos que você aprovar.
          </p>
          <button data-manage type="button" disabled={connect.isPending || !data.signup} onClick={() => connect.mutate()} className={cn(BTN_PRIMARY, PRESSABLE)}>
            {connect.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            Conectar WhatsApp Business
          </button>
        </>
      )}

      <div className="border-t border-[#f2f0f7] pt-4">
        <h3 className="text-[15px] font-semibold text-[#1c1a24]">Quem paga as mensagens</h3>
        <p className="mt-1.5 max-w-[66ch] text-[13.5px] leading-relaxed text-[#3a3746]">
          Você. A Meta cobra cada mensagem direto na forma de pagamento da sua conta do WhatsApp Business. A Nokta não cobra, não repassa e não adianta esse valor.
        </p>
        <dl className="mt-1 divide-y divide-[#f2f0f7]">
          <Detail label="Divulgação, estimativa por mensagem" value={rates?.marketingRateMicros == null ? "Sem estimativa cadastrada" : `cerca de ${formatMicros(rates.marketingRateMicros)}`} />
          <Detail label="Serviço, estimativa por mensagem" value={rates?.utilityRateMicros == null ? "Sem estimativa cadastrada" : `cerca de ${formatMicros(rates.utilityRateMicros)}`} />
        </dl>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6b6878]">
          Estimativa pelos valores de tabela da Meta para o Brasil{rates?.ratesCheckedAt ? `, cadastrados pela Nokta em ${fmtDate(rates.ratesCheckedAt)}` : ""}. Não é o valor da sua conta: o que você paga de verdade é o que aparece na sua fatura da Meta.
        </p>
      </div>
    </ChannelCard>
  );
}
