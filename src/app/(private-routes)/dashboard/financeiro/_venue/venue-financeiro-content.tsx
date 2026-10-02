"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Store } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { periodDates, periodLabel, periodToFinanceParams, usePeriod } from "@/context/PeriodContext";
import { cn } from "@/lib/utils";
import { VENUE_PAYMENT_METHOD_LABEL, type VenueFinancePeriodParams } from "@/services/venue-finance";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { InfoTip, LOSS_TEXT, PANORAMA, SURFACE, brl, fmtTime } from "../_components/finance-ui";
import { useVenueFinanceOverview, useVenueFinancePaymentMethods, useVenueFinanceTimeline } from "./_hooks/use-venue-finance-overview";
import { useVenueFinanceCashSessions } from "./_hooks/use-venue-finance-cash-reports";
import { CashSessionReportSheet } from "./_components/cash-session-report-sheet";

interface CashSessionRow {
  id: number;
  openedAt: string;
  closedAt: string | null;
  status: "OPEN" | "CLOSED";
  expectedCashCents: number;
  countedCashCents: number | null;
  differenceCents: number | null;
  operatorName: string | null;
  cashRegister: { id: number; nome: string };
}

const METHOD_COLORS = ["#7c3aed", "#a78bfa", "#c9b8fb", "#e6defc", "#efeaff", "#f6f3ff"];

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
const dayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const fmtDayMonthSP = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

function Difference({ cents }: { cents: number | null }) {
  if (cents === null) return <span className="text-[#6b6878]">Caixa aberto</span>;
  if (cents === 0) return <span className="text-[#6b6878]">Bateu</span>;
  return <span className={cn("font-semibold", cents < 0 ? LOSS_TEXT : "text-emerald-700")}>{cents < 0 ? "Faltou" : "Sobrou"} {brl(Math.abs(cents))}</span>;
}

function StatCard({ title, value, hint, info, loss = false }: { title: string; value: string; hint: string; info?: string; loss?: boolean }) {
  return (
    <section className={cn(SURFACE, "flex flex-col justify-between gap-3 p-4 sm:gap-4 sm:p-6")}>
      <div className="flex items-center gap-1.5 text-[14px] font-medium text-[#3a3746]">
        {title}
        {info ? <InfoTip label={`O que é ${title.toLowerCase()}`} text={info} /> : null}
      </div>
      <div>
        <p className={cn("font-poppins text-[20px] font-bold leading-none tabular-nums sm:text-[30px]", loss && LOSS_TEXT)}>{value}</p>
        <p className="mt-2 text-[13px] text-[#5f5c6b]">{hint}</p>
      </div>
    </section>
  );
}

/**
 * Financeiro do bar e restaurante: o dinheiro entra direto na maquininha e
 * no caixa do estabelecimento — a Nokta só registra. Sem saldo, custódia ou
 * saque (isso é exclusivo de Ingressos e nunca é somado aqui).
 */
