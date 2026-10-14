"use client";

import { useState } from "react";
import type { EventoAPI } from "@/interfaces/events";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { DataTablePagination, DataTableToolbar } from "@/components/ui/data-table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAdminList } from "../../_hooks/use-admin-list";
import { RefreshButton } from "../../_components/refresh-button";
import { EventTable } from "../_components/event-table";

type Filtro = "todos" | "ativos" | "inativos" | "destaque";

// `status` do backend: 1 = ativos, 0 = inativos; "destaque" manda `destaque=true` sem status.
const FILTERS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
  { value: "destaque", label: "Em destaque" },
];

function paramsFor(filtro: Filtro) {
  return { status: filtro === "ativos" ? 1 : filtro === "inativos" ? 0 : null, destaque: filtro === "destaque" };
}

export default function EventosEmDestaquePage() {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const list = useAdminList<EventoAPI>("/admin/eventos", paramsFor(filtro), { fallbackError: "Não foi possível carregar os eventos." });
  const rows = list.rows ?? [];

  /* marcar / remover destaque */
  async function toggleDestaque(ev: EventoAPI) {
    const destacar = !ev.destaque;
    setTogglingId(ev.id);
    try {
      await api.put(`/admin/eventos/${ev.id}`, { destaque: destacar });
      await list.reload();
      toast.success(destacar ? "Evento colocado em destaque" : "Evento removido do destaque");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível atualizar o destaque."));
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Eventos em destaque" description="Os destacados aparecem primeiro na home da bilheteria." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Eventos" icon="calendar" value={list.rows ? list.paginate.total : null} hint={filtro !== "todos" ? "Com o filtro atual" : "Cadastrados na plataforma"} />
        <StatCard label="Em destaque" icon="star" value={list.rows ? rows.filter((e) => e.destaque).length : null} hint="Nesta página" />
        <StatCard label="Ativos" icon="check-circle" value={list.rows ? rows.filter((e) => e.ativo).length : null} hint="Nesta página" />
      </div>

      <DataTableToolbar>
        <div className="scrollbar-hide max-w-full overflow-x-auto">
          <SegmentedControl value={filtro} onChange={setFiltro} options={FILTERS} size="sm" />
        </div>
        <RefreshButton onClick={() => void list.reload()} pending={list.loading} className="ml-auto" />
      </DataTableToolbar>

      {list.error ? (
        <ErrorState title="Não deu pra carregar os eventos" description={list.error} onRetry={() => void list.reload()} />
      ) : list.rows === null ? (
        <RowsSkeleton rows={6} />
      ) : (
        <EventTable
          rows={rows}
          emptyTitle="Nenhum evento com esse filtro"
          action={(ev) => (
            <Button variant={ev.destaque ? "outline" : "secondary"} size="sm" leftIcon={ev.destaque ? "star-outline" : "star"} loading={togglingId === ev.id} onClick={() => void toggleDestaque(ev)}>
              {ev.destaque ? "Remover destaque" : "Destacar"}
            </Button>
          )}
          footer={<DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="eventos" onPageChange={(p) => void list.goTo(p)} />}
        />
      )}
    </div>
  );
}
