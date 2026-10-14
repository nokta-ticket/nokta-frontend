"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import api, { getErrorMessage } from "@/lib/axios";
import { EventoEditorLayout } from "@/app/(private-routes)/dashboard/eventos/[id]/_components/EventoEditorLayout";
import type { EventoData } from "@/app/(private-routes)/dashboard/eventos/[id]/_components/types";

/** O admin edita o evento com o mesmo editor do produtor (`/produtor/eventos/:id`). */
export default function AdminEventoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await api.get<EventoData>(`/produtor/eventos/${id}`);
      setEvent(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Evento não encontrado."));
    }
  }, [id]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader back="/admin/eventos" title="Evento" />
        <ErrorState title="Não deu pra abrir o evento" description={error} onRetry={() => void loadEvent()} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-[60vh] w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader back="/admin/eventos" title={event.nome ?? "Evento"} description="Editando como administrador." />
      <EventoEditorLayout event={event} onRefresh={loadEvent} />
    </div>
  );
}
