export type MockContext = { url: URL; method: string; body: unknown; params: Record<string, string> };
export type MockResult = { status?: number; data: unknown } | null;
export type MockHandler = { test: RegExp; method?: "get" | "post" | "put" | "patch" | "delete"; handle: (ctx: MockContext) => MockResult };

export function paginate<T>(items: T[], params: Record<string, string>, defaultPerPage = 12) {
  const perPage = Number(params.limit ?? params.perPage ?? defaultPerPage);
  const current = Math.max(1, Number(params.page ?? 1));
  const start = (current - 1) * perPage;
  const data = items.slice(start, start + perPage);
  const lastPage = Math.max(1, Math.ceil(items.length / perPage));
  return { data, paginate: { total: items.length, perPage, currentPage: current, lastPage, totalPages: lastPage, page: current, limit: perPage } };
}

export const unauthorized = (): MockResult => ({ status: 401, data: { message: "Não autenticado" } });
export const notFound = (message = "Não encontrado"): MockResult => ({ status: 404, data: { message } });
