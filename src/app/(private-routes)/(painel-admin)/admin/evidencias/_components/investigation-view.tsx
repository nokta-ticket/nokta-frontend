"use client";

import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BooleanValue, DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { CollapsibleCard } from "../../_components/collapsible-card";
import { SimpleTable } from "../../_components/simple-table";
import { metaOf, ORDER_STATUS_META } from "../../_lib/status-meta";
import { SCORE_META, SEVERITY_META, TONE_DOT, VEREDITO_META, canalIcon, loteTipoNome, timelineTone } from "./meta";
import type { InvestigationData } from "./types";

const TEXT_TONE: Record<string, string> = { success: "text-success", danger: "text-danger", warning: "text-warning", info: "text-info", brand: "text-brand", neutral: "text-muted-foreground" };
const RING_TONE: Record<string, string> = { success: "ring-success", danger: "ring-danger", warning: "ring-warning", info: "ring-info", brand: "ring-brand", neutral: "ring-border-strong" };

function Timeline({ items }: { items: { tone: string; title: ReactNode; meta?: ReactNode }[] }) {
  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-0.5 before:rounded-full before:bg-border-strong">
      {items.map((item, i) => (
        <li key={i} className="relative flex gap-3">
          <span className={cn("relative z-10 mt-1 size-4 shrink-0 rounded-full border-[3px] border-surface", TONE_DOT[item.tone as keyof typeof TONE_DOT] ?? "bg-neutral")} aria-hidden />
          <div className="min-w-0 text-sm text-foreground">
            {item.title}
            {item.meta ? <p className="mt-0.5 text-caption text-muted-foreground">{item.meta}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Dossiê de um ingresso: resumo, score de defesa e veredito em cima, depois
 * as 12 seções de evidência em cards que abrem e fecham, e a auditoria.
 */
export function InvestigationView({ data, onBack, onDownload, downloading }: { data: InvestigationData; onBack: () => void; onDownload: () => void; downloading: boolean }) {
  const { score, veredito } = data;
  const scoreMeta = SCORE_META[score.nivel] ?? { label: score.nivel, tone: "neutral" as const };
  const vMeta = VEREDITO_META[veredito.tipo] ?? { label: veredito.tipo, tone: "neutral" as const, icon: "info" as const, summary: "" };

  const totalFav = data.evidenciasFavoraveis.length;
  const presentFav = data.evidenciasFavoraveis.filter((e) => e.presente).length;
  const favConclusion = (() => {
    if (totalFav === 0) return "Sem evidências registradas.";
    const ratio = presentFav / totalFav;
    if (ratio >= 0.9) return "Há fortes indícios de que o serviço foi efetivamente prestado.";
    if (ratio >= 0.5) return "A maioria das evidências indica prestação efetiva do serviço.";
    return "Evidências insuficientes para conclusão definitiva.";
  })();

  const pedidoMeta = data.pedido ? metaOf(ORDER_STATUS_META, data.pedido.status, data.pedido.statusNome) : null;
  const hasGateway = Boolean(data.gateway && (data.gateway.gatewayId || data.gateway.threedsStatus || data.gateway.antifraudeStatus));
  const hasDelivery = Boolean((data.comunicacoes && data.comunicacoes.length > 0) || (data.acessosIngresso && data.acessosIngresso.totalAcessos > 0));

  return (
    <div className="space-y-6">
      <PageHeader
        back={onBack}
        title={<span className="font-mono">{data.ingresso.codigo}</span>}
        badge={<StatusBadge tone={data.ingresso.bloqueado ? "danger" : data.ingresso.status === 4 ? "danger" : data.ingresso.status === 1 ? "success" : "neutral"}>{data.ingresso.bloqueado ? "Bloqueado" : data.ingresso.statusNome}</StatusBadge>}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={11} />
              {data.evento.nome}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="user" size={11} />
              {data.comprador.nome}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="cart" size={11} />
              Compra em {data.pedido?.criadoEm ?? "não informada"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="qr" size={11} />
              Check-in: {data.checkin.utilizado ? data.checkin.dataHora : "não utilizado"}
            </span>
          </>
        }
        actions={
          <Button onClick={onDownload} loading={downloading} leftIcon="download">
            Gerar dossiê PDF
          </Button>
        }
      />

      {/* Score + veredito */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card accent className="items-center justify-center p-6 text-center">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Score de defesa</p>
          <div className={cn("mt-4 flex size-28 flex-col items-center justify-center rounded-full bg-surface-2 ring-4", RING_TONE[scoreMeta.tone])}>
            <span className="text-stat-lg font-medium tabular-nums text-foreground">{score.total}</span>
            <span className="text-caption text-muted-foreground">de {score.maximo}</span>
          </div>
          <StatusBadge tone={scoreMeta.tone} className="mt-3">
            {scoreMeta.label}
          </StatusBadge>
          {score.itens.length > 0 ? (
            <ul className="mt-5 w-full space-y-1.5 text-left text-caption">
              {score.itens.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                  <Icon name={item.ativo ? "check-circle" : "circle-outline"} size={12} className={item.ativo ? "text-success" : "text-subtle-foreground"} />
                  <span className={cn("flex-1", !item.ativo && "text-subtle-foreground")}>{item.evidencia}</span>
                  <span className="tnum text-subtle-foreground">+{item.pontos}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn("flex size-11 items-center justify-center rounded-full bg-surface-2", TEXT_TONE[vMeta.tone])}>
              <Icon name={vMeta.icon} size={20} />
            </span>
            <div>
              <p className="text-title font-semibold text-foreground">{vMeta.label}</p>
              <p className="text-caption text-muted-foreground">{vMeta.summary}</p>
            </div>
          </div>
          {veredito.motivos.length > 0 ? (
            <ul className="mt-5 space-y-2 text-sm text-foreground">
              {veredito.motivos.map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", TONE_DOT[vMeta.tone])} aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <DetailItem label="Evento" value={data.evento.nome} />
            <DetailItem label="Data do evento" value={data.evento.data} />
            <DetailItem label="Endereço" value={data.evento.endereco} />
          </div>
        </Card>
      </div>

      {/* 1. Evidências favoráveis */}
      <CollapsibleCard title="Evidências favoráveis à Nokta" summary={`${presentFav} de ${totalFav} presentes`} defaultOpen>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.evidenciasFavoraveis.map((ev, i) => (
            <div key={i} className="surface-inset flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm">
              <Icon name={ev.presente ? "check-circle" : "x-circle"} size={14} className={cn("mt-0.5 shrink-0", ev.presente ? "text-success" : "text-danger")} />
              <span className="text-foreground">{ev.descricao}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm italic text-muted-foreground">{favConclusion}</p>
      </CollapsibleCard>

      {/* 2. Identidade do comprador */}
      <CollapsibleCard title="Identidade do comprador" defaultOpen>
        <DetailGrid columns={4}>
          <DetailItem label="Nome" value={data.comprador.nome} />
          <DetailItem label="E-mail" value={data.comprador.email} />
          <DetailItem label="Telefone" value={data.comprador.telefone} />
          <DetailItem label="CPF" mono value={data.comprador.cpf} />
          <DetailItem label="Telefone verificado">
            <BooleanValue value={data.comprador.telefoneVerificado} yes="Verificado" no="Não verificado" />
          </DetailItem>
          <DetailItem label="Conta ativa">
            <BooleanValue value={data.comprador.contaAtiva} yes="Ativa" no="Inativa" />
          </DetailItem>
          <DetailItem label="Conta criada em" value={data.comprador.contaCriadaEm} />
          <DetailItem label="Conta bloqueada">
            <BooleanValue value={data.comprador.bloqueado} invert />
          </DetailItem>
        </DetailGrid>
      </CollapsibleCard>

      {/* 3. Histórico do usuário */}
      <CollapsibleCard title="Histórico do comprador" defaultOpen>
        <DetailGrid columns={3}>
          <DetailItem label="Pedidos pagos" value={data.historicoComprador.pedidosPagos} />
          <DetailItem label="Total de ingressos" value={data.historicoComprador.totalIngressos} />
          <DetailItem label="Transferências realizadas" value={data.historicoComprador.transferenciasRealizadas} />
          <DetailItem label="Revendas realizadas" value={data.historicoComprador.revendasRealizadas} />
          <DetailItem label="Chargebacks">
            <span className={cn("tnum", data.historicoComprador.chargebacks > 0 ? "text-danger" : "text-success")}>{data.historicoComprador.chargebacks}</span>
          </DetailItem>
          <DetailItem label="Eventos comparecidos" value={data.historicoComprador.eventosComparecidos} />
        </DetailGrid>
      </CollapsibleCard>

      {/* 4. Dados da compra */}
      <CollapsibleCard title="Dados da compra" summary={data.pedido ? data.pedido.codigo : "sem pedido"}>
        {data.pedido && pedidoMeta ? (
          <DetailGrid columns={4}>
            <DetailItem label="Pedido" mono value={data.pedido.codigo} />
            <DetailItem label="Valor total" value={data.pedido.valorTotal} />
            <DetailItem label="Status do pagamento">
              <StatusBadge tone={pedidoMeta.tone}>{data.pedido.statusNome}</StatusBadge>
            </DetailItem>
            <DetailItem label="Pago em" value={data.pedido.pagoEm || null} />
            <DetailItem label="Criado em" value={data.pedido.criadoEm} />
            <DetailItem label="Quantidade" value={data.pedido.quantidade} />
            <DetailItem label="Itens" value={data.pedido.itens} />
            <DetailItem label="Transações" value={data.pedido.transacoes} />
            <DetailItem label="Lote" value={data.lote.nome} />
            <DetailItem label="Número do lote" value={data.lote.lote} />
            <DetailItem label="Tipo do ingresso" value={loteTipoNome(data.lote.tipo)} />
            <DetailItem label="Valor do lote" value={data.lote.valor} />
          </DetailGrid>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum pedido associado a este ingresso.</p>
        )}
      </CollapsibleCard>

      {/* 5. Gateway / 3DS / Antifraude */}
      <CollapsibleCard title="Gateway, 3DS e antifraude" summary={hasGateway ? undefined : "sem dados"}>
        {hasGateway && data.gateway ? (
          <DetailGrid columns={3}>
            <DetailItem label="Gateway ID" mono value={data.gateway.gatewayId} />
            <DetailItem label="3DS">{data.gateway.threedsStatus ? <StatusBadge tone="success">3DS autenticado</StatusBadge> : <StatusBadge tone="neutral">Sem 3DS</StatusBadge>}</DetailItem>
            <DetailItem label="Antifraude">{data.gateway.antifraudeStatus ? <StatusBadge tone="success">{data.gateway.antifraudeStatus}</StatusBadge> : <span className="font-normal text-subtle-foreground">Não informado</span>}</DetailItem>
          </DetailGrid>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados do gateway disponíveis.</p>
        )}
      </CollapsibleCard>

      {/* 6. Contexto técnico do checkout */}
      <CollapsibleCard title="Contexto técnico do checkout" summary={data.contextoCheckout ? undefined : "anterior ao Protect"}>
        {data.contextoCheckout ? (
          <DetailGrid columns={3}>
            <DetailItem label="IP" mono value={data.contextoCheckout.ip} />
            <DetailItem label="Fingerprint" mono value={data.contextoCheckout.fingerprint} />
            <DetailItem label="User agent" value={data.contextoCheckout.userAgent} span />
            <DetailItem label="Telefone verificado (checkout)">
              <BooleanValue value={data.contextoCheckout.buyerPhoneVerified} />
            </DetailItem>
            <DetailItem label="Conta ativa (checkout)">
              <BooleanValue value={data.contextoCheckout.buyerAccountActive} />
            </DetailItem>
            <DetailItem label="Idade da conta" value={data.contextoCheckout.buyerAccountAgeDays != null ? `${data.contextoCheckout.buyerAccountAgeDays} dias` : null} />
          </DetailGrid>
        ) : (
          <p className="text-sm text-muted-foreground">Compra anterior ao Nokta Protect — sem contexto técnico.</p>
        )}
      </CollapsibleCard>

      {/* 7. Aceite de termos */}
      <CollapsibleCard title="Aceite de termos" summary={data.termosAceitos ? `versão ${data.termosAceitos.versao}` : "sem registro"}>
        {data.termosAceitos ? (
          <Callout tone="success" title="Termos aceitos">
            Versão {data.termosAceitos.versao}, em {data.termosAceitos.aceiteEm}.
          </Callout>
        ) : (
          <Callout tone="neutral">Sem registro de aceite de termos.</Callout>
        )}
      </CollapsibleCard>

      {/* 8. Evidências de entrega */}
      <CollapsibleCard title="Evidências de entrega" summary={hasDelivery ? undefined : "nenhuma"}>
        {hasDelivery ? (
          <div className="space-y-5">
            {data.comunicacoes && data.comunicacoes.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Comunicações enviadas</p>
                <ul className="space-y-2">
                  {data.comunicacoes.map((c, i) => (
                    <li key={i} className="surface-inset flex items-center gap-3 rounded-xl px-3.5 py-3">
                      <Icon name={canalIcon(c.canal)} size={16} className="shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{c.tipo}</p>
                        <p className="truncate text-caption text-muted-foreground">
                          Para {c.destinatario} — {c.data}
                        </p>
                      </div>
                      <StatusBadge tone={c.status === "enviado" || c.status === "entregue" ? "success" : "neutral"}>{c.status}</StatusBadge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data.acessosIngresso && data.acessosIngresso.totalAcessos > 0 ? (
              <DetailGrid columns={3}>
                <DetailItem label="Total de acessos" value={data.acessosIngresso.totalAcessos} />
                <DetailItem label="Visualizações do QR" value={data.acessosIngresso.qrViews} />
                <DetailItem label="Último acesso" value={data.acessosIngresso.ultimoAcesso} />
              </DetailGrid>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem evidências de entrega registradas.</p>
        )}
      </CollapsibleCard>

      {/* 9. Histórico de posse */}
      <CollapsibleCard title="Histórico de posse" summary={`${data.transferencias.length} transferências · ${data.revendas.length} revendas`}>
        {data.transferencias.length === 0 && data.revendas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma transferência ou revenda registrada.</p>
        ) : (
          <Timeline
            items={[
              ...data.transferencias.map((t) => ({
                tone: "info",
                title: (
                  <p>
                    Transferido de <span className="font-medium">{t.de.nome}</span> <span className="text-caption text-muted-foreground">({t.de.email})</span> para <span className="font-medium">{t.para.nome}</span> <span className="text-caption text-muted-foreground">({t.para.email})</span>
                  </p>
                ),
                meta: t.data,
              })),
              ...data.revendas.map((r) => ({
                tone: "warning",
                title: (
                  <p className="flex flex-wrap items-center gap-2">
                    Revenda por <span className="font-medium">{r.precoRevenda}</span>
                    <StatusBadge tone="neutral" dot={false}>
                      Status {r.status}
                    </StatusBadge>
                  </p>
                ),
                meta: r.criadaEm,
              })),
            ]}
          />
        )}
      </CollapsibleCard>

      {/* 10. Check-in */}
      <CollapsibleCard title="Check-in do evento" summary={data.checkin.utilizado ? "utilizado" : "não utilizado"}>
        {data.checkin.utilizado ? (
          <div className="space-y-4">
            <Callout tone="success" title="Serviço efetivamente utilizado" icon="qr">
              O ingresso foi validado na portaria.
            </Callout>
            <DetailGrid columns={4}>
              <DetailItem label="Data/hora da validação" value={data.checkin.dataHora} />
              <DetailItem label="Operador" value={data.checkin.operadorId != null ? `#${data.checkin.operadorId}` : null} />
              <DetailItem label="IP da validação" mono value={data.checkin.ip} />
              <DetailItem label="Fingerprint" mono value={data.checkin.fingerprint} />
              <DetailItem label="Tentativas anteriores" value={data.checkin.tentativasAntes} />
            </DetailGrid>
          </div>
        ) : (
          <Callout tone="neutral">Ingresso ainda não utilizado.</Callout>
        )}
      </CollapsibleCard>

      {/* 11. Timeline completa */}
      <CollapsibleCard title="Timeline completa" summary={`${data.timeline.length} eventos`}>
        {data.timeline.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p> : <Timeline items={data.timeline.map((ev) => ({ tone: timelineTone(ev.tipo), title: <p>{ev.descricao}</p>, meta: [ev.data, ev.ator, ev.ip ? `IP ${ev.ip}` : null].filter(Boolean).join(" — ") }))} />}
      </CollapsibleCard>

      {/* 12. Indicadores de risco */}
      <CollapsibleCard title="Indicadores de risco" summary={data.indicadores.length === 0 ? "nenhum" : `${data.indicadores.length}`}>
        {data.indicadores.length === 0 ? (
          <Callout tone="success" title="Nenhum indicador de risco encontrado" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.indicadores.map((ind, i) => {
              const sev = SEVERITY_META[ind.severidade] ?? { label: ind.severidade, tone: "neutral" as const };
              return (
                <div key={i} className="surface-inset flex items-center justify-between gap-3 rounded-xl px-3.5 py-3">
                  <p className="text-sm text-foreground">{ind.descricao}</p>
                  <StatusBadge tone={sev.tone}>{sev.label}</StatusBadge>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleCard>

      {/* Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle>Auditoria</CardTitle>
          <StatusBadge tone={data.auditoria.integridadeVerificada ? "success" : "danger"}>{data.auditoria.integridadeVerificada ? `Integridade verificada · ${data.auditoria.totalRegistros} registros` : "Integridade comprometida"}</StatusBadge>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {data.eventosSeguranca.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Eventos de segurança</p>
              <SimpleTable columns={["Tipo", "IP", "Fingerprint", "Quando"]} empty="" rows={data.eventosSeguranca.map((e) => [<span key="t" className="font-mono text-caption">{e.tipo}</span>, e.ip ?? "—", <span key="f" className="font-mono text-caption">{e.fingerprint ?? "—"}</span>, e.data])} />
            </div>
          ) : null}
          {data.webhooks && data.webhooks.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Webhooks recebidos</p>
              <SimpleTable columns={["Evento", "Assinatura", "Processado", "Data"]} empty="" rows={data.webhooks.map((wh) => [wh.eventType, <StatusBadge key="s" tone={wh.signatureValid ? "success" : "danger"}>{wh.signatureValid ? "Válida" : "Inválida"}</StatusBadge>, <StatusBadge key="p" tone={wh.processedOk ? "success" : "danger"}>{wh.processedOk ? "OK" : "Falha"}</StatusBadge>, wh.data])} />
            </div>
          ) : null}
          {data.eventosSeguranca.length === 0 && (!data.webhooks || data.webhooks.length === 0) ? <p className="text-sm text-muted-foreground">Sem eventos de segurança nem webhooks pra este ingresso.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
