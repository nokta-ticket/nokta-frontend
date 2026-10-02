"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Info,
  Loader2,
  MoreVertical,
  Search,
  Ticket,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useOrganizations } from "@/context/OrganizationContext";
import { periodLabel, periodToFinanceParams, usePeriod, type PeriodKey } from "@/context/PeriodContext";
import { useStepUp } from "@/components/session/step-up-modal";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { STEP_UP_TOKEN_HEADER } from "@/services/step-up";
import {
  ticketsStatementApi,
  type StatementRow,
  type StatementRowStatus,
  type StatementRowType,
  type TicketsEventBalance,
  type TicketsFinanceOverview,
  type TicketsStatementParams,
  type TicketsStatementSummary,
} from "@/services/tickets-finance";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import {
  DOTTED,
  FeeLine,
  HoverDetail,
  InfoTip,
  LOSS_TEXT,
  PANORAMA,
  Pill,
  PRESSABLE,
  SURFACE,
  brl,
  fmtDate,
  fmtDay,
  fmtDayShort,
  fmtTime,
  type PillTone,
} from "../_components/finance-ui";

type TabKey = "statement" | "events" | "withdrawals" | "chargebacks";

const TYPE_PILL: Record<StatementRowType, { label: string; tone: PillTone }> = {
  SALE: { label: "Venda", tone: "success" },
  REFUND: { label: "Estorno", tone: "loss" },
  CHARGEBACK: { label: "Contestação", tone: "loss" },
  WITHDRAWAL: { label: "Saque", tone: "violet" },
};
// "Em custódia" aparece em quase toda linha: neutro. Cor só onde é exceção.
const STATUS_PILL: Record<StatementRowStatus, { label: string; tone: PillTone }> = {
  CUSTODY: { label: "Em custódia", tone: "neutral" },
  RELEASED: { label: "Liberado", tone: "success" },
  COMPLETED: { label: "Concluído", tone: "neutral" },
  IN_PROGRESS: { label: "Em andamento", tone: "violet" },
  DEBITED: { label: "Descontado", tone: "loss" },
  FAILED: { label: "Falhou", tone: "loss" },
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
        <p className="font-semibold">Estorno {row.reference}</p>
        <FeeLine title="Comissão Nokta devolvida" hint={`${f.commissionPercent}% · volta para você`} value={brl(f.commissionCents)} />
        {f.buyerServiceFeeCents !== 0 && <FeeLine title="Taxa de serviço" hint="Devolvida ao comprador pela Nokta" value={brl(f.buyerServiceFeeCents)} muted />}
      </div>
    );
  }
  if (row.type === "CHARGEBACK") {
    return (
      <div className="space-y-2.5">
        <p className="font-semibold">Contestação {row.reference}</p>
        <FeeLine title="Processamento Pagar.me" hint="Não é devolvido na contestação" value={brl(f.producerGatewayFeeCents)} />
        <FeeLine title="Taxa de serviço devolvida" hint="Já somada no valor bruto da linha" value={brl(f.buyerServiceFeeCents)} muted />
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <div>
        <p className="font-semibold">Taxas do pedido {row.reference}</p>
        <p className="text-[12.5px] text-[#6b6878]">
          {row.quantity ?? 1} ingresso{(row.quantity ?? 1) > 1 ? "s" : ""} · {brl(row.grossCents)}
        </p>
      </div>
      <FeeLine title="Comissão Nokta" hint={`${f.commissionPercent}% · descontada do seu valor`} value={brl(f.commissionCents)} />
      <FeeLine title="Taxa de serviço" hint="Paga pelo comprador, por cima do ingresso" value={brl(f.buyerServiceFeeCents)} muted />
      <FeeLine title="Processamento Pagar.me" hint="Pago pelo comprador, por cima do ingresso" value={brl(f.buyerGatewayFeeCents)} muted />
      <div className="flex justify-between gap-3 border-t border-[#f2f0f7] pt-2.5 font-semibold">
        <span>Descontado de você</span>
        <span className="font-poppins tabular-nums">{brl(row.feeCents)}</span>
      </div>
    </div>
  );
}

