"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventoAPI } from "@/interfaces/events";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { DataTablePagination, DataTableToolbar } from "@/components/ui/data-table";
import { useAdminList } from "../_hooks/use-admin-list";
import { RefreshButton } from "../_components/refresh-button";
import { EventTable } from "./_components/event-table";

type Filtro = "todos" | "ativos" | "inativos";

// `status` do backend: 1 = ativos, 0 = inativos, nulo = todos.
const STATUS_PARAM: Record<Filtro, number | null> = { todos: null, ativos: 1, inativos: 0 };

const FILTERS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
];

export default function AdminEventos() {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const debounced = useDebouncedValue(busca.trim(), 500);

  const list = useAdminList<EventoAPI>("/admin/eventos", { status: STATUS_PARAM[filtro], nameOrStreet: debounced || null }, { fallbackError: "Não foi possível carregar os eventos." });
  const rows = list.rows ?? [];
  const active = rows.filter((e) => e.ativo).length;
  const featured = rows.filter((e) => e.destaque).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Eventos" description="Todos os eventos da plataforma, de qualquer produtor." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Eventos" icon="calendar" value={list.rows ? list.paginate.total : null} hint={filtro !== "todos" || debounced ? "Com o filtro atual" : "Cadastrados na plataforma"} />
        <StatCard label="Ativos" icon="check-circle" value={list.rows ? active : null} hint="Nesta página" />
        <StatCard label="Em destaque" icon="star" value={list.rows ? featured : null} hint="Nesta página" />
      </div>

      <DataTableToolbar>
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou local" className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl" />
        <SegmentedControl value={filtro} onChange={setFiltro} options={FILTERS} size="sm" />
        <RefreshButton onClick={() => void list.reload()} pending={list.loading} className="ml-auto" />
      </DataTableToolbar>

      {list.error ? (
        <ErrorState title="Não deu pra carregar os eventos" description={list.error} onRetry={() => void list.reload()} />
      ) : list.rows === null ? (
        <RowsSkeleton rows={6} />
      ) : (
        <EventTable
          rows={rows}
          emptyTitle={debounced ? "Nenhum evento pra essa busca" : "Nenhum evento com esse filtro"}
          onRowClick={(ev) => router.push(`/admin/eventos/${ev.id}`)}
          action={(ev) => (
            <Button asChild variant="subtle" size="icon-sm" aria-label={`Editar ${ev.nome}`} title="Editar evento">
              <Link href={`/admin/eventos/${ev.id}`}>
                <Icon name="edit" size={13} />
              </Link>
            </Button>
          )}
          footer={<DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="eventos" onPageChange={(p) => void list.goTo(p)} />}
        />
      )}
    </div>
  );
}
