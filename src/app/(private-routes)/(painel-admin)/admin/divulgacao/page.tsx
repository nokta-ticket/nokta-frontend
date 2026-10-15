"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatBRLCents } from "@/lib/format";
import { RefreshButton } from "../_components/refresh-button";
import { formatDateTime } from "../_lib/format";
import { metaOf } from "../_lib/status-meta";
import { useStaffRole } from "../_lib/staff-role";
import { CAMPAIGN_STATUS_META, QUALITY_META, TEMPLATE_STATUS_META, type CampaignRow, type ChannelStatus } from "./_lib/promo";

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <StatusBadge tone={ok ? "success" : "warning"}>{ok ? "Pronto" : "Pendente"}</StatusBadge>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {detail ? <span className="block text-caption text-muted-foreground">{detail}</span> : null}
      </span>
    </li>
  );
}

function ChannelTab({ status, reload }: { status: ChannelStatus; reload: () => Promise<void> }) {
  const { canAct, isSuperAdmin } = useStaffRole();
  const [busy, setBusy] = useState<string | null>(null);
  const [submitKey, setSubmitKey] = useState<string | null>(null);
  const [exampleUrl, setExampleUrl] = useState("");

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await action();
      toast.success(success);
      await reload();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível concluir."));
      return false;
    } finally {
      setBusy(null);
    }
  }

  const phone = status.phone;
  const allApproved = status.templates.every((t) => t.status === "APPROVED");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Autorizaram" icon="check-circle" value={status.consent.optedIn} hint="Contas ativas com telefone confirmado" />
        <StatCard label="Ainda não escolheram" icon="question" value={status.consent.unknown} hint="Veem a pergunta no checkout" />
        <StatCard label="Pediram para sair" icon="ban" value={status.consent.optedOut} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Número de promoções</CardTitle>
          <CardDescription>Conta da própria Nokta na Meta, separada do número que entrega os ingressos.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <ul className="divide-y divide-border">
            <CheckRow ok={status.configured} label="Número configurado" detail={status.configured ? undefined : "Faltam NOKTA_PROMO_WHATSAPP_PHONE_NUMBER_ID, NOKTA_PROMO_WHATSAPP_WABA_ID e NOKTA_PROMO_WHATSAPP_TOKEN no Render."} />
            <CheckRow ok={status.metaAppConfigured} label="App da Meta configurado" detail={status.metaAppConfigured ? undefined : "Faltam META_APP_ID e META_APP_SECRET (o mesmo app do CRM)."} />
            <CheckRow ok={Boolean(phone?.appSubscribedAt)} label="Avisos da Meta ligados" detail={phone?.appSubscribedAt ? `Conferido em ${formatDateTime(phone.checkedAt)}` : "Use \"Verificar na Meta\" depois de configurar o número."} />
            <CheckRow ok={allApproved} label="Modelos aprovados pela Meta" detail={allApproved ? undefined : "Envie os dois modelos para análise abaixo."} />
            <CheckRow ok={status.sendingEnabled} label="Envio ligado" detail={status.sendingEnabled ? undefined : "NOKTA_PROMO_SENDING_ENABLED=true no Render. Desligado, nada sai."} />
          </ul>

          {phone ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm">
              <span className="font-semibold text-foreground">{phone.displayPhone ?? "Número sem informação"}</span>
              {phone.verifiedName ? <span className="text-muted-foreground">· {phone.verifiedName}</span> : null}
              {phone.qualityRating ? <StatusBadge tone={metaOf(QUALITY_META, phone.qualityRating).tone}>{metaOf(QUALITY_META, phone.qualityRating, phone.qualityRating).label}</StatusBadge> : null}
              {phone.messagingLimitTier ? <StatusBadge tone="neutral" dot={false}>Limite: {phone.messagingLimitTier}</StatusBadge> : null}
              <span className="w-full text-caption text-muted-foreground">Informado pela Meta em {formatDateTime(phone.checkedAt)}.</span>
            </div>
          ) : null}
          {phone?.lastError ? (
            <Callout tone="danger" className="mt-4" title="Última verificação falhou">
              {phone.lastError}
            </Callout>
          ) : null}

          {canAct && status.configured ? (
            <Button className="mt-4" variant="secondary" leftIcon="refresh" loading={busy === "check"} onClick={() => void run("check", () => api.post("/admin/divulgacao/canal/verificar"), "Número conferido na Meta")}>
              Verificar na Meta
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Modelos de mensagem</h2>
          <p className="text-sm text-muted-foreground">Texto fixo da Nokta. Em cada campanha mudam só o evento, a data, o local, a imagem e o cupom.</p>
        </div>
        {status.templates.map((t) => {
          const meta = metaOf(TEMPLATE_STATUS_META, t.status);
          const canSubmit = isSuperAdmin && status.configured && ["NOT_SUBMITTED", "REJECTED", "DISABLED"].includes(t.status);
          return (
            <Card key={t.key}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{t.label}</span>
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                  <span className="text-caption text-muted-foreground">{t.metaName}</span>
                </div>
                <p className="whitespace-pre-line rounded-xl bg-surface-2 p-3 text-sm text-foreground">{t.body}</p>
                <p className="text-caption text-muted-foreground">
                  Rodapé: {t.footer} · Botões: {t.buttons.join(" e ")}
                </p>
                {t.rejectedReason ? (
                  <Callout tone="danger" title="Motivo informado pela Meta">
                    {t.rejectedReason}
                  </Callout>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {canSubmit ? (
                    <Button size="sm" leftIcon="send" onClick={() => setSubmitKey(t.key)}>
                      Enviar para análise
                    </Button>
                  ) : null}
                  {canAct && status.configured && t.status !== "NOT_SUBMITTED" ? (
                    <Button size="sm" variant="secondary" leftIcon="refresh" loading={busy === `tpl-${t.key}`} onClick={() => void run(`tpl-${t.key}`, () => api.post(`/admin/divulgacao/modelos/${t.key}/atualizar`), "Estado atualizado")}>
                      Atualizar estado
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={submitKey !== null} onOpenChange={(o) => (!o && !busy ? setSubmitKey(null) : null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Enviar modelo para análise</DialogTitle>
            <DialogDescription>A Meta pede uma imagem de exemplo para o cabeçalho. Sem informar, vai a logo da Nokta Tickets. A análise costuma levar de minutos a algumas horas.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Imagem de exemplo" htmlFor="promo-example" optional hint="JPEG ou PNG, por HTTPS.">
              <Input id="promo-example" placeholder="https://…/banner.jpg" value={exampleUrl} onChange={(e) => setExampleUrl(e.target.value)} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSubmitKey(null)} disabled={busy !== null}>
              Cancelar
            </Button>
            <Button
              leftIcon="send"
              loading={busy === "submit"}
              onClick={async () => {
                const key = submitKey;
                if (!key) return;
                const ok = await run("submit", () => api.post(`/admin/divulgacao/modelos/${key}/enviar`, { exampleImageUrl: exampleUrl.trim() || undefined }), "Modelo enviado para a Meta");
                if (ok) {
                  setSubmitKey(null);
                  setExampleUrl("");
                }
              }}
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignsTab({ campaigns }: { campaigns: CampaignRow[] }) {
  if (!campaigns.length) {
    return <EmptyState icon="megaphone" title="Nenhuma campanha ainda" description="Crie um destaque de evento para a base que autorizou receber novidades da Nokta." />;
  }
  const delivered = (c: CampaignRow) => (c.recipientsTotal ? `${c.deliveredCount} de ${c.recipientsTotal}` : "—");
  return (
    <DataTableShell
      table={
        <DataTable>
          <DataTableHead>
            <tr>
              <DataTableHeadCell>Evento</DataTableHeadCell>
              <DataTableHeadCell>Situação</DataTableHeadCell>
              <DataTableHeadCell>Envio</DataTableHeadCell>
              <DataTableHeadCell align="right">Entregues</DataTableHeadCell>
              <DataTableHeadCell align="right">Lidas</DataTableHeadCell>
              <DataTableHeadCell align="right">Saíram</DataTableHeadCell>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {campaigns.map((c, i) => {
              const meta = metaOf(CAMPAIGN_STATUS_META, c.status);
              return (
                <DataTableRow key={c.id} index={i}>
                  <DataTableCell>
                    <Link href={`/admin/divulgacao/${c.id}`} className="font-medium text-foreground hover:underline">
                      {c.eventName}
                    </Link>
                    <p className="text-caption text-muted-foreground">
                      {c.organizationName}
                      {c.priceCents !== null ? ` · ${formatBRLCents(c.priceCents)}` : ""}
                    </p>
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone={meta.tone} pulse={c.status === "SENDING"}>
                      {meta.label}
                    </StatusBadge>
                  </DataTableCell>
                  <DataTableCell className="tnum text-muted-foreground">{formatDateTime(c.scheduledAt)}</DataTableCell>
                  <DataTableCell align="right" className="tnum">
                    {delivered(c)}
                  </DataTableCell>
                  <DataTableCell align="right" className="tnum">
                    {c.readCount}
                  </DataTableCell>
                  <DataTableCell align="right" className="tnum">
                    {c.optOutCount}
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
      }
      mobile={
        <MobileCardList>
          {campaigns.map((c, i) => {
            const meta = metaOf(CAMPAIGN_STATUS_META, c.status);
            return (
              <MobileCard
                  key={c.id}
                  href={`/admin/divulgacao/${c.id}`}
                  index={i}
                  title={c.eventName}
                  subtitle={c.organizationName}
                  badge={<StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>}
                  meta={[
                    { label: "Envio", value: formatDateTime(c.scheduledAt), num: true },
                    { label: "Entregues", value: delivered(c), num: true },
                    { label: "Saíram", value: String(c.optOutCount), num: true },
                  ]}
                />
            );
          })}
        </MobileCardList>
      }
    />
  );
}

export default function DivulgacaoPage() {
  const { canAct } = useStaffRole();
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([api.get<ChannelStatus>("/admin/divulgacao/canal"), api.get<{ data: CampaignRow[] }>("/admin/divulgacao/campanhas")]);
      setStatus(s.data);
      setCampaigns(c.data.data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar a divulgação."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ready = status ? status.configured && status.sendingEnabled && status.templates.some((t) => t.status === "APPROVED") : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Divulgação da Nokta"
        description="Destaques de evento pelo número de promoções da Nokta Tickets, só para quem autorizou."
        actions={
          canAct ? (
            <Button asChild>
              <Link href="/admin/divulgacao/nova">
                <Icon name="plus" size={14} />
                Nova campanha
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <ErrorState title="Não deu pra carregar" description={error} onRetry={() => void load()} />
      ) : !status || !campaigns ? (
        <RowsSkeleton rows={5} />
      ) : (
        <Tabs defaultValue={campaigns.length ? "campanhas" : "canal"}>
          <div className="flex items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
              <TabsTrigger value="canal">Canal</TabsTrigger>
            </TabsList>
            <RefreshButton onClick={() => void load()} pending={loading} />
          </div>
          <TabsContent value="campanhas" className="mt-5 space-y-4">
            {!ready ? (
              <Callout tone="warning" title="O canal ainda não está pronto para enviar">
                Veja o que falta na aba Canal. Dá para preparar campanhas, mas só agenda com o canal pronto.
              </Callout>
            ) : null}
            <CampaignsTab campaigns={campaigns} />
          </TabsContent>
          <TabsContent value="canal" className="mt-5">
            <ChannelTab status={status} reload={load} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
