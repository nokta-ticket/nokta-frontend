"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/context/OrganizationContext";
import { periodLabel, periodToFinanceParams, usePeriod, type PeriodKey } from "@/context/PeriodContext";
import { useStepUp } from "@/components/session/step-up-modal";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { STEP_UP_TOKEN_HEADER } from "@/services/step-up";
import { ticketsStatementApi, type StatementRow, type StatementRowStatus, type StatementRowType, type TicketsEventBalance, type TicketsFinanceOverview, type TicketsStatementParams, type TicketsStatementSummary } from "@/services/tickets-finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DOTTED, FeeLine, HoverDetail, InfoTip, brl, fmtDate, fmtDay, fmtDayShort, fmtTime } from "../_components/finance-ui";

type TabKey = "statement" | "events" | "withdrawals" | "chargebacks";

const TYPE_META: Record<StatementRowType, { label: string; tone: Tone }> = {
  SALE: { label: "Venda", tone: "success" },
  REFUND: { label: "Estorno", tone: "danger" },
  CHARGEBACK: { label: "Contestação", tone: "danger" },
  WITHDRAWAL: { label: "Saque", tone: "brand" },
};
// "Em custódia" aparece em quase toda linha: neutro. Cor só onde é exceção.
const STATUS_META: Record<StatementRowStatus, { label: string; tone: Tone }> = {
  CUSTODY: { label: "Em custódia", tone: "neutral" },
  RELEASED: { label: "Liberado", tone: "success" },
  COMPLETED: { label: "Concluído", tone: "neutral" },
  IN_PROGRESS: { label: "Em andamento", tone: "info" },
  DEBITED: { label: "Descontado", tone: "danger" },
  FAILED: { label: "Falhou", tone: "danger" },
};

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
];

function describe(row: StatementRow): string {
  if (row.type === "SALE") return `Venda de ${row.quantity ?? 1} ingresso${(row.quantity ?? 1) > 1 ? "s" : ""}`;
  if (row.type === "REFUND") return "Estorno de pedido";
  if (row.type === "CHARGEBACK") return "Contestação no cartão";
  return "Saque para o Pix";
}

const keys = {
  overview: (orgId: number, params: object) => ["tickets-finance", orgId, "overview", params] as const,
  statement: (orgId: number, params: object) => ["tickets-finance", orgId, "statement", params] as const,
};

// ── Detalhe das taxas ──
function RowFees({ row }: { row: StatementRow }) {
  const f = row.fees;
  if (row.type === "REFUND") {
    return (
      <div className="space-y-2.5">
        <p className="font-semibold text-foreground">Estorno {row.reference}</p>
        {f.commissionCents !== 0 && <FeeLine title="Comissão Nokta devolvida" hint={`${f.commissionPercent}% · volta para você`} value={brl(f.commissionCents)} />}
        {f.buyerServiceFeeCents !== 0 && <FeeLine title="Taxa de serviço" hint="Devolvida ao comprador pela Nokta" value={brl(f.buyerServiceFeeCents)} muted />}
      </div>
    );
  }
  if (row.type === "CHARGEBACK") {
    return (
      <div className="space-y-2.5">
        <p className="font-semibold text-foreground">Contestação {row.reference}</p>
        <FeeLine title="Processamento Pagar.me" hint="Não é devolvido na contestação" value={brl(f.producerGatewayFeeCents)} />
        <FeeLine title="Taxa de serviço devolvida" hint="Já somada no valor bruto da linha" value={brl(f.buyerServiceFeeCents)} muted />
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <div>
        <p className="font-semibold text-foreground">Taxas do pedido {row.reference}</p>
        <p className="text-caption text-muted-foreground">
          {row.quantity ?? 1} ingresso{(row.quantity ?? 1) > 1 ? "s" : ""} · {brl(row.grossCents)}
        </p>
      </div>
      {f.commissionCents !== 0 && <FeeLine title="Comissão Nokta" hint={`${f.commissionPercent}% · descontada do seu valor`} value={brl(f.commissionCents)} />}
      <FeeLine title="Taxa de serviço" hint="Paga pelo comprador, por cima do ingresso" value={brl(f.buyerServiceFeeCents)} muted />
      <FeeLine title="Processamento Pagar.me" hint="Pago pelo comprador, por cima do ingresso" value={brl(f.buyerGatewayFeeCents)} muted />
      <div className="flex justify-between gap-3 border-t border-border pt-2.5 font-semibold text-foreground">
        <span>Descontado de você</span>
        <span className="tnum">{brl(row.feeCents)}</span>
      </div>
    </div>
  );
}

function SummaryFees({ summary, label }: { summary: TicketsStatementSummary; label: string }) {
  const f = summary.fees;
  return (
    <div className="space-y-2.5">
      <div>
        <p className="font-semibold text-foreground">Taxas do período</p>
        <p className="text-caption text-muted-foreground">{label}</p>
      </div>
      {f.commissionCents !== 0 && <FeeLine title="Comissão Nokta" hint="Descontada do seu valor (já com estornos)" value={brl(f.commissionCents)} />}
      {f.producerGatewayFeeCents !== 0 && <FeeLine title="Processamento em contestações" hint="Não devolvido pela Pagar.me" value={brl(f.producerGatewayFeeCents)} />}
      <FeeLine title="Taxa de serviço" hint="Paga pelos compradores, por cima do ingresso" value={brl(f.buyerServiceFeeCents)} muted />
      <FeeLine title="Processamento Pagar.me" hint="Pago pelos compradores, por cima do ingresso" value={brl(f.buyerGatewayFeeCents)} muted />
      <div className="flex justify-between gap-3 border-t border-border pt-2.5 font-semibold text-foreground">
        <span>Descontado de você</span>
        <span className="tnum">{brl(summary.feeCents)}</span>
      </div>
    </div>
  );
}

function CardLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="press flex items-center gap-1 rounded-md text-left text-caption font-medium text-brand hover:underline">
      <span>{children}</span>
      <Icon name="chevron-right" size={10} />
    </button>
  );
}

