"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/context/OrganizationContext";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { Paginate } from "@/interfaces/paginate";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTablePagination } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { LegalFinancialPendingBanner } from "../_components/legal-financial-pending-banner";
import { EventCard, EventCardSkeleton, type EventListItem } from "./_components/EventCard";
import { EVENT_STATUS } from "./_lib/event-meta";

type Filtro = "ativos" | "inativos" | "todos";
interface GetEvents {
  data: EventListItem[];
  paginate: Paginate;
}
interface Metrics {
  ingressosVendidos: number;
  arrecadacaoTotal: number;
  eventosCriados: number;
}

const FILTER_STATUS: Record<Filtro, number | null> = { ativos: EVENT_STATUS.PUBLISHED, inativos: EVENT_STATUS.DRAFT, todos: null };
const FILTER_OPTIONS: { value: Filtro; label: string }[] = [
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Rascunhos" },
  { value: "todos", label: "Todos" },
];

const keys = {
  list: (orgId: number, filtro: Filtro, page: number) => ["produtor-eventos", orgId, filtro, page] as const,
  stats: (orgId: number) => ["produtor-eventos", orgId, "stats"] as const,
};

/**
 * Rota canônica de Eventos: lista escopada pela organização ativa
 * (`organizationId`) — trocar de organização troca os eventos exibidos.
 */
export default function EventosPage() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id ?? null;

  const [filtro, setFiltro] = useState<Filtro>("ativos");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ kind: "cancel" | "delete"; ev: EventListItem } | null>(null);

  const list = useQuery({
    queryKey: keys.list(orgId ?? -1, filtro, page),
    queryFn: () => api.get<GetEvents>("/produtor/eventos", { params: { organizationId: orgId, page, status: FILTER_STATUS[filtro] } }).then((r) => r.data),
    enabled: orgId !== null,
    placeholderData: (prev) => prev,
  });

  const stats = useQuery({
    queryKey: keys.stats(orgId ?? -1),
    queryFn: async () => {
      const [metrics, active] = await Promise.all([
        api.get<Metrics>("/produtor/metrics", { params: { organizationId: orgId } }).then((r) => r.data),
        api.get<GetEvents>("/produtor/eventos", { params: { organizationId: orgId, page: 1, status: EVENT_STATUS.PUBLISHED, limit: 1 } }).then((r) => r.data.paginate),
      ]);
      return { ...metrics, ativos: active.total ?? active.totalPages ?? 0 };
    },
    enabled: orgId !== null,
    staleTime: 60_000,
  });

  const eventos = useMemo(() => {
    const items = list.data?.data ?? [];
    const q = search.trim().toLowerCase();
    return q ? items.filter((e) => e.nome.toLowerCase().includes(q)) : items;
  }, [list.data, search]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["produtor-eventos", orgId] });
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/produtor/eventos/${id}`);
      toast.success("Evento excluído");
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível excluir o evento."));
      throw error;
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.patch(`/produtor/eventos/${id}/cancelar`);
      toast.success("Evento cancelado");
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível cancelar o evento."));
      throw error;
    }
  };

  const createAction = currentOrg ? (
    <Button asChild>
      <Link href="/dashboard/eventos/criar">
        <Icon name="plus" size={14} />
        Criar evento
      </Link>
    </Button>
  ) : (
    <Button leftIcon="plus" onClick={() => guard(() => undefined)}>
      Criar evento
    </Button>
  );

  if (loadingOrgs) {
    return (
      <div className="space-y-6">
        <PageHeader title="Eventos" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="Eventos" actions={createAction} />
        <EmptyState icon="calendar-plus" title="Nenhum evento ainda" description="Crie seu workspace para começar a cadastrar eventos." action={<Button leftIcon="plus" onClick={() => guard(() => undefined)}>Criar evento</Button>} />
      </div>
    );
  }

  const paginate = list.data?.paginate;
  const lastPage = paginate?.lastPage ?? paginate?.totalPages ?? 1;
  const loading = list.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Eventos" actions={createAction} />
      <LegalFinancialPendingBanner orgId={currentOrg.id} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Eventos ativos" icon="calendar-check" value={stats.data?.ativos} loading={stats.isLoading} hint="Publicados e vendendo agora" />
        <StatCard label="Ingressos vendidos" icon="ticket" value={stats.data?.ingressosVendidos} loading={stats.isLoading} hint="Em todos os eventos" />
        <StatCard label="Receita" icon="sack-dollar" format="currency" value={stats.data?.arrecadacaoTotal} loading={stats.isLoading} hint="Valor dos ingressos vendidos" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar evento pelo nome" className="w-full sm:max-w-xl sm:flex-1" />
        <div className="flex items-center gap-2">
          <SegmentedControl
            className="flex-1 sm:flex-none"
            value={filtro}
            options={FILTER_OPTIONS}
            onChange={(v) => {
              setFiltro(v);
              setPage(1);
            }}
          />
          <Button variant="subtle" size="icon" aria-label="Atualizar lista" title="Atualizar" onClick={refresh}>
            <Icon name="refresh" size={14} className={cn(list.isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {list.isError ? (
        <ErrorState title="Não deu pra carregar os eventos" description={getErrorMessage(list.error, "Tenta de novo em alguns segundos.")} onRetry={() => void list.refetch()} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <EmptyState
          icon="calendar-plus"
          title={search ? "Nenhum evento com esse nome" : filtro === "ativos" ? "Nenhum evento publicado" : filtro === "inativos" ? "Nenhum rascunho" : "Nenhum evento ainda"}
          description={search ? "Tente outro termo ou limpe a busca." : "Crie um evento e publique quando estiver pronto."}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                Limpar busca
              </Button>
            ) : (
              createAction
            )
          }
        />
      ) : (
        <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", list.isFetching && "opacity-80 transition-opacity")}>
          {eventos.map((ev, i) => (
            <EventCard key={ev.id} event={ev} index={i} onCancel={(e) => setPending({ kind: "cancel", ev: e })} onDelete={(e) => setPending({ kind: "delete", ev: e })} />
          ))}
        </div>
      )}

      {paginate && lastPage > 1 ? <DataTablePagination page={page} lastPage={lastPage} total={paginate.total} perPage={paginate.perPage ?? paginate.limit} noun="eventos" onPageChange={setPage} /> : null}

      <ConfirmDialog
        open={pending?.kind === "cancel"}
        onOpenChange={(o) => (!o ? setPending(null) : null)}
        danger
        icon="ban"
        title="Cancelar este evento?"
        description={
          <>
            <span className="font-medium text-foreground">{pending?.ev.nome}</span> some da bilheteria e ninguém mais compra ingresso. Não dá pra reativar depois.
          </>
        }
        confirmLabel="Cancelar evento"
        cancelLabel="Voltar"
        onConfirm={() => (pending ? handleCancel(pending.ev.id) : undefined)}
      />
      <ConfirmDialog
        open={pending?.kind === "delete"}
        onOpenChange={(o) => (!o ? setPending(null) : null)}
        danger
        icon="trash"
        title="Excluir este rascunho?"
        description={
          <>
            <span className="font-medium text-foreground">{pending?.ev.nome}</span> e as imagens dele são removidos de vez. Essa ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        onConfirm={() => (pending ? handleDelete(pending.ev.id) : undefined)}
      />
    </div>
  );
}