function SummaryFees({ summary, label }: { summary: TicketsStatementSummary; label: string }) {
  const f = summary.fees;
  return (
    <div className="space-y-2.5">
      <div>
        <p className="font-semibold">Taxas do período</p>
        <p className="text-[12.5px] text-[#6b6878]">{label}</p>
      </div>
      <FeeLine title="Comissão Nokta" hint="Descontada do seu valor (já com estornos)" value={brl(f.commissionCents)} />
      {f.producerGatewayFeeCents !== 0 && <FeeLine title="Processamento em contestações" hint="Não devolvido pela Pagar.me" value={brl(f.producerGatewayFeeCents)} />}
      <FeeLine title="Taxa de serviço" hint="Paga pelos compradores, por cima do ingresso" value={brl(f.buyerServiceFeeCents)} muted />
      <FeeLine title="Processamento Pagar.me" hint="Pago pelos compradores, por cima do ingresso" value={brl(f.buyerGatewayFeeCents)} muted />
      <div className="flex justify-between gap-3 border-t border-[#f2f0f7] pt-2.5 font-semibold">
        <span>Descontado de você</span>
        <span className="font-poppins tabular-nums">{brl(summary.feeCents)}</span>
      </div>
    </div>
  );
}

// ── Cards ──
function BalanceCard({
  title,
  info,
  value,
  footer,
  loss = false,
}: {
  title: string;
  info: string;
  value: string;
  footer: ReactNode;
  loss?: boolean;
}) {
  return (
    <section className={cn(SURFACE, "flex flex-col justify-between gap-3 p-4 sm:gap-4 sm:p-6")}>
      <div className="flex items-center gap-1.5 text-[14px] font-medium text-[#3a3746]">
        {title}
        <InfoTip label={`O que é ${title.toLowerCase()}`} text={info} />
      </div>
      <div>
        <p className={cn("font-poppins text-[20px] font-bold leading-none tabular-nums sm:text-[30px]", loss && LOSS_TEXT)}>{value}</p>
        <div className="mt-2">{footer}</div>
      </div>
    </section>
  );
}

function CardLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex items-center gap-1 rounded-md text-left text-[13px] font-medium text-violet-700 hover:text-violet-800", PRESSABLE)}>
      <span>{children}</span>
      <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

function SummaryItem({ icon, iconClass, label, value, hint, divider }: { icon: ReactNode; iconClass: string; label: ReactNode; value: ReactNode; hint: string; divider: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-5", divider)}>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconClass)}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[13.5px] text-[#5f5c6b]">{label}</div>
        <div className="font-poppins text-[22px] font-bold tabular-nums">{value}</div>
        <p className="text-[12.5px] text-[#6b6878]">{hint}</p>
      </div>
    </div>
  );
}

