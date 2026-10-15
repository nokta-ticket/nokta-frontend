"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatBRLCents } from "@/lib/format";
import { RefreshButton } from "../../_components/refresh-button";
import { formatDateTime } from "../../_lib/format";
import { metaOf } from "../../_lib/status-meta";
import { useStaffRole } from "../../_lib/staff-role";
import { WhatsappPreview } from "../_components/whatsapp-preview";
import { CAMPAIGN_STATUS_META, SKIP_REASON_LABEL, percent, type CampaignDetail } from "../_lib/promo";

function audienceText(a: CampaignDetail["audience"], organizationName: string): string {
  if (a.allOptedIn) return "Toda a base que autorizou";
  const parts: string[] = [];
  if (a.cities.length) parts.push(`quem é de ${a.cities.join(", ")}`);
  if (a.producerBuyers) parts.push(`quem já comprou de ${organizationName}`);
  return parts.join(" ou ") || "—";
}

export default function CampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const { canAct } = useStaffRole();
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CampaignDetail>(`/admin/divulgacao/campanhas/${id}`);
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar a campanha."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Enquanto envia, os números mudam: atualiza a cada 15 s.
  useEffect(() => {
    if (!data || !["SCHEDULED", "PREPARING", "SENDING"].includes(data.status)) return;
    const timer = setInterval(() => void load(), 15_000);
    return () => clearInterval(timer);
  }, [data, load]);

  if (error) return <ErrorState title="Não deu pra carregar" description={error} onRetry={() => void load()} />;
  if (!data) return <RowsSkeleton rows={6} />;

  const meta = metaOf(CAMPAIGN_STATUS_META, data.status);
  const c = data.counters;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.event.nome}
        description={`${data.event.organizationName} · destaque da Nokta`}
        back="/admin/divulgacao"
        badge={
          <StatusBadge tone={meta.tone} pulse={data.status === "SENDING"}>
            {meta.label}
          </StatusBadge>
        }
        actions={
          <div className="flex gap-2">
            <RefreshButton onClick={() => void load()} pending={loading} />
            {canAct && data.status === "SCHEDULED" ? (
              <Button variant="destructive-soft" leftIcon="x-circle" onClick={() => setCancelOpen(true)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        }
      />

      {data.lastError ? (
        <Callout tone={data.status === "FAILED" ? "danger" : "warning"} title={data.status === "FAILED" ? "A campanha não foi enviada" : "Atenção"}>
          {data.lastError}
        </Callout>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Destinatários" icon="users" value={c.recipientsTotal} />
        <StatCard label="Entregues" icon="check-double" value={c.delivered} hint={percent(c.delivered, c.recipientsTotal)} />
        <StatCard label="Lidas" icon="eye" value={c.read} hint={percent(c.read, c.delivered)} />
        <StatCard label="Compraram depois" icon="ticket" value={c.boughtAfter} hint="Compraram ingresso deste evento depois de receber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <dl className="divide-y divide-border text-sm">
                {[
                  ["Público", audienceText(data.audience, data.event.organizationName)],
                  ["Teto", data.audience.maxRecipients ? `${data.audience.maxRecipients} pessoas` : "Sem teto"],
                  ["Cupom", data.couponCode ?? "Sem cupom"],
                  ["Envio agendado", formatDateTime(data.scheduledAt)],
                  ["Começou", data.startedAt ? formatDateTime(data.startedAt) : "—"],
                  ["Terminou", data.finishedAt ? formatDateTime(data.finishedAt) : "—"],
                  ["Valor cobrado do produtor", data.priceCents !== null ? formatBRLCents(data.priceCents) : "Não informado"],
                  ["Observação", data.notes ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>O que aconteceu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-sm">
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="tnum">{c.sent} aceitas pela Meta</li>
                <li className="tnum">{c.failed} falharam</li>
                <li className="tnum">{c.skipped} não enviadas</li>
                <li className="tnum">{c.optOut} pediram para sair por esta mensagem</li>
              </ul>
              {data.breakdown.some((b) => b.skipReason) ? (
                <ul className="space-y-1 border-t border-border pt-3">
                  {data.breakdown
                    .filter((b) => b.skipReason)
                    .map((b) => (
                      <li key={b.skipReason} className="tnum text-muted-foreground">
                        {b.total} · {SKIP_REASON_LABEL[b.skipReason as string] ?? b.skipReason}
                      </li>
                    ))}
                </ul>
              ) : null}
              {data.topErrors.length ? (
                <div className="border-t border-border pt-3">
                  <p className="mb-1 font-medium text-foreground">Falhas mais comuns (como a Meta informou)</p>
                  <ul className="space-y-1">
                    {data.topErrors.map((e) => (
                      <li key={e.error ?? "sem"} className="tnum text-muted-foreground">
                        {e.total} · {e.error ?? "Sem detalhe"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="text-caption text-subtle-foreground">“Compraram depois” conta quem comprou depois de receber. Não prova que foi por causa da mensagem.</p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-2 lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm font-semibold text-foreground">Mensagem enviada</p>
          <WhatsappPreview preview={data.preview} />
        </aside>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar campanha"
        description="Ninguém recebe esta mensagem. Não dá para desfazer."
        confirmLabel="Cancelar campanha"
        cancelLabel="Voltar"
        danger
        icon="x-circle"
        onConfirm={async () => {
          try {
            await api.post(`/admin/divulgacao/campanhas/${data.id}/cancelar`);
            toast.success("Campanha cancelada");
            await load();
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível cancelar."));
            throw err;
          }
        }}
      />
    </div>
  );
}