export default function VenueFinanceiroPage({ contextSwitch }: { contextSwitch?: ReactNode }) {
  const { currentOrg, activeModuleKeys } = useOrganizations();
  const { period } = usePeriod();
  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");
  const { data: locations } = useVenueLocations(venueActive ? orgId : null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  useEffect(() => setLocationId(null), [orgId]);
  useEffect(() => {
    if (locationId !== null || !locations || locations.length === 0) return;
    setLocationId((locations.find((l) => l.isMain) ?? locations[0]).id);
  }, [locations, locationId]);

  const params: VenueFinancePeriodParams = { ...periodToFinanceParams(period), basis: "CASH" };
  const label = periodLabel(period);
  const days = useMemo(() => periodDates(period, todayInSaoPaulo()), [period]);
  const sessionRange = useMemo(() => {
    const last = new Date(`${days[days.length - 1]}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    return { startDate: `${days[0]}T03:00:00.000Z`, endDate: `${last.toISOString().slice(0, 10)}T03:00:00.000Z` };
  }, [days]);

  const overview = useVenueFinanceOverview(orgId, locationId, params);
  const timeline = useVenueFinanceTimeline(orgId, locationId, params);
  const methods = useVenueFinancePaymentMethods(orgId, locationId, params);
  const sessions = useVenueFinanceCashSessions(orgId, locationId, sessionRange);

  if (!orgId || !venueActive) {
    return <EmptyState title="Operação não está ativa" description="Ative a Operação do bar e restaurante para ver as vendas aqui." />;
  }
  if (locations && locations.length === 0) return <OnboardingLocation orgId={orgId} />;

  const closed = ((sessions.data ?? []) as CashSessionRow[]).filter((s) => s.status === "CLOSED");
  const allSessions = (sessions.data ?? []) as CashSessionRow[];
  const cashDiff = closed.reduce((s, x) => s + (x.differenceCents ?? 0), 0);

  const byDay = new Map((timeline.data ?? []).map((p) => [p.date, p.revenueCents]));
  const bars = days.map((d) => ({ date: d, cents: byDay.get(d) ?? 0 }));
  const maxBar = Math.max(1, ...bars.map((b) => b.cents));
  const best = bars.reduce((a, b) => (b.cents > a.cents ? b : a), bars[0]);

  const methodRows = (methods.data ?? []).filter((m) => m.grossCents > 0).sort((a, b) => b.grossCents - a.grossCents);
  const methodTotal = methodRows.reduce((s, m) => s + m.grossCents, 0);
  const o = overview.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>{contextSwitch}</div>
        {locations && locations.length > 1 && locationId !== null ? (
          <label className="relative flex h-11 w-full items-center rounded-[12px] border border-[#e6e2ef] bg-white pl-10 pr-3 sm:w-[260px]">
            <Store size={17} strokeWidth={1.8} className="pointer-events-none absolute left-3.5 text-[#6b6878]" aria-hidden="true" />
            <span className="sr-only">Unidade</span>
            <select value={locationId} onChange={(e) => setLocationId(Number(e.target.value))} className="h-full w-full appearance-none bg-transparent pr-6 text-base font-medium outline-none sm:text-[14px]">
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 text-[#6b6878]" aria-hidden="true" />
          </label>
        ) : null}
      </div>

      {overview.isError ? (
        <div className={cn(SURFACE, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
          <p className="text-[14px] text-[#5f5c6b]">Não foi possível carregar as vendas agora.</p>
          <button type="button" onClick={() => void overview.refetch()} className="rounded-[10px] bg-[#1c1a24] px-4 py-2 text-[13.5px] font-semibold text-white">
            Tentar de novo
          </button>
        </div>
      ) : !o ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <BlockSkeleton key={i} className={cn("h-[140px] rounded-[20px]", i === 0 && "col-span-2 sm:col-span-1")} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
          <section className={cn(PANORAMA, "col-span-2 flex flex-col justify-between gap-4 p-6 sm:col-span-1")}>
            <p className="text-[14px] font-medium text-white/80">Vendas · {label}</p>
            <div>
              <p className="font-poppins text-[30px] font-bold leading-none tabular-nums">{brl(o.grossRevenueCents)}</p>
              <p className="mt-2 text-[13px] text-white/65">Direto na sua maquininha e no seu caixa</p>
            </div>
          </section>
          <StatCard title="Descontos concedidos" value={brl(o.discountCents)} hint="Já tirados do total de vendas" />
          <StatCard title="Pagamentos cancelados" value={brl(o.canceledCents)} hint="Não entram nas vendas" />
          <StatCard
            title="Diferença de caixa"
            info="Soma do que faltou ou sobrou na gaveta nos caixas fechados do período, contra o que o sistema esperava."
            value={brl(cashDiff)}
            hint={closed.length ? `${closed.length} fechamento${closed.length > 1 ? "s" : ""} no período` : "Nenhum caixa fechado no período"}
            loss={cashDiff < 0}
          />
        </div>
      )}

      <p className={cn(SURFACE, "rounded-[14px] px-4 py-3 text-[13.5px] text-[#5f5c6b]")}>
        No bar e restaurante o dinheiro entra direto na sua maquininha e no seu caixa. A Nokta registra as vendas, por isso aqui não há saldo, custódia nem saque.
      </p>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <section className={cn(SURFACE, "min-w-0 px-6 pb-5 pt-5")}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-semibold">Vendas por dia</h2>
            {best && best.cents > 0 ? (
              <p className="text-[13px] text-[#5f5c6b]">
                Melhor dia{" "}
                <span className="font-poppins font-semibold tabular-nums text-[#1c1a24]">
                  {dayMonth(best.date)} · {brl(best.cents)}
                </span>
              </p>
            ) : null}
          </div>
          {timeline.isLoading ? (
            <BlockSkeleton className="mt-5 h-[180px]" />
          ) : (
            <>
              <div className="mt-5 flex h-[180px] items-end gap-1 sm:gap-1.5" role="img" aria-label={`Vendas por dia, ${label}`}>
                {bars.map((b) => (
                  <span
                    key={b.date}
                    title={`${dayMonth(b.date)} · ${brl(b.cents)}`}
                    className={cn("max-w-[56px] flex-1 rounded-t-[4px]", b === best && b.cents > 0 ? "bg-violet-600" : "bg-[#ddd2fb]")}
                    style={{ height: `${Math.max(3, (b.cents / maxBar) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between font-poppins text-[12px] tabular-nums text-[#6b6878]">
                <span>{dayMonth(days[0])}</span>
                {days.length > 2 ? <span>{dayMonth(days[Math.floor(days.length / 2)])}</span> : null}
                <span>{dayMonth(days[days.length - 1])}</span>
              </div>
            </>
          )}
        </section>

        <section className={cn(SURFACE, "px-6 pb-5 pt-5")}>
          <h2 className="text-[17px] font-semibold">Como pagaram</h2>
          {methodRows.length === 0 ? (
            <p className="mt-4 text-[13.5px] text-[#5f5c6b]">Nenhum pagamento no período.</p>
          ) : (
            <>
              <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full">
                {methodRows.map((m, i) => (
                  <span key={m.method} style={{ flex: `${m.grossCents} 1 0`, background: METHOD_COLORS[i % METHOD_COLORS.length] }} />
                ))}
              </div>
              <dl className="mt-3 text-[14px]">
                {methodRows.map((m, i) => (
                  <div key={m.method} className="flex items-center justify-between gap-4 border-b border-[#f2f0f7] py-2.5 last:border-0">
                    <dt className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: METHOD_COLORS[i % METHOD_COLORS.length] }} aria-hidden="true" />
                      {VENUE_PAYMENT_METHOD_LABEL[m.method] ?? m.method}
                    </dt>
                    <dd className="font-poppins tabular-nums">
                      <span className="mr-3 text-[13px] text-[#6b6878]">{Math.round((m.grossCents / methodTotal) * 100)}%</span>
                      <span className="font-semibold">{brl(m.grossCents)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        <section className={cn(SURFACE, "min-w-0 xl:col-span-2")}>
          <div className="px-6 pb-4 pt-5">
            <h2 className="text-[17px] font-semibold">Fechamentos de caixa</h2>
            <p className="mt-0.5 text-[13px] text-[#5f5c6b]">O dinheiro contado na gaveta contra o que o sistema esperava.</p>
          </div>
          {sessions.isLoading ? (
            <div className="px-6 pb-5">
              <BlockSkeleton className="h-40" />
            </div>
          ) : allSessions.length === 0 ? (
            <p className="border-t border-[#f2f0f7] px-6 py-10 text-center text-[13.5px] text-[#5f5c6b]">Nenhum caixa aberto no período.</p>
          ) : (
            <>
              <table className="hidden w-full text-left text-[14px] md:table">
                <thead className="bg-[#fbfaff] text-[13px] text-[#5f5c6b]">
                  <tr className="border-y border-[#ebe8f2]">
                    <th scope="col" className="w-[25%] px-6 py-3 font-semibold">Caixa</th>
                    <th scope="col" className="w-[25%] px-6 py-3 font-semibold">Turno</th>
                    <th scope="col" className="w-[16%] px-6 py-3 text-right font-semibold">Esperado</th>
                    <th scope="col" className="w-[16%] px-6 py-3 text-right font-semibold">Contado</th>
                    <th scope="col" className="w-[18%] px-6 py-3 text-right font-semibold">Diferença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f0f7]">
                  {allSessions.map((s) => (
                    <tr key={s.id} className="cursor-pointer hover:bg-[#faf8ff]" onClick={() => setSessionId(s.id)}>
                      <td className="px-6 py-3">
                        <span className="block font-medium">{s.cashRegister.nome}</span>
                        {s.operatorName ? <span className="block text-[13px] text-[#5f5c6b]">{s.operatorName}</span> : null}
                      </td>
                      <td className="px-6 py-3 font-poppins text-[13.5px] tabular-nums text-[#5f5c6b]">
                        {fmtDayMonthSP(s.openedAt)} · {fmtTime(s.openedAt)}
                        {s.closedAt ? ` às ${fmtTime(s.closedAt)}` : " · aberto"}
                      </td>
                      <td className="px-6 py-3 text-right font-poppins tabular-nums">{brl(s.expectedCashCents)}</td>
                      <td className="px-6 py-3 text-right font-poppins tabular-nums">{s.countedCashCents === null ? "Não contado" : brl(s.countedCashCents)}</td>
                      <td className="px-6 py-3 text-right font-poppins tabular-nums">
                        <Difference cents={s.status === "CLOSED" ? s.differenceCents ?? 0 : null} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-[#f2f0f7] border-t border-[#ebe8f2] md:hidden">
                {allSessions.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setSessionId(s.id)} className="flex w-full items-start justify-between gap-3 px-5 py-3 text-left">
                      <span>
                        <span className="block font-medium">{s.cashRegister.nome}</span>
                        <span className="block font-poppins text-[13px] tabular-nums text-[#5f5c6b]">
                          {fmtDayMonthSP(s.openedAt)}
                          {s.operatorName ? ` · ${s.operatorName}` : ""}
                        </span>
                      </span>
                      <span className="text-right font-poppins text-[14px] tabular-nums">
                        <Difference cents={s.status === "CLOSED" ? s.differenceCents ?? 0 : null} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <CashSessionReportSheet orgId={orgId} sessionId={sessionId} open={sessionId !== null} onOpenChange={(v) => !v && setSessionId(null)} />
    </div>
  );
}