function SummaryItem({ icon, label, value, hint, tone }: { icon: IconName; label: ReactNode; value: ReactNode; hint: string; tone?: "in" | "out" }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-4 sm:px-5">
      <div className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
        <Icon name={icon} size={12} />
        {label}
      </div>
      <div className={cn("text-stat font-medium leading-none tracking-tight tnum", tone === "in" ? "text-money-in" : tone === "out" ? "text-money-out" : "text-foreground")}>{value}</div>
      <p className="text-caption text-subtle-foreground">{hint}</p>
    </div>
  );
}

export default function TicketsFinanceiroPage({ contextSwitch }: { contextSwitch?: ReactNode }) {
  const { currentOrg } = useOrganizations();
  const { period, setPeriod } = usePeriod();
  const { openStepUp } = useStepUp();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id ?? null;

  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<TabKey>("statement");
  const [type, setType] = useState<StatementRowType | "">("");
  const [status, setStatus] = useState<StatementRowStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sort, setSort] = useState<"date" | "gross" | "net">("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [detail, setDetail] = useState<StatementRow | null>(null);
  const [chooseOpen, setChooseOpen] = useState(false);
  const [requestingEventId, setRequestingEventId] = useState<number | null>(null);

  useEffect(() => {
    setEventId(undefined);
    setPage(1);
  }, [orgId]);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const periodParams = periodToFinanceParams(period);
  const label = periodLabel(period);

  const overviewParams = { ...periodParams, eventId };
  const overview = useQuery({
    queryKey: keys.overview(orgId ?? -1, overviewParams),
    queryFn: () => ticketsStatementApi.getOverview(orgId as number, overviewParams),
    enabled: orgId !== null,
  });

  const statementParams: TicketsStatementParams = { ...periodParams, eventId, type: type || undefined, status: status || undefined, search: search || undefined, page, perPage, sort, dir };
  const statement = useQuery({
    queryKey: keys.statement(orgId ?? -1, statementParams),
    queryFn: () => ticketsStatementApi.getStatement(orgId as number, statementParams),
    enabled: orgId !== null,
    placeholderData: (prev) => prev,
  });

  const historyType: StatementRowType | null = tab === "withdrawals" ? "WITHDRAWAL" : tab === "chargebacks" ? "CHARGEBACK" : null;
  const historyParams: TicketsStatementParams = { allTime: true, eventId, type: historyType ?? undefined, perPage: 100 };
  const history = useQuery({
    queryKey: keys.statement(orgId ?? -1, historyParams),
    queryFn: () => ticketsStatementApi.getStatement(orgId as number, historyParams),
    enabled: orgId !== null && historyType !== null,
  });

  // Lista de eventos do seletor: sempre a organização inteira, nunca só o filtrado.
  const allEvents = useQuery({
    queryKey: keys.overview(orgId ?? -1, { all: true }),
    queryFn: () => ticketsStatementApi.getOverview(orgId as number, { quickPeriod: "TODAY" }),
    enabled: orgId !== null,
    staleTime: 60_000,
  });

  const data: TicketsFinanceOverview | undefined = overview.data;
  const withdrawable = useMemo(() => (data?.events ?? []).filter((e) => e.availableCents > 0), [data]);
  const active = data?.activeWithdrawal ?? null;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["tickets-finance", orgId] });
  }

  /**
   * Saque é por evento no backend (uma solicitação ativa por organização).
   * Fluxo em 2 passos já existente: solicitar (reserva, devolve preview) →
   * step-up com o preview → confirmar (debita de verdade).
   */
  async function requestWithdrawal(target: TicketsEventBalance) {
    if (!orgId) return;
    setRequestingEventId(target.eventId);
    try {
      const requestRes = await api.post(`/produtor/eventos/${target.eventId}/solicitar-saque`);
      const saque = requestRes.data?.saque;
      const preview = requestRes.data?.preview;
      if (!saque?.id) throw new Error("Resposta inesperada ao solicitar o saque.");
      const stepUpToken = await openStepUp({
        action: "WITHDRAWAL_CONFIRM",
        organizationId: orgId,
        actionParams: { withdrawalId: saque.id, organizationId: orgId },
        title: "Confirmar saque",
        description: "Revise os dados antes de autorizar. Esta ação move dinheiro real da sua organização.",
        preview: [
          { label: "Evento", value: target.eventName },
          { label: "Valor solicitado", value: brl(Math.round(Number(saque.amount) * 100)) },
          { label: "Taxa de transferência", value: preview ? brl(preview.transferFeeCents) : "Não informada" },
          { label: "Valor líquido estimado", value: preview ? brl(preview.estimatedNetAmountCents) : "Não informado" },
          { label: "Conta de destino", value: preview?.bankAccountLast4 ? `•••• ${preview.bankAccountLast4}` : "Chave Pix cadastrada" },
        ],
      });
      await api.post(`/produtor/eventos/${target.eventId}/confirmar-saque`, { withdrawalId: saque.id, organizationId: orgId }, { headers: { [STEP_UP_TOKEN_HEADER]: stepUpToken } });
      toast.success("Saque confirmado. O valor cai no Pix em até 2 dias úteis.");
      setChooseOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message !== "Verificação de segurança cancelada.") {
        toast.error(getErrorMessage(error, "Não foi possível solicitar o saque."));
      }
    } finally {
      setRequestingEventId(null);
      invalidate();
    }
  }

  function onSacar() {
    if (withdrawable.length === 1) void requestWithdrawal(withdrawable[0]);
    else setChooseOpen(true);
  }

  function toggleSort(key: "date" | "gross" | "net") {
    if (sort === key) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(key);
      setDir("desc");
    }
    setPage(1);
  }

  if (!orgId) return null;

  const forbidden = (overview.error as { response?: { status?: number } } | null)?.response?.status === 403;
  const canWithdraw = !active && withdrawable.length > 0 && requestingEventId === null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        actions={
          <>
            {contextSwitch}
            <NativeSelect
              aria-label="Evento"
              value={eventId ?? ""}
              onChange={(e) => {
                setEventId(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="w-full sm:w-[260px]"
            >
              <option value="">Todos os eventos</option>
              {(allEvents.data?.events ?? []).map((e) => (
                <option key={e.eventId} value={e.eventId}>
                  {e.eventName}
                </option>
              ))}
            </NativeSelect>
          </>
        }
      />

      {forbidden ? (
        <EmptyState icon="lock" title="Sem acesso ao financeiro" description="Só o proprietário ou um gerente do workspace vê o financeiro de ingressos." />
      ) : overview.isError ? (
        <ErrorState title="Não foi possível carregar o financeiro agora" onRetry={() => void overview.refetch()} />
      ) : !data ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      ) : (
        <>
          {/* Cards de saldo */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <StatCard className="card-accent" label="Saldo disponível" icon="wallet" format="currency" value={data.totals.availableCents / 100} hint={active ? "Novo saque liberado quando o atual concluir" : data.totals.availableCents > 0 ? "Disponível para sacar agora" : "Nada disponível pra saque agora"}>
              <div className="mt-1 flex items-center gap-2">
                <Button size="sm" leftIcon="money-transfer" onClick={onSacar} disabled={!canWithdraw} loading={requestingEventId !== null} title={!canWithdraw ? (active ? "Já existe um saque em andamento" : "Sem saldo liberado") : undefined}>
                  Sacar
                </Button>
                <InfoTip label="O que é saldo disponível" text="Dinheiro de eventos que já passaram da custódia. Você pode transferir para o seu Pix agora." />
              </div>
            </StatCard>
            <StatCard label="Em custódia" icon="lock" format="currency" value={data.totals.custodyCents / 100} hint="Libera alguns dias depois de cada evento">
              <CardLink onClick={() => setTab("events")}>{data.totals.custodyEventCount > 0 ? `${data.totals.custodyEventCount} evento${data.totals.custodyEventCount > 1 ? "s" : ""}${data.totals.nextReleaseAt ? ` · próxima liberação ${fmtDayShort(data.totals.nextReleaseAt)}` : ""}` : "Ver por evento"}</CardLink>
            </StatCard>
            <StatCard label="Saque em andamento" icon="money-transfer" format="currency" value={(active?.amountCents ?? 0) / 100} hint="A caminho do seu Pix">
              <CardLink onClick={() => setTab("withdrawals")}>{active ? `Solicitado em ${fmtDate(active.requestedAt).slice(0, 5)} · ver saques` : "Ver saques"}</CardLink>
            </StatCard>
            <StatCard label="Contestações" icon="warning" format="currency" value={Math.abs(data.chargebacks.totalCents) / 100} hint={data.chargebacks.count > 0 ? "Descontado do seu saldo" : "Nenhuma no período"}>
              <CardLink onClick={() => setTab("chargebacks")}>{data.chargebacks.count > 0 ? `${data.chargebacks.count} no período · ver detalhes` : "Ver histórico"}</CardLink>
            </StatCard>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="-mx-4 px-4 lg:mx-0 lg:px-0">
            <TabsList variant="line" aria-label="Seções do financeiro">
              <TabsTrigger value="statement">Extrato</TabsTrigger>
              <TabsTrigger value="events">Por evento</TabsTrigger>
              <TabsTrigger value="withdrawals">Saques</TabsTrigger>
              <TabsTrigger value="chargebacks">Contestações</TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "statement" && (
            <StatementTab
              summary={statement.data?.summary}
              rows={statement.data?.rows}
              total={statement.data?.total ?? 0}
              loading={statement.isLoading}
              fetching={statement.isFetching}
              label={label}
              period={period.key}
              onPeriod={(k) => {
                setPeriod({ key: k, range: { from: null, to: null } });
                setPage(1);
              }}
              type={type}
              onType={(v) => {
                setType(v);
                setPage(1);
              }}
              status={status}
              onStatus={(v) => {
                setStatus(v);
                setPage(1);
              }}
              searchInput={searchInput}
              onSearch={setSearchInput}
              page={page}
              perPage={perPage}
              onPage={setPage}
              onPerPage={(n) => {
                setPerPage(n);
                setPage(1);
              }}
              sort={sort}
              dir={dir}
              onSort={toggleSort}
              onOpen={setDetail}
              onClear={() => {
                setType("");
                setStatus("");
                setSearchInput("");
                setPage(1);
              }}
            />
          )}
          {tab === "events" && (
            <EventsTab
              events={data.events}
              onPick={(id) => {
                setEventId(id);
                setTab("statement");
                setPage(1);
              }}
            />
          )}
          {tab === "withdrawals" && <HistoryTable kind="withdrawals" rows={history.data?.rows} loading={history.isLoading} onOpen={setDetail} />}
          {tab === "chargebacks" && <HistoryTable kind="chargebacks" rows={history.data?.rows} loading={history.isLoading} onOpen={setDetail} />}
        </>
      )}

      <DetailSheet row={detail} onClose={() => setDetail(null)} />

      <Dialog open={chooseOpen} onOpenChange={setChooseOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>De qual evento você quer sacar?</DialogTitle>
            <DialogDescription>O saque é feito por evento. Depois que ele concluir, você pode sacar o próximo.</DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-2">
            {withdrawable.map((e) => (
              <button key={e.eventId} type="button" disabled={requestingEventId !== null} onClick={() => void requestWithdrawal(e)} className="press flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-2 disabled:opacity-60">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{e.eventName}</span>
                  <span className="block text-caption text-muted-foreground">Evento em {fmtDay(e.eventDate)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 font-semibold text-money-in tnum">
                  {requestingEventId === e.eventId ? <Icon name="loader" size={13} className="animate-spin" /> : null}
                  {brl(e.availableCents)}
                </span>
              </button>
            ))}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Aba Extrato ──
function StatementTab(props: {
  summary?: TicketsStatementSummary;
  rows?: StatementRow[];
  total: number;
  loading: boolean;
  fetching: boolean;
  label: string;
  period: PeriodKey;
  onPeriod: (k: PeriodKey) => void;
  type: StatementRowType | "";
  onType: (v: StatementRowType | "") => void;
  status: StatementRowStatus | "";
  onStatus: (v: StatementRowStatus | "") => void;
  searchInput: string;
  onSearch: (v: string) => void;
  page: number;
  perPage: number;
  onPage: (n: number) => void;
  onPerPage: (n: number) => void;
  sort: "date" | "gross" | "net";
  dir: "asc" | "desc";
  onSort: (k: "date" | "gross" | "net") => void;
  onOpen: (row: StatementRow) => void;
  onClear: () => void;
}) {
  const { summary, rows, total, page, perPage } = props;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const hasFilters = Boolean(props.type || props.status || props.searchInput);

  const sortHead = (key: "date" | "gross" | "net", label: string, align: "left" | "right" = "left") => (
    <DataTableHeadCell align={align}>
      <button type="button" onClick={() => props.onSort(key)} className={cn("inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-foreground", props.sort === key && "text-foreground")}>
        {label}
        <Icon name={props.sort === key ? (props.dir === "desc" ? "arrow-down" : "arrow-up") : "sort"} size={9} className={props.sort === key ? "text-brand" : "text-subtle-foreground"} />
      </button>
    </DataTableHeadCell>
  );

  return (
    <div className="space-y-4">
      {/* Resumo do período */}
      <Card aria-label="Resumo do período" className="fade-up">
        <CardContent className="grid grid-cols-2 divide-y divide-border p-0 sm:[&>*:nth-child(odd)]:border-r xl:grid-cols-4 xl:divide-y-0 xl:[&>*:not(:last-child)]:border-r">
          <SummaryItem icon="trend-up" label="Entradas" value={summary ? brl(summary.inCents) : "…"} hint="Vendas de ingressos" tone="in" />
          <SummaryItem icon="trend-down" label="Saídas" value={summary ? brl(summary.outCents) : "…"} hint="Estornos e contestações" tone={summary && summary.outCents !== 0 ? "out" : undefined} />
          <SummaryItem
            icon="receipt"
            label={
              <span className="flex items-center gap-1.5">
                Taxas
                {summary ? (
                  <HoverDetail label="Ver detalhe das taxas" trigger={<Icon name="info" size={12} className="text-subtle-foreground" />} className="flex h-4 w-4 items-center justify-center">
                    <SummaryFees summary={summary} label={props.label} />
                  </HoverDetail>
                ) : null}
              </span>
            }
            value={
              summary ? (
                <HoverDetail label="Ver detalhe das taxas" trigger={<span className={DOTTED}>{brl(summary.feeCents)}</span>} align="start">
                  <SummaryFees summary={summary} label={props.label} />
                </HoverDetail>
              ) : (
                "…"
              )
            }
            hint="Toque no valor pra ver cada taxa"
          />
          <SummaryItem icon="scale" label="Líquido" value={summary ? brl(summary.netCents) : "…"} hint="Entradas − saídas − taxas" />
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <SearchInput value={props.searchInput} onChange={props.onSearch} placeholder="Pedido ou comprador" className="w-full xl:max-w-md xl:flex-1" />
        <div className="grid grid-cols-3 gap-2 xl:flex">
          <NativeSelect aria-label="Período" value={props.period} onChange={(e) => props.onPeriod(e.target.value as PeriodKey)} className="xl:w-[170px]">
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
            {props.period === "custom" ? <option value="custom">{props.label}</option> : null}
          </NativeSelect>
          <NativeSelect aria-label="Tipo" value={props.type} onChange={(e) => props.onType(e.target.value as StatementRowType | "")} className="xl:w-[160px]">
            <option value="">Todos os tipos</option>
            <option value="SALE">Vendas</option>
            <option value="REFUND">Estornos</option>
            <option value="CHARGEBACK">Contestações</option>
            <option value="WITHDRAWAL">Saques</option>
          </NativeSelect>
          <NativeSelect aria-label="Status" value={props.status} onChange={(e) => props.onStatus(e.target.value as StatementRowStatus | "")} className="xl:w-[160px]">
            <option value="">Todos os status</option>
            <option value="CUSTODY">Em custódia</option>
            <option value="RELEASED">Liberado</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluído</option>
            <option value="DEBITED">Descontado</option>
          </NativeSelect>
        </div>
      </div>

      {props.loading && !rows ? (
        <Skeleton className="h-80 rounded-card" />
      ) : !rows || rows.length === 0 ? (
        <EmptyState icon="receipt" title={hasFilters ? "Nenhuma transação com esses filtros" : "Nenhuma transação no período"} description={hasFilters ? "Tente outro termo ou limpe os filtros." : "As vendas aparecem aqui assim que alguém comprar."} action={hasFilters ? <Button variant="outline" onClick={props.onClear}>Limpar filtros</Button> : undefined} />
      ) : (
        <DataTableShell
          className={cn(props.fetching && "opacity-80 transition-opacity")}
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  {sortHead("date", "Data")}
                  <DataTableHeadCell>Evento</DataTableHeadCell>
                  <DataTableHeadCell>Transação</DataTableHeadCell>
                  <DataTableHeadCell>Tipo</DataTableHeadCell>
                  {sortHead("gross", "Bruto", "right")}
                  <DataTableHeadCell align="right">Taxas</DataTableHeadCell>
                  {sortHead("net", "Líquido", "right")}
                  <DataTableHeadCell>Status</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.map((r, i) => (
                  <DataTableRow key={r.key} index={i} onClick={() => props.onOpen(r)}>
                    <DataTableCell className="whitespace-nowrap tnum">
                      {fmtDate(r.occurredAt)}
                      <span className="block text-caption text-muted-foreground">{fmtTime(r.occurredAt)}</span>
                    </DataTableCell>
                    <DataTableCell className="max-w-[220px] truncate">{r.eventName}</DataTableCell>
                    <DataTableCell>
                      <span className="block font-medium tnum">{r.reference}</span>
                      <span className="block text-caption text-muted-foreground">{describe(r)}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={TYPE_META[r.type].tone} dot={false}>
                        {TYPE_META[r.type].label}
                      </StatusBadge>
                    </DataTableCell>
                    <DataTableCell num>{brl(r.grossCents)}</DataTableCell>
                    <DataTableCell num className="text-muted-foreground" stopPropagation>
                      {r.type === "WITHDRAWAL" ? (
                        brl(0)
                      ) : (
                        <HoverDetail label={`Ver taxas do pedido ${r.reference}`} trigger={<span className={cn(DOTTED, "hover:text-foreground")}>{brl(r.feeCents)}</span>}>
                          <RowFees row={r} />
                        </HoverDetail>
                      )}
                    </DataTableCell>
                    <DataTableCell num className={cn("font-semibold", r.netCents > 0 ? "text-money-in" : r.netCents < 0 ? "text-money-out" : "")}>
                      {brl(r.netCents)}
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</StatusBadge>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {rows.map((r, i) => (
                <MobileCard
                  key={r.key}
                  index={i}
                  onClick={() => props.onOpen(r)}
                  title={r.reference}
                  subtitle={`${r.eventName} · ${fmtDate(r.occurredAt).slice(0, 5)} ${fmtTime(r.occurredAt)}`}
                  badge={<StatusBadge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</StatusBadge>}
                  meta={[
                    { label: "Tipo", value: TYPE_META[r.type].label },
                    { label: "Líquido", value: <span className={cn("font-semibold", r.netCents > 0 ? "text-money-in" : r.netCents < 0 ? "text-money-out" : "")}>{brl(r.netCents)}</span>, num: true },
                  ]}
                />
              ))}
            </MobileCardList>
          }
          footer={
            total > 0 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <NativeSelect aria-label="Itens por página" value={perPage} onChange={(e) => props.onPerPage(Number(e.target.value))} className="w-full sm:w-[150px] [&_select]:h-9 [&_select]:text-caption">
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                </NativeSelect>
                <DataTablePagination page={page} lastPage={pages} total={total} perPage={perPage} noun="transações" onPageChange={props.onPage} />
              </div>
            ) : undefined
          }
        />
      )}
    </div>
  );
}

// ── Aba Por evento ──
function EventsTab({ events, onPick }: { events: TicketsEventBalance[]; onPick: (eventId: number) => void }) {
  if (events.length === 0) {
    return <EmptyState icon="calendar" title="Nenhum evento com vendas" description="Quando seus eventos tiverem pagamentos confirmados, o saldo de cada um aparece aqui." />;
  }
  const t = (k: keyof TicketsEventBalance) => events.reduce((s, e) => s + (e[k] as number), 0);
  const situation = (e: TicketsEventBalance): { label: string; tone: Tone } => (e.released ? (e.availableCents > 0 ? { label: `Liberado em ${fmtDayShort(e.releaseAt)}`, tone: "success" } : { label: "Tudo sacado", tone: "neutral" }) : { label: `Em custódia até ${fmtDayShort(e.releaseAt)}`, tone: "neutral" });
  const muted = (v: number) => (v ? "" : "text-subtle-foreground");

  return (
    <div className="space-y-3">
      <DataTableShell
        maxHeight="none"
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Evento</DataTableHeadCell>
                <DataTableHeadCell>Situação</DataTableHeadCell>
                <DataTableHeadCell align="right">Vendas</DataTableHeadCell>
                <DataTableHeadCell align="right">Comissão</DataTableHeadCell>
                <DataTableHeadCell align="right">Estornos</DataTableHeadCell>
                <DataTableHeadCell align="right">Líquido</DataTableHeadCell>
                <DataTableHeadCell align="right">Sacado</DataTableHeadCell>
                <DataTableHeadCell align="right">Em saque</DataTableHeadCell>
                <DataTableHeadCell align="right">Custódia</DataTableHeadCell>
                <DataTableHeadCell align="right">Disponível</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {events.map((e, i) => {
                const s = situation(e);
                return (
                  <DataTableRow key={e.eventId} index={i} onClick={() => onPick(e.eventId)}>
                    <DataTableCell>
                      <span className="block font-medium">{e.eventName}</span>
                      <span className="block text-caption text-muted-foreground tnum">Evento em {fmtDay(e.eventDate)}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                    </DataTableCell>
                    <DataTableCell num>{brl(e.salesCents)}</DataTableCell>
                    <DataTableCell num className="text-muted-foreground">{brl(-e.commissionCents)}</DataTableCell>
                    <DataTableCell num className={e.refundsCents + e.chargebacksCents < 0 ? "text-money-out" : "text-subtle-foreground"}>{brl(e.refundsCents + e.chargebacksCents)}</DataTableCell>
                    <DataTableCell num className="font-semibold">{brl(e.netCents)}</DataTableCell>
                    <DataTableCell num className="text-muted-foreground">{brl(-e.withdrawnCents)}</DataTableCell>
                    <DataTableCell num className={e.inTransitCents ? "font-semibold text-brand" : "text-subtle-foreground"}>{brl(-e.inTransitCents)}</DataTableCell>
                    <DataTableCell num className={cn(e.custodyCents && "font-semibold", muted(e.custodyCents))}>{brl(e.custodyCents)}</DataTableCell>
                    <DataTableCell num className={cn(e.availableCents && "font-semibold text-money-in", muted(e.availableCents))}>{brl(e.availableCents)}</DataTableCell>
                  </DataTableRow>
                );
              })}
              <tr className="bg-surface-2/60 font-semibold">
                <DataTableCell>Total</DataTableCell>
                <DataTableCell />
                <DataTableCell num>{brl(t("salesCents"))}</DataTableCell>
                <DataTableCell num>{brl(-t("commissionCents"))}</DataTableCell>
                <DataTableCell num>{brl(t("refundsCents") + t("chargebacksCents"))}</DataTableCell>
                <DataTableCell num>{brl(t("netCents"))}</DataTableCell>
                <DataTableCell num>{brl(-t("withdrawnCents"))}</DataTableCell>
                <DataTableCell num>{brl(-t("inTransitCents"))}</DataTableCell>
                <DataTableCell num>{brl(t("custodyCents"))}</DataTableCell>
                <DataTableCell num className="text-money-in">{brl(t("availableCents"))}</DataTableCell>
              </tr>
            </DataTableBody>
          </DataTable>
        }
        mobile={
          <MobileCardList>
            {events.map((e, i) => {
              const s = situation(e);
              return <MobileCard key={e.eventId} index={i} onClick={() => onPick(e.eventId)} title={e.eventName} subtitle={`Evento em ${fmtDay(e.eventDate)}`} badge={<StatusBadge tone={s.tone}>{s.label}</StatusBadge>} meta={[{ label: e.released ? "Disponível" : "Em custódia", value: <span className="font-semibold">{brl(e.released ? e.availableCents : e.custodyCents)}</span>, num: true }, { label: "Líquido", value: brl(e.netCents), num: true }]} />;
            })}
          </MobileCardList>
        }
      />
      <p className="text-caption text-muted-foreground">Valores de agora, desde o início das vendas de cada evento. Toque num evento pra ver o extrato dele.</p>
    </div>
  );
}

// ── Abas Saques e Contestações ──
function HistoryTable({ kind, rows, loading, onOpen }: { kind: "withdrawals" | "chargebacks"; rows?: StatementRow[]; loading: boolean; onOpen: (r: StatementRow) => void }) {
  if (loading && !rows) return <Skeleton className="h-64 rounded-card" />;
  if (!rows || rows.length === 0) {
    return kind === "withdrawals" ? <EmptyState icon="money-transfer" title="Nenhum saque ainda" description="Quando você sacar o saldo de um evento, o saque aparece aqui com a situação." /> : <EmptyState icon="warning" title="Nenhuma contestação" description="Quando um comprador contestar uma compra no cartão, ela aparece aqui com o valor descontado." />;
  }
  const amount = (r: StatementRow) => brl(kind === "withdrawals" ? -r.netCents : r.netCents);
  return (
    <div className="space-y-3">
      <DataTableShell
        maxHeight="none"
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>{kind === "withdrawals" ? "Solicitado em" : "Data"}</DataTableHeadCell>
                <DataTableHeadCell>{kind === "withdrawals" ? "Saque" : "Pedido"}</DataTableHeadCell>
                <DataTableHeadCell>Evento</DataTableHeadCell>
                {kind === "chargebacks" ? <DataTableHeadCell>Motivo</DataTableHeadCell> : null}
                <DataTableHeadCell align="right">{kind === "withdrawals" ? "Valor" : "Descontado"}</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {rows.map((r, i) => (
                <DataTableRow key={r.key} index={i} onClick={() => onOpen(r)}>
                  <DataTableCell className="whitespace-nowrap tnum">
                    {fmtDate(r.occurredAt)} <span className="text-muted-foreground">{fmtTime(r.occurredAt)}</span>
                  </DataTableCell>
                  <DataTableCell className="font-medium tnum">{r.reference}</DataTableCell>
                  <DataTableCell>{r.eventName}</DataTableCell>
                  {kind === "chargebacks" ? <DataTableCell className={cn(!r.reason && "text-subtle-foreground")}>{r.reason ?? "Não informado pela operadora"}</DataTableCell> : null}
                  <DataTableCell num className={cn("font-semibold", kind === "chargebacks" && "text-money-out")}>
                    {amount(r)}
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</StatusBadge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        }
        mobile={
          <MobileCardList>
            {rows.map((r, i) => (
              <MobileCard key={r.key} index={i} onClick={() => onOpen(r)} title={r.reference} subtitle={`${r.eventName} · ${fmtDate(r.occurredAt)}`} badge={<StatusBadge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</StatusBadge>} meta={[{ label: kind === "withdrawals" ? "Valor" : "Descontado", value: <span className={cn("font-semibold", kind === "chargebacks" && "text-money-out")}>{amount(r)}</span>, num: true }, ...(kind === "chargebacks" ? [{ label: "Motivo", value: r.reason ?? "Não informado" }] : [])]} />
            ))}
          </MobileCardList>
        }
      />
      {kind === "chargebacks" ? <p className="text-caption text-muted-foreground">O motivo vem da operadora do cartão. Quando ela não informa, aparece “Não informado”.</p> : null}
    </div>
  );
}

// ── Detalhe lateral ──
function DetailLine({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4 border-b border-border py-2.5 last:border-0", strong && "font-semibold")}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground tnum">{value}</dd>
    </div>
  );
}

function DetailSheet({ row, onClose }: { row: StatementRow | null; onClose: () => void }) {
  const title = row ? `${TYPE_META[row.type].label} ${row.reference}` : "";
  return (
    <Sheet open={row !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right">
        {row ? (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <SheetBody className="text-sm">
              <div>
                <p className={cn("text-stat-lg font-medium leading-none tracking-tight tnum", row.netCents > 0 ? "text-money-in" : row.netCents < 0 ? "text-money-out" : "text-foreground")}>
                  {row.netCents > 0 ? "+ " : ""}
                  {brl(row.netCents)}
                </p>
                <p className="mt-2 text-caption text-muted-foreground">
                  {row.eventName} · {fmtDate(row.occurredAt)} às {fmtTime(row.occurredAt)}
                </p>
                <div className="mt-3">
                  <StatusBadge tone={STATUS_META[row.status].tone}>{STATUS_META[row.status].label}</StatusBadge>
                </div>
              </div>

              {row.type === "SALE" && (
                <>
                  <dl>
                    {row.buyerName ? <DetailLine label="Comprador" value={row.buyerName} /> : null}
                    <DetailLine label="Ingressos" value={row.quantity ?? 1} />
                    <DetailLine label="Valor dos ingressos" value={brl(row.grossCents)} />
                    {row.fees.commissionCents !== 0 && <DetailLine label={`Comissão Nokta (${row.fees.commissionPercent}%)`} value={brl(row.fees.commissionCents)} />}
                    <DetailLine label="Entra no seu saldo" value={brl(row.netCents)} strong />
                    {row.releaseAt ? <DetailLine label={row.status === "CUSTODY" ? "Libera em" : "Liberado em"} value={fmtDay(row.releaseAt)} /> : null}
                  </dl>
                  <div className="surface-inset rounded-xl px-4 py-3 text-caption leading-relaxed text-muted-foreground">
                    <p className="flex justify-between gap-3">
                      <span>Taxa de serviço + processamento</span>
                      <span className="font-medium text-foreground tnum">{brl(row.fees.buyerServiceFeeCents + row.fees.buyerGatewayFeeCents)}</span>
                    </p>
                    <p className="mt-1">Pagas pelo comprador, por cima do ingresso. Não saem do seu valor.</p>
                  </div>
                </>
              )}
              {row.type === "CHARGEBACK" && (
                <>
                  <dl>
                    <DetailLine label="Ingresso e taxa de serviço devolvidos" value={brl(row.grossCents)} />
                    <DetailLine label="Processamento Pagar.me" value={brl(row.fees.producerGatewayFeeCents)} />
                    <DetailLine label="Total descontado" value={brl(row.netCents)} strong />
                  </dl>
                  <dl>
                    {row.buyerName ? <DetailLine label="Comprador" value={row.buyerName} /> : null}
                    <DetailLine label="Ingressos cancelados" value={row.quantity ?? 1} />
                    <DetailLine label="Motivo" value={row.reason ?? "Não informado pela operadora"} />
                  </dl>
                  <p className="text-caption leading-relaxed text-muted-foreground">O comprador contestou a compra no banco ou no cartão. O ingresso foi cancelado e, pela regra atual, o produtor arca com o valor devolvido, incluindo a taxa de serviço e o processamento.</p>
                </>
              )}
              {row.type === "REFUND" && (
                <dl>
                  {row.buyerName ? <DetailLine label="Comprador" value={row.buyerName} /> : null}
                  <DetailLine label="Ingressos estornados" value={row.quantity ?? 1} />
                  <DetailLine label="Valor dos ingressos" value={brl(row.grossCents)} />
                  {row.fees.commissionCents !== 0 && <DetailLine label="Comissão Nokta devolvida" value={brl(row.fees.commissionCents)} />}
                  <DetailLine label="Sai do seu saldo" value={brl(row.netCents)} strong />
                  {row.reason ? <DetailLine label="Motivo" value={row.reason} /> : null}
                </dl>
              )}
              {row.type === "WITHDRAWAL" && (
                <dl>
                  <DetailLine label="Destino" value="Pix cadastrado em Dados jurídicos e financeiros" />
                  <DetailLine label="Saldo de origem" value={row.eventName} />
                </dl>
              )}
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
