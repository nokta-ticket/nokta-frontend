import { Paginate } from "@/interfaces/paginate";

type RawPagination =
  | {
      total?: number;
      perPage?: number;
      currentPage?: number;
      lastPage?: number;
      totalPages?: number;
      page?: number;
      limit?: number;
    }
  | null
  | undefined;

export interface PaginationDetails {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  totalPages: number;
}

export function normalizePagination(raw: RawPagination): PaginationDetails {
  const currentPage = Number(raw?.currentPage ?? raw?.page ?? 1);
  const lastPage = Number(raw?.lastPage ?? raw?.totalPages ?? 1);
  const total = Number(raw?.total ?? 0);
  const perPage = Number(raw?.perPage ?? raw?.limit ?? 0);

  return {
    total: Number.isFinite(total) && total >= 0 ? total : 0,
    perPage: Number.isFinite(perPage) && perPage >= 0 ? perPage : 0,
    currentPage:
      Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
    lastPage: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1,
    totalPages: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1,
  };
}

export function toPaginate(raw: RawPagination): Paginate {
  const normalized = normalizePagination(raw);

  return {
    total: normalized.total,
    perPage: normalized.perPage,
    currentPage: normalized.currentPage,
    lastPage: normalized.lastPage,
    totalPages: normalized.totalPages,
    page: normalized.currentPage,
    limit: normalized.perPage,
  };
}
