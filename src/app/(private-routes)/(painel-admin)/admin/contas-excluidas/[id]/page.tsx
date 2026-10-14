"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api, { getErrorMessage } from "@/lib/axios";
import { formatBRL } from "@/lib/format";
import { SimpleTable } from "../../_components/simple-table";
import { AUDIT_ACTION_META, EVENT_STATUS_META, FIELD_LABELS, ORDER_STATUS_META, RESALE_STATUS_LABEL, SNAPSHOT_TICKET_STATUS_META, USER_ROLE_ID_LABEL, metaOf } from "../../_lib/status-meta";
import { formatDateTime, formatDateUTC } from "../../_lib/format";

/* O conteúdo vem de um retrato gravado no momento da exclusão
   (deleted-account-snapshot.ts no backend); nada aqui é consultado ao vivo. */

type Row = Record<string, any>;

interface DeletedAccount {
  id: number;
  userId: number;
  email: string;
  nome: string;
  deletedByEmail: string | null;
  deletedAt: string;
  summary: Row;
  snapshot: {
    conta: Row;
    pedidos: Row[];
    ingressos: Row[];
    historicoIngressos: Row[];
    transferencias: Row[];
    revendas: Row[];
    organizacoes: Row[];
    participacoes: Row[];
    auditoria: Row[];
    sessoes: Row[];
    seguranca: Row[];
    comunicacoes: Row[];
  };
}

const text = (value: unknown): ReactNode => (value === null || value === undefined || value === "" ? <span className="text-subtle-foreground">—</span> : String(value));
const dateTime = (value?: string | null) => (value ? <span className="tnum">{formatDateTime(value)}</span> : text(null));
const money = (value: unknown) => <span className="tnum">{formatBRL(Number(value ?? 0))}</span>;
const mono = (value: unknown) => <span className="font-mono text-caption">{text(value)}</span>;

