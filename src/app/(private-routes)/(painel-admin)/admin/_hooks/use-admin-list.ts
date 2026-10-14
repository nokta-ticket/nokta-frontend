"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import type { Paginate } from "@/interfaces/paginate";
import { normalizePagination, type PaginationDetails } from "@/lib/pagination";

interface ListResponse<T> {
  data: T[];
  paginate?: Paginate | null;
}

export interface AdminListState<T> {
  /** `null` antes da primeira resposta (skeleton); `[]` quando a API devolveu vazio. */
  rows: T[] | null;
  loading: boolean;
  error: string | null;
  paginate: PaginationDetails;
  page: number;
  goTo: (page: number) => Promise<void>;
  reload: () => Promise<void>;
}

const EMPTY_PAGINATE = normalizePagination(null);

/**
 * Lista paginada do admin: busca `path` com `params` (+ `page`), guarda
 * linhas, estado e paginação normalizada. Refaz na página 1 sempre que os
 * params mudam (quem chama já aplica debounce na busca). Resposta fora de
 * ordem é descartada.
 */
export function useAdminList<T>(path: string, params: Record<string, unknown>, options: { perPage?: number; fallbackError?: string } = {}): AdminListState<T> {
  const { perPage, fallbackError = "Não foi possível carregar a lista." } = options;
  const paramsKey = JSON.stringify(params);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const requestId = useRef(0);

  const [rows, setRows] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginate, setPaginate] = useState<PaginationDetails>(EMPTY_PAGINATE);
  const [page, setPage] = useState(1);

  const goTo = useCallback(
    async (nextPage: number) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const cleaned = Object.fromEntries(Object.entries(paramsRef.current).filter(([, v]) => v !== undefined && v !== null && v !== ""));
        const { data } = await api.get<ListResponse<T>>(path, { params: { ...cleaned, page: nextPage, ...(perPage ? { limit: perPage } : {}) } });
        if (id !== requestId.current) return;
        setRows(Array.isArray(data.data) ? data.data : []);
        setPaginate(normalizePagination(data.paginate));
        setPage(nextPage);
      } catch (err) {
        if (id !== requestId.current) return;
        setRows([]);
        setPaginate(EMPTY_PAGINATE);
        setError(getErrorMessage(err, fallbackError));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [path, perPage, fallbackError],
  );

  useEffect(() => {
    void goTo(1);
    // paramsKey é a serialização dos params — é ela que deve disparar o refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTo, paramsKey]);

  const reload = useCallback(() => goTo(page), [goTo, page]);

  return { rows, loading, error, paginate, page, goTo, reload };
}
