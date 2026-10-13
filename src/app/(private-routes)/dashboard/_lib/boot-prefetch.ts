import type { QueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import { modulesQueryKey, ticketsAccessQueryKey, venueAccessQueryKey } from "@/context/dashboard-query-keys";
import { platformApi } from "@/services/platform";
import { ticketsAccessApi } from "@/services/promoters";
import { ticketsFinanceApi } from "@/services/tickets-finance";
import { venueFinanceApi } from "@/services/venue-finance";
import { venueHomeApi } from "@/services/venue-home";
import { venueInsightsApi } from "@/services/venue-insights";
import { venueMenuApi } from "@/services/venue-menu";
import { venueOperationApi } from "@/services/venue-operation";
import { platformKeys } from "../_hooks/use-platform";
import { venueKeys } from "../cardapio/_hooks/query-keys";
import { financeKeys } from "../financeiro/_venue/_hooks/query-keys";
import { insightsKeys } from "../insights/_venue/_hooks/query-keys";
import { opKeys } from "../operacao/_hooks/query-keys";

/**
 * Pré-carregamento da abertura do dashboard.
 *
 * Sem isto a Início depende de três idas ao servidor em fila: organizações →
 * módulos/acessos/menu → dados da tela. Cada uma só começa quando a anterior
 * responde, e em rede móvel (com a API respondendo em 0,3 a 0,8s) a soma é o
 * que deixa a tela lenta.
 *
 * O painel passa a lembrar qual foi a última organização aberta e dispara
 * tudo de uma vez no primeiro instante, em paralelo com /me/organizations.
 * Quando a organização é confirmada, as telas encontram as respostas já no
 * cache (mesmas chaves dos hooks) e não esperam de novo.
 *
 * O que fica guardado é só uma dica: ids e sim/não. Nunca nome, permissão
 * detalhada ou dado da operação, e nunca decide acesso: se a dica estiver
 * errada (outra organização, permissão retirada), as chamadas extras
 * respondem 403 e são ignoradas, e o fluxo normal segue como antes.
 */
export interface BootHint {
  orgId: number;
  /** Organização usa a Início do bar e restaurante. */
  venue: boolean;
  /** Unidade que a Início abriu por último (a principal). */
  locationId: number | null;
  venueFinance: boolean;
  ticketsFinance: boolean;
  insights: boolean;
}

const STORAGE_PREFIX = "nokta:dashboard:boot-hint:";

function storageKey(): string | null {
  try {
    const userId = JSON.parse(Cookies.get("user") ?? "{}").userId;
    return typeof userId === "number" || typeof userId === "string" ? `${STORAGE_PREFIX}${userId}` : null;
  } catch {
    return null;
  }
}

export function readBootHint(): BootHint | null {
  try {
    const key = storageKey();
    if (!key) return null;
    const hint = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return hint && typeof hint.orgId === "number" ? (hint as BootHint) : null;
  } catch {
    return null;
  }
}

export function writeBootHint(hint: BootHint): void {
  try {
    const key = storageKey();
    if (key) window.localStorage.setItem(key, JSON.stringify(hint));
  } catch {
    // Navegador sem armazenamento (aba anônima restrita): só perde o atalho.
  }
}

const HOME_PERIODS = ["TODAY", "THIS_MONTH", "LAST_MONTH"] as const;

/**
 * Dispara as consultas da abertura para a organização da dica. `includeHome`
 * só é verdadeiro na Início: nas outras telas bastam módulos, acessos e menu.
 * Cada função de busca é a mesma do hook que usa a chave.
 */
export function prefetchDashboardBoot(queryClient: QueryClient, hint: BootHint, includeHome: boolean): void {
  const { orgId } = hint;
  const run = (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => {
    void queryClient.prefetchQuery({ queryKey, queryFn });
  };

  run(modulesQueryKey(orgId), async () => {
    const res = await api.get<{ modules: { module: string; status: string }[] }>(`/organizations/${orgId}/modules`);
    return res.data?.modules ?? [];
  });
  run(venueAccessQueryKey(orgId), async () => (await api.get(`/organizations/${orgId}/me/access`)).data);
  run(ticketsAccessQueryKey(orgId), () => ticketsAccessApi.getAccess(orgId));
  run(platformKeys.navigation(orgId), () => platformApi.getNavigation(orgId));

  if (!hint.venue) {
    if (includeHome) {
      run(platformKeys.home(orgId), () => platformApi.getHome(orgId));
      if (hint.ticketsFinance) prefetchTicketsTimelines(run, orgId);
    }
    return;
  }

  run(venueKeys.publicProfile(orgId), () => venueMenuApi.getPublicProfile(orgId));
  if (!includeHome) return;

  run(opKeys.locations(orgId), () => venueOperationApi.listLocations(orgId));
  run(["home", orgId, "default"], () => venueHomeApi.get(orgId, {}));
  if (hint.ticketsFinance) prefetchTicketsTimelines(run, orgId);

  const locationId = hint.locationId;
  if (locationId === null) return;
  if (hint.venueFinance) {
    for (const quickPeriod of HOME_PERIODS) {
      const params = { quickPeriod };
      run(financeKeys.timeline(orgId, locationId, params), () => venueFinanceApi.getTimeline(orgId, locationId, params));
    }
  }
  if (hint.insights) {
    const params = { locationId, quickPeriod: "TODAY" as const, comparison: "PREVIOUS_PERIOD" as const };
    run(insightsKeys.overview(orgId, params), () => venueInsightsApi.getOverview(orgId, params));
  }
}

function prefetchTicketsTimelines(
  run: (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => void,
  orgId: number,
): void {
  for (const quickPeriod of HOME_PERIODS) {
    const params = { quickPeriod };
    run(["tickets-finance", orgId, "timeline", params], () => ticketsFinanceApi.getTimeline(orgId, params));
  }
}
