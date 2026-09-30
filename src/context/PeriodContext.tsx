"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PeriodKey = "today" | "7d" | "30d" | "custom";

export interface PeriodRange {
  /** "YYYY-MM-DD" */
  from: string | null;
  /** "YYYY-MM-DD" */
  to: string | null;
}

export interface PeriodState {
  key: PeriodKey;
  range: PeriodRange;
}

interface PeriodContextType {
  period: PeriodState;
  setPeriod: (p: PeriodState) => void;
}

/**
 * Filtro de período global do dashboard (header). Sempre abre em "Hoje" —
 * decisão explícita do usuário; a escolha vale enquanto a pessoa navega entre
 * as telas (o provider vive no layout do dashboard), mas não é persistida: um
 * F5 ou nova visita volta pra "Hoje".
 */
const DEFAULT_PERIOD: PeriodState = { key: "today", range: { from: null, to: null } };

// Versão anterior persistia em localStorage com "30d" como padrão; limpa pra
// não deixar lixo no navegador de quem já tinha aberto o dashboard.
const LEGACY_STORAGE_KEY = "nokta:dashboard:period";

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodState>(DEFAULT_PERIOD);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return <PeriodContext.Provider value={{ period, setPeriod }}>{children}</PeriodContext.Provider>;
}

export const usePeriod = () => {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within a PeriodProvider");
  return ctx;
};

/** Parâmetros dos timelines financeiros (Tickets e Venue aceitam o mesmo formato). */
export type PeriodFinanceParams =
  | { quickPeriod: "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS" }
  | { startDate: string; endDate: string };

export function periodToFinanceParams(period: PeriodState): PeriodFinanceParams {
  if (period.key === "custom" && period.range.from && period.range.to) {
    return { startDate: period.range.from, endDate: period.range.to };
  }
  if (period.key === "7d") return { quickPeriod: "LAST_7_DAYS" };
  if (period.key === "30d") return { quickPeriod: "LAST_30_DAYS" };
  return { quickPeriod: "TODAY" };
}

function formatDayMonth(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

/** Rótulo curto do período selecionado ("Hoje", "Últimos 7 dias", "03/09 a 10/09"). */
export function periodLabel(period: PeriodState): string {
  if (period.key === "custom" && period.range.from && period.range.to) {
    return period.range.from === period.range.to
      ? formatDayMonth(period.range.from)
      : `${formatDayMonth(period.range.from)} a ${formatDayMonth(period.range.to)}`;
  }
  if (period.key === "7d") return "Últimos 7 dias";
  if (period.key === "30d") return "Últimos 30 dias";
  return "Hoje";
}

/** Soma `days` a uma data "YYYY-MM-DD" sem passar por fuso (aritmética de calendário). */
function shiftDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Todos os dias ("YYYY-MM-DD") cobertos pelo período, em ordem — usado para
 * desenhar o gráfico zerado (linha reta) quando o período não tem vendas.
 * `today` é o dia corrente no fuso da operação (São Paulo).
 */
export function periodDates(period: PeriodState, today: string): string[] {
  let from = today;
  let to = today;
  if (period.key === "custom" && period.range.from && period.range.to) {
    from = period.range.from;
    to = period.range.to;
  } else if (period.key === "7d") {
    from = shiftDateStr(today, -6);
  } else if (period.key === "30d") {
    from = shiftDateStr(today, -29);
  }
  const days: string[] = [];
  for (let d = from; d <= to && days.length < 400; d = shiftDateStr(d, 1)) days.push(d);
  return days;
}