const TH = "px-5 py-3 font-semibold";

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

  const statementParams: TicketsStatementParams = {
    ...periodParams,
    eventId,
    type: type || undefined,
    status: status || undefined,
    search: search || undefined,
    page,
    perPage,
    sort,
    dir,
  };
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
      await api.post(
        `/produtor/eventos/${target.eventId}/confirmar-saque`,
        { withdrawalId: saque.id, organizationId: orgId },
        { headers: { [STEP_UP_TOKEN_HEADER]: stepUpToken } },
      );
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

  return (
    <div className="space-y-6">
      {/* Contexto + evento */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>{contextSwitch}</div>
        <label className="relative flex h-11 w-full items-center rounded-[12px] border border-[#e6e2ef] bg-white pl-10 pr-3 sm:w-[260px]">
          <Ticket size={17} strokeWidth={1.8} className="pointer-events-none absolute left-3.5 text-[#6b6878]" aria-hidden="true" />
          <span className="sr-only">Evento</span>
          <select
            value={eventId ?? ""}
            onChange={(e) => {
              setEventId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="h-full w-full appearance-none bg-transparent pr-6 text-base font-medium outline-none sm:text-[14px]"
          >
            <option value="">Todos os eventos</option>
            {(allEvents.data?.events ?? []).map((e) => (
              <option key={e.eventId} value={e.eventId}>
                {e.eventName}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 text-[#6b6878]" aria-hidden="true" />
        </label>
      </div>

      {forbidden ? (
        <EmptyState title="Sem acesso ao financeiro" description="Só o proprietário ou um gerente do workspace vê o financeiro de ingressos." />
      ) : overview.isError ? (
        <div className={cn(SURFACE, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
          <p className="text-[14px] text-[#5f5c6b]">Não foi possível carregar o financeiro agora.</p>
          <button type="button" onClick={() => void overview.refetch()} className={cn("rounded-[10px] bg-[#1c1a24] px-4 py-2 text-[13.5px] font-semibold text-white", PRESSABLE)}>
            Tentar de novo
          </button>
        </div>
      ) : !data ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <BlockSkeleton key={i} className={cn("h-[140px] rounded-[20px]", i === 0 && "col-span-2 sm:col-span-1")} />
          ))}
        </div>
      ) : (
        <>
          {/* Cards de saldo */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
            <section className={cn(PANORAMA, "col-span-2 flex flex-col justify-between gap-4 p-6 sm:col-span-1")}>
              <div className="flex items-center gap-1.5 text-[14px] font-medium text-white/80">
                Saldo disponível
                <InfoTip dark label="O que é saldo disponível" text="Dinheiro de eventos que já passaram da custódia. Você pode transferir para o seu Pix agora." />
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-poppins text-[30px] font-bold leading-none tabular-nums">{brl(data.totals.availableCents)}</p>
                  <p className="mt-2 text-[13px] text-white/65">
                    {active ? "Novo saque liberado quando o atual concluir" : data.totals.availableCents > 0 ? "Disponível para saque agora" : "Nada disponível para saque agora"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSacar}
                  disabled={Boolean(active) || withdrawable.length === 0 || requestingEventId !== null}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-white px-4 text-[14px] font-semibold text-[#1c1a24] hover:bg-[#f1ecff] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/70",
                    PRESSABLE,
                  )}
                >
                  {requestingEventId !== null ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                  Sacar
                  <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </section>

            <BalanceCard
              title="Em custódia"
              info="Vendas de eventos que ainda não aconteceram ou aconteceram há pouco. Cada evento libera alguns dias depois da data dele (o padrão é 7)."
              value={brl(data.totals.custodyCents)}
              footer={
                <CardLink onClick={() => setTab("events")}>
                  {data.totals.custodyEventCount > 0
                    ? `${data.totals.custodyEventCount} evento${data.totals.custodyEventCount > 1 ? "s" : ""}${data.totals.nextReleaseAt ? ` · próxima liberação ${fmtDayShort(data.totals.nextReleaseAt)}` : ""}`
                    : "Ver por evento"}
                </CardLink>
              }
            />
            <BalanceCard
              title="Saque em andamento"
              info="Saque já solicitado e confirmado, a caminho do seu Pix. Só é possível ter um saque em andamento por vez."
              value={brl(active?.amountCents ?? 0)}
              footer={<CardLink onClick={() => setTab("withdrawals")}>{active ? `Solicitado em ${fmtDate(active.requestedAt).slice(0, 5)} · ver saques` : "Ver saques"}</CardLink>}
            />
            <BalanceCard
              title="Contestações"
              info="Compras que o comprador contestou no banco ou no cartão (chargeback). O valor e as taxas são descontados do seu saldo."
              value={brl(data.chargebacks.totalCents)}
              loss={data.chargebacks.count > 0}
              footer={<CardLink onClick={() => setTab("chargebacks")}>{data.chargebacks.count > 0 ? `${data.chargebacks.count} no período · ver detalhes` : "Nenhuma no período"}</CardLink>}
            />
          </div>

          {/* Abas */}
          <div role="tablist" aria-label="Seções do financeiro" className="flex gap-1 overflow-x-auto border-b border-[#ebe8f2]">
            {(
              [
                ["statement", "Extrato"],
                ["events", "Por evento"],
                ["withdrawals", "Saques"],
                ["chargebacks", "Contestações"],
              ] as [TabKey, string][]
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "shrink-0 whitespace-nowrap px-3 pb-3 pt-1 text-[15px] font-semibold transition-colors",
                  tab === k ? "text-[#1c1a24] shadow-[inset_0_-2px_0_#7c3aed]" : "text-[#6b6878] hover:text-[#1c1a24]",
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === "statement" && (
            <StatementTab
              summary={statement.data?.summary}
              rows={statement.data?.rows}
              total={statement.data?.total ?? 0}
              loading={statement.isLoading}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>De qual evento você quer sacar?</DialogTitle>
            <DialogDescription>O saque é feito por evento. Depois que ele concluir, você pode sacar o próximo.</DialogDescription>
          </DialogHeader>
          <ul className="mt-2 divide-y divide-[#f2f0f7] rounded-[14px] border border-[#ebe8f2]">
            {withdrawable.map((e) => (
              <li key={e.eventId}>
                <button
                  type="button"
                  disabled={requestingEventId !== null}
                  onClick={() => void requestWithdrawal(e)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#faf8ff] disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{e.eventName}</span>
                    <span className="block text-[12.5px] text-[#6b6878]">Evento em {fmtDay(e.eventDate)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-poppins font-semibold tabular-nums">
                    {requestingEventId === e.eventId ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                    {brl(e.availableCents)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
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
  const from = total ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(page * perPage, total);
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const arrow = (k: "date" | "gross" | "net") => (
    <span aria-hidden="true" className={props.sort === k ? "text-[#7c3aed]" : "text-[#a19eae]"}>
      {props.sort === k ? (props.dir === "desc" ? "↓" : "↑") : "↕"}
    </span>
  );
  const SELECT = "h-11 rounded-[12px] border border-[#e6e2ef] bg-white px-3 text-base outline-none sm:text-[14px]";

  return (
    <div className="space-y-5">
      {/* Resumo do período */}
      <section aria-label="Resumo do período" className={cn(SURFACE, "grid overflow-hidden sm:grid-cols-2 2xl:grid-cols-4")}>
        <SummaryItem
          icon={<ArrowUpRight size={20} strokeWidth={1.8} />}
          iconClass="bg-emerald-50 text-emerald-700"
          label="Entradas"
          value={summary ? brl(summary.inCents) : "…"}
          hint="Vendas de ingressos"
          divider="border-b border-[#f2f0f7] sm:border-r 2xl:border-b-0"
        />
        <SummaryItem
          icon={<ArrowDownLeft size={20} strokeWidth={1.8} />}
          iconClass="bg-[#fcf2f4] text-[#9b1c35]"
          label="Saídas"
          value={summary ? brl(summary.outCents) : "…"}
          hint="Estornos e contestações"
          divider="border-b border-[#f2f0f7] 2xl:border-b-0 2xl:border-r"
        />
        <SummaryItem
          icon={<CreditCard size={20} strokeWidth={1.8} />}
          iconClass="bg-[#f4f2f8] text-[#5b5868]"
          label={
            <span className="flex items-center gap-1.5">
              Taxas
              {summary ? (
                <HoverDetail label="Ver detalhe das taxas" trigger={<Info size={15} strokeWidth={1.8} className="text-[#6b6878]" aria-hidden="true" />} className="flex h-5 w-5 items-center justify-center">
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
          hint="Passe o mouse para ver cada taxa"
          divider="border-b border-[#f2f0f7] sm:border-b-0 sm:border-r"
        />
        <SummaryItem
          icon={<BarChart3 size={20} strokeWidth={1.8} />}
          iconClass="bg-[#f3edff] text-[#7c3aed]"
          label="Líquido"
          value={summary ? brl(summary.netCents) : "…"}
          hint="Entradas − saídas − taxas"
          divider=""
        />
      </section>

      {/* Filtros */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative flex h-11 items-center rounded-[12px] border border-[#e6e2ef] bg-white pl-10 pr-3 xl:w-[230px]">
          <CalendarDays size={17} strokeWidth={1.8} className="pointer-events-none absolute left-3.5 text-[#6b6878]" aria-hidden="true" />
          <span className="sr-only">Período</span>
          <select
            value={props.period}
            onChange={(e) => props.onPeriod(e.target.value as PeriodKey)}
            className="h-full w-full appearance-none bg-transparent pr-6 text-base font-medium outline-none sm:text-[14px]"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
            {props.period === "custom" ? <option value="custom">{props.label}</option> : null}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 text-[#6b6878]" aria-hidden="true" />
        </label>
        <label className="relative flex h-11 flex-1 items-center rounded-[12px] border border-[#e6e2ef] bg-white pl-10 pr-4">
          <Search size={17} strokeWidth={1.8} className="pointer-events-none absolute left-3.5 text-[#6b6878]" aria-hidden="true" />
          <span className="sr-only">Pesquisar</span>
          <input
            type="search"
            value={props.searchInput}
            onChange={(e) => props.onSearch(e.target.value)}
            placeholder="Pesquisar por pedido ou comprador"
            className="h-full w-full bg-transparent text-base outline-none placeholder:text-[#8a8796] sm:text-[14px]"
          />
        </label>
        <div className="flex gap-3">
          <select aria-label="Tipo" value={props.type} onChange={(e) => props.onType(e.target.value as StatementRowType | "")} className={cn(SELECT, "flex-1 xl:w-[170px] xl:flex-none")}>
            <option value="">Todos os tipos</option>
            <option value="SALE">Vendas</option>
            <option value="REFUND">Estornos</option>
            <option value="CHARGEBACK">Contestações</option>
            <option value="WITHDRAWAL">Saques</option>
          </select>
          <select aria-label="Status" value={props.status} onChange={(e) => props.onStatus(e.target.value as StatementRowStatus | "")} className={cn(SELECT, "flex-1 xl:w-[170px] xl:flex-none")}>
            <option value="">Todos os status</option>
            <option value="CUSTODY">Em custódia</option>
            <option value="RELEASED">Liberado</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluído</option>
            <option value="DEBITED">Descontado</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className={cn(SURFACE, "overflow-hidden")}>
        {props.loading && !rows ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <BlockSkeleton key={i} className="h-11" />
            ))}
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-[14px] text-[#5f5c6b]">Nenhuma transação com esses filtros no período.</p>
            <button type="button" onClick={props.onClear} className={cn("mt-2 rounded-md text-[13.5px] font-semibold text-violet-700", PRESSABLE)}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-left text-[14px] lg:table">
              <thead className="bg-[#fbfaff] text-[13px] text-[#5f5c6b]">
                <tr className="border-b border-[#ebe8f2]">
                  <th scope="col" className={cn(TH, "w-[9%]")}>
                    <button type="button" onClick={() => props.onSort("date")} className="flex items-center gap-1">
                      Data {arrow("date")}
                    </button>
                  </th>
                  <th scope="col" className={cn(TH, "w-[17%]")}>Evento</th>
                  <th scope="col" className={cn(TH, "w-[17%]")}>Transação</th>
                  <th scope="col" className={cn(TH, "w-[10%]")}>Tipo</th>
                  <th scope="col" className={cn(TH, "w-[11%] text-right")}>
                    <button type="button" onClick={() => props.onSort("gross")} className="ml-auto flex items-center gap-1">
                      Valor bruto {arrow("gross")}
                    </button>
                  </th>
                  <th scope="col" className={cn(TH, "w-[9%] text-right")}>Taxas</th>
                  <th scope="col" className={cn(TH, "w-[11%] text-right")}>
                    <button type="button" onClick={() => props.onSort("net")} className="ml-auto flex items-center gap-1">
                      Valor líquido {arrow("net")}
                    </button>
                  </th>
                  <th scope="col" className={cn(TH, "w-[12%] pl-10")}>Status</th>
                  <th scope="col" className="w-[56px] px-3 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f0f7]">
                {rows.map((r) => (
                  <tr key={r.key} className="cursor-pointer hover:bg-[#faf8ff]" onClick={() => props.onOpen(r)}>
                    <td className="px-5 py-3 font-poppins text-[13.5px] tabular-nums">
                      <span className="block">{fmtDate(r.occurredAt)}</span>
                      <span className="block text-[12.5px] text-[#6b6878]">{fmtTime(r.occurredAt)}</span>
                    </td>
                    <td className="px-5 py-3">{r.eventName}</td>
                    <td className="px-5 py-3">
                      <span className="block font-poppins font-medium tabular-nums">{r.reference}</span>
                      <span className="block text-[12.5px] text-[#5f5c6b]">{describe(r)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Pill tone={TYPE_PILL[r.type].tone}>{TYPE_PILL[r.type].label}</Pill>
                    </td>
                    <td className="px-5 py-3 text-right font-poppins tabular-nums">{brl(r.grossCents)}</td>
                    <td className="px-5 py-3 text-right font-poppins tabular-nums text-[#5f5c6b]">
                      {r.type === "WITHDRAWAL" ? (
                        brl(0)
                      ) : (
                        <HoverDetail label={`Ver taxas do pedido ${r.reference}`} trigger={<span className={cn(DOTTED, "hover:text-[#1c1a24]")}>{brl(r.feeCents)}</span>}>
                          <RowFees row={r} />
                        </HoverDetail>
                      )}
                    </td>
                    <td className={cn("px-5 py-3 text-right font-poppins font-semibold tabular-nums", r.type === "CHARGEBACK" && LOSS_TEXT)}>{brl(r.netCents)}</td>
                    <td className="py-3 pl-10 pr-5">
                      <Pill tone={STATUS_PILL[r.status].tone}>{STATUS_PILL[r.status].label}</Pill>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        aria-label={`Ver detalhes de ${r.reference}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onOpen(r);
                        }}
                        className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-[#5b5868] hover:bg-[#f3f1f8]", PRESSABLE)}
                      >
                        <MoreVertical size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-[#f2f0f7] lg:hidden">
              {rows.map((r) => (
                <li key={r.key}>
                  <button type="button" onClick={() => props.onOpen(r)} className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf8ff]">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-poppins font-medium tabular-nums">{r.reference}</span>
                        <Pill tone={TYPE_PILL[r.type].tone}>{TYPE_PILL[r.type].label}</Pill>
                      </span>
                      <span className="mt-1 block truncate text-[13px] text-[#5f5c6b]">
                        {r.eventName} · {fmtDate(r.occurredAt).slice(0, 5)} {fmtTime(r.occurredAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={cn("block font-poppins font-semibold tabular-nums", r.type === "CHARGEBACK" && LOSS_TEXT)}>{brl(r.netCents)}</span>
                      <span className="mt-1 block">
                        <Pill tone={STATUS_PILL[r.status].tone}>{STATUS_PILL[r.status].label}</Pill>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Paginação */}
      {total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-poppins text-[13.5px] tabular-nums text-[#5f5c6b]">
            Mostrando {from}–{to} de {total} transações
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Itens por página" value={perPage} onChange={(e) => props.onPerPage(Number(e.target.value))} className="h-9 rounded-[10px] border border-[#e6e2ef] bg-white px-3 text-base sm:text-[13.5px]">
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
            <nav aria-label="Páginas" className="flex items-center gap-1">
              <PageButton label="Página anterior" disabled={page === 1} onClick={() => props.onPage(page - 1)}>
                <ChevronLeft size={16} aria-hidden="true" />
              </PageButton>
              {nums.map((n, i) => (
                <span key={n} className="flex items-center gap-1">
                  {i > 0 && n - nums[i - 1] > 1 ? <span className="px-1 text-[#6b6878]">…</span> : null}
                  <PageButton current={n === page} onClick={() => props.onPage(n)}>
                    {n}
                  </PageButton>
                </span>
              ))}
              <PageButton label="Próxima página" disabled={page === pages} onClick={() => props.onPage(page + 1)}>
                <ChevronRight size={16} aria-hidden="true" />
              </PageButton>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PageButton({ children, onClick, disabled, current, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; current?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-poppins text-[13.5px] font-medium tabular-nums disabled:cursor-not-allowed disabled:opacity-40",
        current ? "bg-[#7c3aed] text-white" : "text-[#3a3746] hover:bg-[#f3f1f8]",
        PRESSABLE,
      )}
    >
      {children}
    </button>
  );
}

// ── Aba Por evento ──
function EventsTab({ events, onPick }: { events: TicketsEventBalance[]; onPick: (eventId: number) => void }) {
  if (events.length === 0) {
    return <EmptyState title="Nenhum evento com vendas" description="Quando seus eventos tiverem pagamentos confirmados, o saldo de cada um aparece aqui." />;
  }
  const t = (k: keyof TicketsEventBalance) => events.reduce((s, e) => s + (e[k] as number), 0);
  const situation = (e: TicketsEventBalance): { label: string; tone: PillTone } =>
    e.released ? (e.availableCents > 0 ? { label: `Liberado em ${fmtDayShort(e.releaseAt)}`, tone: "success" } : { label: "Tudo sacado", tone: "neutral" }) : { label: `Em custódia até ${fmtDayShort(e.releaseAt)}`, tone: "neutral" };
  const NUM = "px-5 py-3 text-right font-poppins tabular-nums";
  return (
    <div className="space-y-3">
      <div className={cn(SURFACE, "overflow-hidden")}>
        <table className="hidden w-full text-left text-[14px] lg:table">
          <thead className="bg-[#fbfaff] text-[13px] text-[#5f5c6b]">
            <tr className="border-b border-[#ebe8f2]">
              <th scope="col" className={TH}>Evento</th>
              <th scope="col" className={TH}>Situação</th>
              <th scope="col" className={cn(TH, "text-right")}>Vendas</th>
              <th scope="col" className={cn(TH, "text-right")}>Comissão</th>
              <th scope="col" className={cn(TH, "text-right")}>Estornos e contestações</th>
              <th scope="col" className={cn(TH, "text-right")}>Líquido</th>
              <th scope="col" className={cn(TH, "text-right")}>Sacado</th>
              <th scope="col" className={cn(TH, "text-right")}>Em saque</th>
              <th scope="col" className={cn(TH, "text-right")}>Em custódia</th>
              <th scope="col" className={cn(TH, "text-right")}>Disponível</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f0f7]">
            {events.map((e) => {
              const s = situation(e);
              return (
                <tr key={e.eventId} className="cursor-pointer hover:bg-[#faf8ff]" onClick={() => onPick(e.eventId)}>
                  <td className="px-5 py-3">
                    <span className="block font-medium">{e.eventName}</span>
                    <span className="block font-poppins text-[12.5px] tabular-nums text-[#6b6878]">Evento em {fmtDay(e.eventDate)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={s.tone}>{s.label}</Pill>
                  </td>
                  <td className={NUM}>{brl(e.salesCents)}</td>
                  <td className={cn(NUM, "text-[#5f5c6b]")}>{brl(-e.commissionCents)}</td>
                  <td className={cn(NUM, e.refundsCents + e.chargebacksCents < 0 ? LOSS_TEXT : "text-[#6b6878]")}>{brl(e.refundsCents + e.chargebacksCents)}</td>
                  <td className={cn(NUM, "font-semibold")}>{brl(e.netCents)}</td>
                  <td className={cn(NUM, "text-[#5f5c6b]")}>{brl(-e.withdrawnCents)}</td>
                  <td className={cn(NUM, e.inTransitCents ? "font-semibold text-[#6d28d9]" : "text-[#6b6878]")}>{brl(-e.inTransitCents)}</td>
                  <td className={cn(NUM, e.custodyCents ? "font-semibold" : "text-[#6b6878]")}>{brl(e.custodyCents)}</td>
                  <td className={cn(NUM, e.availableCents ? "font-semibold" : "text-[#6b6878]")}>{brl(e.availableCents)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-[#ebe8f2] bg-[#fbfaff] font-semibold">
            <tr>
              <td className="px-5 py-3">Total</td>
              <td />
              <td className={NUM}>{brl(t("salesCents"))}</td>
              <td className={NUM}>{brl(-t("commissionCents"))}</td>
              <td className={NUM}>{brl(t("refundsCents") + t("chargebacksCents"))}</td>
              <td className={NUM}>{brl(t("netCents"))}</td>
              <td className={NUM}>{brl(-t("withdrawnCents"))}</td>
              <td className={NUM}>{brl(-t("inTransitCents"))}</td>
              <td className={NUM}>{brl(t("custodyCents"))}</td>
              <td className={NUM}>{brl(t("availableCents"))}</td>
            </tr>
          </tfoot>
        </table>
        <ul className="divide-y divide-[#f2f0f7] lg:hidden">
          {events.map((e) => {
            const s = situation(e);
            return (
              <li key={e.eventId}>
                <button type="button" onClick={() => onPick(e.eventId)} className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf8ff]">
                  <span className="min-w-0">
                    <span className="block font-medium">{e.eventName}</span>
                    <span className="mt-1 block">
                      <Pill tone={s.tone}>{s.label}</Pill>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-poppins font-semibold tabular-nums">{brl(e.released ? e.availableCents : e.custodyCents)}</span>
                    <span className="block text-[12.5px] text-[#6b6878]">{e.released ? "disponível" : "em custódia"}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-[13px] text-[#5f5c6b]">Valores de agora, desde o início das vendas de cada evento. Clique em um evento para ver o extrato dele.</p>
    </div>
  );
}

// ── Abas Saques e Contestações ──
function HistoryTable({ kind, rows, loading, onOpen }: { kind: "withdrawals" | "chargebacks"; rows?: StatementRow[]; loading: boolean; onOpen: (r: StatementRow) => void }) {
  if (loading && !rows) return <BlockSkeleton className="h-64 rounded-[20px]" />;
  if (!rows || rows.length === 0) {
    return kind === "withdrawals" ? (
      <EmptyState title="Nenhum saque ainda" description="Quando você sacar o saldo de um evento, o saque aparece aqui com a situação." />
    ) : (
      <EmptyState title="Nenhuma contestação" description="Quando um comprador contestar uma compra no cartão, ela aparece aqui com o valor descontado." />
    );
  }
  return (
    <div className="space-y-3">
      <div className={cn(SURFACE, "overflow-hidden")}>
        <table className="w-full text-left text-[14px]">
          <thead className="bg-[#fbfaff] text-[13px] text-[#5f5c6b]">
            <tr className="border-b border-[#ebe8f2]">
              <th scope="col" className={TH}>{kind === "withdrawals" ? "Solicitado em" : "Data"}</th>
              <th scope="col" className={TH}>{kind === "withdrawals" ? "Saque" : "Pedido"}</th>
              <th scope="col" className={cn(TH, "hidden md:table-cell")}>Evento</th>
              {kind === "chargebacks" ? <th scope="col" className={cn(TH, "hidden lg:table-cell")}>Motivo</th> : null}
              <th scope="col" className={cn(TH, "text-right")}>{kind === "withdrawals" ? "Valor" : "Descontado"}</th>
              <th scope="col" className={cn(TH, "hidden md:table-cell")}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f0f7]">
            {rows.map((r) => (
              <tr key={r.key} className="cursor-pointer hover:bg-[#faf8ff]" onClick={() => onOpen(r)}>
                <td className="px-5 py-3 font-poppins tabular-nums">
                  {fmtDate(r.occurredAt)} <span className="text-[#6b6878]">{fmtTime(r.occurredAt)}</span>
                </td>
                <td className="px-5 py-3 font-poppins font-medium tabular-nums">{r.reference}</td>
                <td className="hidden px-5 py-3 md:table-cell">{r.eventName}</td>
                {kind === "chargebacks" ? <td className={cn("hidden px-5 py-3 lg:table-cell", !r.reason && "text-[#6b6878]")}>{r.reason ?? "Não informado pela operadora"}</td> : null}
                <td className={cn("px-5 py-3 text-right font-poppins font-semibold tabular-nums", kind === "chargebacks" && LOSS_TEXT)}>{brl(kind === "withdrawals" ? -r.netCents : r.netCents)}</td>
                <td className="hidden px-5 py-3 md:table-cell">
                  <Pill tone={STATUS_PILL[r.status].tone}>{STATUS_PILL[r.status].label}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {kind === "chargebacks" ? <p className="text-[13px] text-[#5f5c6b]">O motivo vem da operadora do cartão. Quando ela não informa, aparece &quot;Não informado&quot;.</p> : null}
    </div>
  );
}

// ── Detalhe lateral ──
function DetailLine({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4 border-b border-[#f2f0f7] py-2.5 last:border-0", strong && "font-semibold")}>
      <dt className="text-[#5f5c6b]">{label}</dt>
      <dd className="text-right font-poppins font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function DetailSheet({ row, onClose }: { row: StatementRow | null; onClose: () => void }) {
  const title = row ? `${TYPE_PILL[row.type].label} ${row.reference}` : "";
  return (
    <Sheet open={row !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[460px]">
        {row ? (
          <>
            <SheetHeader className="border-b border-[#ebe8f2] pb-4">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6 text-[14px]">
              <p className={cn("font-poppins text-[30px] font-bold leading-none tabular-nums", row.type === "CHARGEBACK" && LOSS_TEXT)}>
                {row.netCents > 0 ? "+ " : ""}
                {brl(row.netCents)}
              </p>
              <p className="mt-2 text-[13px] text-[#5f5c6b]">
                {row.eventName} · {fmtDate(row.occurredAt)} às {fmtTime(row.occurredAt)}
              </p>
              <div className="mt-3">
                <Pill tone={STATUS_PILL[row.status].tone}>{STATUS_PILL[row.status].label}</Pill>
              </div>

              {row.type === "SALE" && (
                <>
                  <dl className="mt-5">
                    {row.buyerName ? <DetailLine label="Comprador" value={row.buyerName} /> : null}
                    <DetailLine label="Ingressos" value={row.quantity ?? 1} />
                    <DetailLine label="Valor dos ingressos" value={brl(row.grossCents)} />
                    <DetailLine label={`Comissão Nokta (${row.fees.commissionPercent}%)`} value={brl(row.fees.commissionCents)} />
                    <DetailLine label="Entra no seu saldo" value={brl(row.netCents)} strong />
                    {row.releaseAt ? <DetailLine label={row.status === "CUSTODY" ? "Libera em" : "Liberado em"} value={fmtDay(row.releaseAt)} /> : null}
                  </dl>
                  <div className="mt-5 rounded-[12px] bg-[#faf8ff] px-4 py-3 text-[13px] leading-relaxed text-[#5f5c6b]">
                    <p className="flex justify-between gap-3">
                      <span>Taxa de serviço + processamento</span>
                      <span className="font-poppins font-medium tabular-nums text-[#1c1a24]">{brl(row.fees.buyerServiceFeeCents + row.fees.buyerGatewayFeeCents)}</span>
                    </p>
                    <p className="mt-1">Pagas pelo comprador, por cima do ingresso. Não saem do seu valor.</p>
                  </div>
                </>
              )}
              {row.type === "CHARGEBACK" && (
                <>
                  <dl className="mt-5">
                    <DetailLine label="Ingresso e taxa de serviço devolvidos" value={brl(row.grossCents)} />
                    <DetailLine label="Processamento Pagar.me" value={brl(row.fees.producerGatewayFeeCents)} />
                    <DetailLine label="Total descontado" value={brl(row.netCents)} strong />
                  </dl>
                  <dl className="mt-5">
                    {row.buyerName ? <DetailLine label="Comprador" value={row.buyerName} /> : null}
                    <DetailLine label="Ingressos cancelados" value={row.quantity ?? 1} />
                    <DetailLine label="Motivo" value={row.reason ?? "Não informado pela operadora"} />
                  </dl>
                  <p className="mt-5 text-[13px] leading-relaxed text-[#5f5c6b]">
                    O comprador contestou a compra no banco ou no cartão. O ingresso foi cancelado e, pela regra atual, o produtor arca com o valor devolvido, incluindo a taxa de serviço e o processamento.
                  </p>
                </>
              )}
              {row.type === "REFUND" && (
                <dl className="mt-5">
                  {row.buyerName ? <DetailLine label="Comprador" value={row.buyerName} /> : null}
                  <DetailLine label="Ingressos estornados" value={row.quantity ?? 1} />
                  <DetailLine label="Valor dos ingressos" value={brl(row.grossCents)} />
                  <DetailLine label="Comissão Nokta devolvida" value={brl(row.fees.commissionCents)} />
                  <DetailLine label="Sai do seu saldo" value={brl(row.netCents)} strong />
                  {row.reason ? <DetailLine label="Motivo" value={row.reason} /> : null}
                </dl>
              )}
              {row.type === "WITHDRAWAL" && (
                <dl className="mt-5">
                  <DetailLine label="Destino" value="Pix cadastrado em Dados jurídicos e financeiros" />
                  <DetailLine label="Saldo de origem" value={row.eventName} />
                </dl>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
