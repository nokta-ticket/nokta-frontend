"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api, { getErrorMessage } from "@/lib/axios";

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

const ORDER_STATUS: Record<number, [string, string]> = {
  1: ["Pendente", "bg-yellow-100 text-yellow-700"],
  2: ["Pago", "bg-green-100 text-green-700"],
  3: ["Cancelado", "bg-gray-100 text-gray-600"],
  4: ["Falhou", "bg-red-100 text-red-700"],
  5: ["Reservado", "bg-blue-100 text-blue-700"],
};

const TICKET_STATUS: Record<number, [string, string]> = {
  1: ["Não utilizado", "bg-gray-100 text-gray-700"],
  2: ["Utilizado", "bg-green-100 text-green-700"],
  3: ["Em revenda", "bg-blue-100 text-blue-700"],
  4: ["Transferido", "bg-violet-100 text-violet-700"],
};

const RESALE_STATUS: Record<number, string> = { 1: "Anunciado", 2: "Vendido", 3: "Cancelado", 4: "Expirado" };
const EVENT_STATUS: Record<number, string> = { 1: "Rascunho", 2: "Publicado", 3: "Cancelado", 4: "Finalizado" };
const ROLE_LABEL: Record<number, string> = { 1: "Usuário", 2: "Usuário", 3: "Produtor" };

const ACTION_LABELS: Record<string, string> = {
  USER_DADOS_ALTERADOS: "Dados alterados",
  USER_EDITADO: "Dados editados pelo admin",
  USER_BLOQUEADO: "Conta bloqueada",
  USER_DESBLOQUEADO: "Conta desbloqueada",
  USER_ATIVADO: "Conta ativada",
  USER_DESATIVADO: "Conta desativada",
  USER_EXCLUIDO: "Conta excluída",
  USER_EXCLUIDO_COMPLETO: "Conta excluída",
  SESSOES_INVALIDADAS: "Sessões invalidadas",
  INGRESSO_TRANSFERIDO: "Ingresso transferido",
};

const FIELD_LABELS: Record<string, string> = {
  nome: "Nome",
  sobrenome: "Sobrenome",
  email: "E-mail",
  telefone: "Telefone",
  cpf: "CPF",
  cnpj: "CNPJ",
  dataNascimento: "Data de nascimento",
  tipoPessoa: "Tipo de pessoa",
  chavePix: "Chave Pix",
  nomeArtistico: "Nome artístico",
  nivelProdutor: "Nível de produtor",
};

const dateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("pt-BR") : "—");
const dateOnly = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";
const money = (value: unknown) =>
  `R$ ${Number(value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const text = (value: unknown) => (value === null || value === undefined || value === "" ? "—" : String(value));

function StatusBadge({ entry }: { entry?: [string, string] }) {
  if (!entry) return <span className="text-sm text-muted-foreground">—</span>;
  return <Badge className={`rounded-full px-3 py-1 text-xs ${entry[1]}`}>{entry[0]}</Badge>;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">
        {title}
        {count !== undefined ? <span className="ml-2 text-sm font-normal text-muted-foreground">{count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

function DataTable({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {head.map((h) => (
              <TableHead key={h} className="whitespace-nowrap px-4 py-3">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={head.length} className="px-4 py-6 text-center text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((cells, i) => (
              <TableRow key={i} className="border-b">
                {cells.map((cell, j) => (
                  <TableCell key={j} className="px-4 py-3 text-sm">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** "E-mail: antigo → novo" para cada dado alterado num registro de auditoria. */
function changesOf(metadata: Row | null): { field: string; de: unknown; para: unknown }[] {
  const changes = metadata?.alteracoes;
  if (!changes || typeof changes !== "object") return [];
  return Object.entries(changes as Record<string, Row>).map(([field, value]) => ({
    field: FIELD_LABELS[field] ?? field,
    de: value?.de,
    para: value?.para,
  }));
}

export default function ContaExcluidaPage() {
  const { id } = useParams();
  const [account, setAccount] = useState<DeletedAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/admin/contas-excluidas/${id}`)
      .then((res) => setAccount(res.data))
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar esta conta.")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold text-gray-700">{error ?? "Conta não encontrada."}</p>
        <Link href="/admin/contas-excluidas" className="text-sm text-violet-600 hover:underline">
          Voltar para Contas excluídas
        </Link>
      </div>
    );
  }

  const s = account.snapshot;
  const conta = s.conta ?? {};
  const ticketById = new Map(s.ingressos.map((t) => [t.id, t]));
  const ticketLabel = (ticketId: number) => {
    const ticket = ticketById.get(ticketId);
    return ticket ? `${ticket.code} · ${ticket.ticket?.event?.nome ?? "evento"}` : `Ingresso #${ticketId}`;
  };
  const endereco = [
    conta.enderecoLogradouro,
    conta.enderecoNumero,
    conta.enderecoBairro,
    conta.enderecoCidade,
    conta.enderecoUf,
    conta.enderecoCep,
  ]
    .filter(Boolean)
    .join(", ");
  const dataChanges = s.auditoria.filter((log) => changesOf(log.metadata).length > 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/contas-excluidas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-violet-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Contas excluídas
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-xl font-bold text-gray-900">{account.nome || "Sem nome"}</h1>
          <p className="break-all text-sm text-muted-foreground">{account.email}</p>
          <p className="text-xs text-muted-foreground">
            Excluída em {dateTime(account.deletedAt)} por {account.deletedByEmail ?? "—"} · conta nº {account.userId}
          </p>
        </div>
        <Badge className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Excluída</Badge>
      </div>

      <Tabs defaultValue="conta">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="ingressos">Ingressos ({s.ingressos.length})</TabsTrigger>
          <TabsTrigger value="compras">Compras ({s.pedidos.length})</TabsTrigger>
          <TabsTrigger value="organizacoes">Organizações ({s.organizacoes.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="acessos">Acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nome" value={text([conta.nome, conta.sobrenome].filter(Boolean).join(" "))} />
            <Field label="E-mail" value={text(conta.email)} />
            <Field
              label="Telefone"
              value={`${text(conta.telefone)}${conta.telefone ? (conta.telefoneVerificado ? " (verificado)" : " (não verificado)") : ""}`}
            />
            <Field label="CPF" value={text(conta.cpf)} />
            <Field label="CNPJ" value={text(conta.cnpj)} />
            <Field label="Data de nascimento" value={dateOnly(conta.dataNascimento)} />
            <Field label="Tipo da conta" value={ROLE_LABEL[conta.role?.role] ?? "Usuário"} />
            <Field label="Situação na exclusão" value={conta.bloqueado ? "Bloqueada" : conta.ativo ? "Ativa" : "Inativa"} />
            <Field label="Cadastro" value={dateTime(conta.createdAt)} />
            <Field label="Endereço" value={text(endereco)} />
            <Field label="Chave Pix" value={text(conta.chavePix)} />
            <Field label="Login social" value={text(conta.oauthProvider)} />
          </div>

          <Section title="Mudanças de dados" count={dataChanges.length}>
            <DataTable
              head={["Quando", "Dado", "De", "Para", "Quem alterou"]}
              empty="Nenhuma mudança de dados registrada para esta conta."
              rows={dataChanges.flatMap((log) =>
                changesOf(log.metadata).map((change) => [
                  dateTime(log.createdAt),
                  change.field,
                  text(change.de),
                  text(change.para),
                  log.autor?.propriaConta ? "A própria conta" : text(log.autor?.email ?? log.autor?.nome),
                ]),
              )}
            />
          </Section>
        </TabsContent>

        <TabsContent value="ingressos" className="mt-4 space-y-6">
          <Section title="Ingressos">
            <DataTable
              head={["Código", "Evento", "Tipo", "Valor", "Situação", "Pedido", "Emitido em"]}
              empty="Esta conta não tinha ingressos."
              rows={s.ingressos.map((t) => [
                <span key="c" className="font-mono text-xs">{t.code}</span>,
                <div key="e">
                  <p>{text(t.ticket?.event?.nome)}</p>
                  <p className="text-xs text-muted-foreground">{dateOnly(t.ticket?.event?.data)}</p>
                </div>,
                text(t.ticket?.nome),
                money(t.ticket?.valor),
                <div key="s" className="flex flex-wrap gap-1">
                  <StatusBadge entry={TICKET_STATUS[t.status]} />
                  {t.bloqueado ? (
                    <Badge className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Bloqueado</Badge>
                  ) : null}
                </div>,
                <span key="o" className="font-mono text-xs">
                  {text(t.order?.code)}
                  {t.compradoPelaConta ? "" : " (recebido)"}
                </span>,
                dateTime(t.createdAt),
              ])}
            />
          </Section>

          <Section title="Movimentação dos ingressos" count={s.historicoIngressos.length}>
            <DataTable
              head={["Quando", "Ingresso", "Registro", "IP"]}
              empty="Nenhuma movimentação registrada."
              rows={s.historicoIngressos.map((h) => [
                dateTime(h.createdAt),
                ticketLabel(h.ticketId),
                <span key="t" className="font-mono text-xs">{h.eventType}</span>,
                text(h.ip),
              ])}
            />
          </Section>

          <Section title="Transferências" count={s.transferencias.length}>
            <DataTable
              head={["Quando", "Ingresso", "De", "Para"]}
              empty="Nenhuma transferência."
              rows={s.transferencias.map((t) => [
                dateTime(t.createdAt),
                ticketLabel(t.userTicketId),
                t.fromEmail,
                t.toEmail,
              ])}
            />
          </Section>

          <Section title="Revendas" count={s.revendas.length}>
            <DataTable
              head={["Anunciado em", "Ingresso", "Papel da conta", "Preço original", "Preço de revenda", "Situação", "Vendido em"]}
              empty="Nenhuma revenda."
              rows={s.revendas.map((r) => [
                dateTime(r.createdAt),
                ticketLabel(r.userTicketId),
                r.originalOwnerId === account.userId ? "Vendedor" : "Comprador",
                money(r.originalPrice),
                money(r.resalePrice),
                RESALE_STATUS[r.status] ?? "—",
                dateTime(r.soldAt),
              ])}
            />
          </Section>
        </TabsContent>

        <TabsContent value="compras" className="mt-4">
          <DataTable
            head={["Pedido", "Itens", "Valor", "Pagamento", "Situação", "Criado em", "Pago em", "Estorno"]}
            empty="Esta conta não tinha pedidos."
            rows={s.pedidos.map((o) => [
              <span key="c" className="font-mono text-xs">{o.code}</span>,
              <div key="i" className="space-y-0.5">
                {(o.items ?? []).map((item: Row, i: number) => (
                  <p key={i}>
                    {item.quantity}x {text(item.ticket?.nome)}
                    <span className="text-xs text-muted-foreground"> · {text(item.ticket?.event?.nome)}</span>
                  </p>
                ))}
              </div>,
              money(o.totalValue),
              o.paymentMethod
                ? `${o.paymentMethod === "pix" ? "Pix" : "Cartão"}${o.installments > 1 ? ` em ${o.installments}x` : ""}`
                : "—",
              <StatusBadge key="s" entry={ORDER_STATUS[o.status]} />,
              dateTime(o.createdAt),
              dateTime(o.paidAt),
              (o.refunds ?? []).length
                ? (o.refunds as Row[])
                    .map((r) => `${money((r.sentAmountCents ?? r.requestedAmountCents) / 100)} (${r.status})`)
                    .join(", ")
                : "—",
            ])}
          />
        </TabsContent>

        <TabsContent value="organizacoes" className="mt-4 space-y-6">
          {s.organizacoes.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground shadow-sm">
              Esta conta não era dona de nenhuma organização.
            </div>
          ) : null}

          {s.organizacoes.map((org) => (
            <Section key={org.id} title={org.nome} count={org.eventos?.length ?? 0}>
              <p className="text-xs text-muted-foreground">
                {org.slug ? `nokta.live/${org.slug} · ` : ""}criada em {dateTime(org.createdAt)} ·{" "}
                {org._count?.members ?? 0} membro(s) · apagada junto com a conta
              </p>
              <DataTable
                head={["Evento", "Data", "Situação"]}
                empty="Esta organização não tinha eventos."
                rows={(org.eventos ?? []).map((e: Row) => [e.nome, dateOnly(e.data), EVENT_STATUS[e.status] ?? "—"])}
              />
            </Section>
          ))}

          {s.participacoes.length > 0 ? (
            <Section title="Participava de outras organizações" count={s.participacoes.length}>
              <DataTable
                head={["Organização", "Papel", "Situação", "Desde"]}
                empty=""
                rows={s.participacoes.map((m) => [m.organization?.nome, m.role, m.status, dateTime(m.createdAt)])}
              />
            </Section>
          ) : null}

          {account.summary?.apagados && Object.keys(account.summary.apagados).length > 0 ? (
            <Section title="Registros apagados na exclusão">
              <DataTable
                head={["Tabela", "Linhas apagadas"]}
                empty=""
                rows={Object.entries(account.summary.apagados as Record<string, number>).map(([table, count]) => [
                  <span key="t" className="font-mono text-xs">{table}</span>,
                  count,
                ])}
              />
            </Section>
          ) : null}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <DataTable
            head={["Quando", "Ação", "Detalhe", "Quem fez"]}
            empty="Nenhuma ação registrada para esta conta."
            rows={s.auditoria.map((log) => {
              const changes = changesOf(log.metadata);
              return [
                dateTime(log.createdAt),
                ACTION_LABELS[log.action] ?? log.action,
                changes.length ? (
                  <div key="d" className="space-y-0.5">
                    {changes.map((c, i) => (
                      <p key={i}>
                        {c.field}: {text(c.de)} → {text(c.para)}
                      </p>
                    ))}
                  </div>
                ) : log.metadata && Object.keys(log.metadata).length ? (
                  <span key="d" className="break-all text-xs text-gray-500">{JSON.stringify(log.metadata)}</span>
                ) : (
                  "—"
                ),
                log.autor?.propriaConta ? "A própria conta" : text(log.autor?.email ?? log.autor?.nome),
              ];
            })}
          />
        </TabsContent>

        <TabsContent value="acessos" className="mt-4 space-y-6">
          <Section title="Sessões de login" count={s.sessoes.length}>
            <DataTable
              head={["Início", "Encerrada", "Motivo", "IP", "Dispositivo"]}
              empty="Nenhuma sessão registrada."
              rows={s.sessoes.map((x) => [
                dateTime(x.createdAt),
                dateTime(x.revokedAt),
                text(x.revokedReason),
                text(x.ip),
                <span key="u" className="break-all text-xs text-muted-foreground">{text(x.userAgent)}</span>,
              ])}
            />
          </Section>

          <Section title="Eventos de segurança" count={s.seguranca.length}>
            <DataTable
              head={["Quando", "Tipo", "IP"]}
              empty="Nenhum evento de segurança."
              rows={s.seguranca.map((x) => [
                dateTime(x.createdAt),
                <span key="t" className="font-mono text-xs">{x.type}</span>,
                text(x.ip),
              ])}
            />
          </Section>

          <Section title="Mensagens enviadas" count={s.comunicacoes.length}>
            <DataTable
              head={["Quando", "Canal", "Tipo", "Destino", "Resultado"]}
              empty="Nenhuma mensagem registrada."
              rows={s.comunicacoes.map((x) => [dateTime(x.createdAt), x.channel, x.type, x.recipient, x.status])}
            />
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
