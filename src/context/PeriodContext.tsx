"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type PeriodKey = "today" | "7d" | "30d" | "custom";

export interface PeriodRange {
  from: string | null;
  to: string | null;
}

export interface PeriodState {
  key: PeriodKey;
  range: PeriodRange;
}

interface PeriodContextType {
  period: PeriodState;
  setPeriod: (p: PeriodState) => void;
  /**
   * Enquanto o backend não aceitar range de datas, o filtro fica DESABILITADO.
   * A infra (estado + persistência) já existe; a UI apenas exibe "em breve".
   */
  enabled: boolean;
}

const DEFAULT_PERIOD: PeriodState = {
  key: "30d",
  range: { from: null, to: null },
};

const STORAGE_KEY = "nokta:dashboard:period";

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<PeriodState>(DEFAULT_PERIOD);

  // Hidrata do localStorage (persiste entre reloads).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPeriodState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const setPeriod = (p: PeriodState) => {
    setPeriodState(p);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };

  return (
    <PeriodContext.Provider value={{ period, setPeriod, enabled: false }}>
      {children}
    </PeriodContext.Provider>
  );
}

export const usePeriod = () => {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within a PeriodProvider");
  return ctx;
};