/** "E-mail: antigo → novo" para cada dado alterado num registro de auditoria. */
function changesOf(metadata: Row | null): { field: string; de: unknown; para: unknown }[] {
  const changes = metadata?.alteracoes;
  if (!changes || typeof changes !== "object") return [];
  return Object.entries(changes as Record<string, Row>).map(([field, value]) => ({ field: FIELD_LABELS[field] ?? field, de: value?.de, para: value?.para }));
}

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-baseline gap-2 text-base font-semibold text-foreground">
        {title}
        {count !== undefined ? <span className="tnum text-sm font-normal text-muted-foreground">{count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

export default function ContaExcluidaPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<DeletedAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await api.get<DeletedAccount>(`/admin/contas-excluidas/${id}`);
      setAccount(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar esta conta."));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader back="/admin/contas-excluidas" title="Conta excluída" />
        <ErrorState title="Não deu pra carregar esta conta" description={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  const s = account.snapshot;
  const conta = s.conta ?? {};
  const ticketById = new Map<number, Row>(s.ingressos.map((t) => [t.id, t]));
  const ticketLabel = (ticketId: number) => {
    const ticket = ticketById.get(ticketId);
    return ticket ? `${ticket.code} · ${ticket.ticket?.event?.nome ?? "evento"}` : `Ingresso #${ticketId}`;
  };
  const endereco = [conta.enderecoLogradouro, conta.enderecoNumero, conta.enderecoBairro, conta.enderecoCidade, conta.enderecoUf, conta.enderecoCep].filter(Boolean).join(", ");
  const dataChanges = s.auditoria.filter((log) => changesOf(log.metadata).length > 0);
  const author = (log: Row) => (log.autor?.propriaConta ? "A própria conta" : text(log.autor?.email ?? log.autor?.nome));

  return (
    <div className="space-y-6">
      <PageHeader
        back="/admin/contas-excluidas"
        title={account.nome || "Sem nome"}
        badge={<StatusBadge tone="danger">Excluída</StatusBadge>}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 break-all">
              <Icon name="mail" size={11} />
              {account.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="hashtag" size={11} />
              conta {account.userId}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="trash" size={11} />
              Excluída em {formatDateTime(account.deletedAt)} por {account.deletedByEmail ?? "equipe"}
            </span>
          </>
        }
      />

      <Tabs defaultValue="conta">
        <TabsList variant="line">
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="ingressos">Ingressos ({s.ingressos.length})</TabsTrigger>
          <TabsTrigger value="compras">Compras ({s.pedidos.length})</TabsTrigger>
          <TabsTrigger value="organizacoes">Organizações ({s.organizacoes.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="acessos">Acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados no momento da exclusão</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DetailGrid columns={3}>
                <DetailItem label="Nome" value={[conta.nome, conta.sobrenome].filter(Boolean).join(" ")} />
                <DetailItem label="E-mail" value={conta.email} />
                <DetailItem label="Telefone" value={conta.telefone ? `${conta.telefone} (${conta.telefoneVerificado ? "verificado" : "não verificado"})` : null} />
                <DetailItem label="CPF" mono value={conta.cpf} />
                <DetailItem label="CNPJ" mono value={conta.cnpj} />
                <DetailItem label="Data de nascimento" value={conta.dataNascimento ? formatDateUTC(conta.dataNascimento) : null} />
                <DetailItem label="Tipo da conta" value={USER_ROLE_ID_LABEL[conta.role?.role] ?? "Usuário"} />
                <DetailItem label="Situação na exclusão" value={conta.bloqueado ? "Bloqueada" : conta.ativo ? "Ativa" : "Inativa"} />
                <DetailItem label="Cadastro" value={conta.createdAt ? formatDateTime(conta.createdAt) : null} />
                <DetailItem label="Endereço" value={endereco || null} span />
                <DetailItem label="Chave Pix" value={conta.chavePix} />
                <DetailItem label="Login social" value={conta.oauthProvider} />
              </DetailGrid>
            </CardContent>
          </Card>

          <Section title="Mudanças de dados" count={dataChanges.length}>
            <SimpleTable columns={["Quando", "Dado", "De", "Para", "Quem alterou"]} empty="Nenhuma mudança de dados registrada pra esta conta" rows={dataChanges.flatMap((log) => changesOf(log.metadata).map((c) => [dateTime(log.createdAt), c.field, text(c.de), text(c.para), author(log)]))} />
          </Section>
        </TabsContent>

        <TabsContent value="ingressos" className="space-y-6">
          <Section title="Ingressos">
            <SimpleTable
              columns={["Código", "Evento", "Tipo", { label: "Valor", align: "right", num: true }, "Situação", "Pedido", "Emitido em"]}
              empty="Esta conta não tinha ingressos"
              emptyIcon="ticket"
              rows={s.ingressos.map((t) => {
                const meta = metaOf(SNAPSHOT_TICKET_STATUS_META, t.status as number);
                return [
                  mono(t.code),
                  <div key="e">
                    <p>{text(t.ticket?.event?.nome)}</p>
                    <p className="text-caption text-muted-foreground">{t.ticket?.event?.data ? formatDateUTC(t.ticket.event.data) : null}</p>
                  </div>,
                  text(t.ticket?.nome),
                  money(t.ticket?.valor),
                  <div key="s" className="flex flex-wrap gap-1">
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    {t.bloqueado ? <StatusBadge tone="danger">Bloqueado</StatusBadge> : null}
                  </div>,
                  <span key="o" className="font-mono text-caption">
                    {text(t.order?.code)}
                    {t.compradoPelaConta ? "" : " (recebido)"}
                  </span>,
                  dateTime(t.createdAt),
                ];
              })}
            />
          </Section>

          <Section title="Movimentação dos ingressos" count={s.historicoIngressos.length}>
            <SimpleTable columns={["Quando", "Ingresso", "Registro", "IP"]} empty="Nenhuma movimentação registrada" rows={s.historicoIngressos.map((h) => [dateTime(h.createdAt), ticketLabel(h.ticketId), mono(h.eventType), text(h.ip)])} />
          </Section>

          <Section title="Transferências" count={s.transferencias.length}>
            <SimpleTable columns={["Quando", "Ingresso", "De", "Para"]} empty="Nenhuma transferência" emptyIcon="transfer" rows={s.transferencias.map((t) => [dateTime(t.createdAt), ticketLabel(t.userTicketId), t.fromEmail, t.toEmail])} />
          </Section>

          <Section title="Revendas" count={s.revendas.length}>
            <SimpleTable
              columns={["Anunciado em", "Ingresso", "Papel da conta", { label: "Preço original", align: "right", num: true }, { label: "Preço de revenda", align: "right", num: true }, "Situação", "Vendido em"]}
              empty="Nenhuma revenda"
              rows={s.revendas.map((r) => [dateTime(r.createdAt), ticketLabel(r.userTicketId), r.originalOwnerId === account.userId ? "Vendedor" : "Comprador", money(r.originalPrice), money(r.resalePrice), RESALE_STATUS_LABEL[r.status] ?? text(null), dateTime(r.soldAt)])}
            />
          </Section>
        </TabsContent>

        <TabsContent value="compras">
          <SimpleTable
            columns={["Pedido", "Itens", { label: "Valor", align: "right", num: true }, "Pagamento", "Situação", "Criado em", "Pago em", "Estorno"]}
            empty="Esta conta não tinha pedidos"
            emptyIcon="cart"
            rows={s.pedidos.map((o) => {
              const meta = metaOf(ORDER_STATUS_META, o.status as number);
              return [
                mono(o.code),
                <div key="i" className="space-y-0.5">
                  {(o.items ?? []).map((item: Row, i: number) => (
                    <p key={i}>
                      {item.quantity}x {text(item.ticket?.nome)}
                      <span className="text-caption text-muted-foreground"> · {text(item.ticket?.event?.nome)}</span>
                    </p>
                  ))}
                </div>,
                money(o.totalValue),
                o.paymentMethod ? `${o.paymentMethod === "pix" ? "Pix" : "Cartão"}${o.installments > 1 ? ` em ${o.installments}x` : ""}` : text(null),
                <StatusBadge key="s" tone={meta.tone}>
                  {meta.label}
                </StatusBadge>,
                dateTime(o.createdAt),
                dateTime(o.paidAt),
                (o.refunds ?? []).length ? (o.refunds as Row[]).map((r) => `${formatBRL((r.sentAmountCents ?? r.requestedAmountCents) / 100)} (${r.status})`).join(", ") : text(null),
              ];
            })}
          />
        </TabsContent>

        <TabsContent value="organizacoes" className="space-y-6">
          {s.organizacoes.length === 0 ? <EmptyState icon="building" title="Esta conta não era dona de nenhuma organização" /> : null}

          {s.organizacoes.map((org) => (
            <Section key={org.id} title={org.nome} count={org.eventos?.length ?? 0}>
              <p className="text-caption text-muted-foreground">
                {org.slug ? `nokta.live/${org.slug} · ` : ""}criada em {formatDateTime(org.createdAt)} · {org._count?.members ?? 0} membro(s) · apagada junto com a conta
              </p>
              <SimpleTable
                columns={["Evento", "Data", "Situação"]}
                empty="Esta organização não tinha eventos"
                emptyIcon="calendar"
                rows={(org.eventos ?? []).map((e: Row) => {
                  const meta = metaOf(EVENT_STATUS_META, e.status as number);
                  return [e.nome, e.data ? formatDateUTC(e.data) : text(null), <StatusBadge key="s" tone={meta.tone}>{meta.label}</StatusBadge>];
                })}
              />
            </Section>
          ))}

          {s.participacoes.length > 0 ? (
            <Section title="Participava de outras organizações" count={s.participacoes.length}>
              <SimpleTable columns={["Organização", "Papel", "Situação", "Desde"]} empty="" rows={s.participacoes.map((m) => [m.organization?.nome, m.role, m.status, dateTime(m.createdAt)])} />
            </Section>
          ) : null}

          {account.summary?.apagados && Object.keys(account.summary.apagados).length > 0 ? (
            <Section title="Registros apagados na exclusão">
              <SimpleTable columns={["Tabela", { label: "Linhas apagadas", align: "right", num: true }]} empty="" rows={Object.entries(account.summary.apagados as Record<string, number>).map(([table, count]) => [mono(table), count])} />
            </Section>
          ) : null}
        </TabsContent>

        <TabsContent value="historico">
          <SimpleTable
            columns={["Quando", "Ação", "Detalhe", "Quem fez"]}
            empty="Nenhuma ação registrada pra esta conta"
            emptyIcon="file-lines"
            rows={s.auditoria.map((log) => {
              const changes = changesOf(log.metadata);
              const meta = metaOf(AUDIT_ACTION_META, log.action as string);
              return [
                dateTime(log.createdAt),
                <StatusBadge key="a" tone={meta.tone} dot={false}>
                  {meta.label}
                </StatusBadge>,
                changes.length ? (
                  <div key="d" className="space-y-0.5">
                    {changes.map((c, i) => (
                      <p key={i}>
                        {c.field}: {text(c.de)} → {text(c.para)}
                      </p>
                    ))}
                  </div>
                ) : log.metadata && Object.keys(log.metadata).length ? (
                  <span key="d" className="break-all font-mono text-caption text-muted-foreground">
                    {JSON.stringify(log.metadata)}
                  </span>
                ) : (
                  text(null)
                ),
                author(log),
              ];
            })}
          />
        </TabsContent>

        <TabsContent value="acessos" className="space-y-6">
          <Section title="Sessões de login" count={s.sessoes.length}>
            <SimpleTable columns={["Início", "Encerrada", "Motivo", "IP", "Dispositivo"]} empty="Nenhuma sessão registrada" rows={s.sessoes.map((x) => [dateTime(x.createdAt), dateTime(x.revokedAt), text(x.revokedReason), text(x.ip), <span key="u" className="break-all text-caption text-muted-foreground">{text(x.userAgent)}</span>])} />
          </Section>

          <Section title="Eventos de segurança" count={s.seguranca.length}>
            <SimpleTable columns={["Quando", "Tipo", "IP"]} empty="Nenhum evento de segurança" emptyIcon="shield" rows={s.seguranca.map((x) => [dateTime(x.createdAt), mono(x.type), text(x.ip)])} />
          </Section>

          <Section title="Mensagens enviadas" count={s.comunicacoes.length}>
            <SimpleTable columns={["Quando", "Canal", "Tipo", "Destino", "Resultado"]} empty="Nenhuma mensagem registrada" emptyIcon="message" rows={s.comunicacoes.map((x) => [dateTime(x.createdAt), x.channel, x.type, x.recipient, x.status])} />
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
