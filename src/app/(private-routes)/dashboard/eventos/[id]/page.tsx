"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { EventoEditorLayout } from "./_components/EventoEditorLayout";
import type { EventoData } from "./_components/types";
import Link from "next/link";

export default function EventoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    try {
      const res = await api.get<EventoData>(`/produtor/eventos/${id}`);
      setEvent(res.data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Você não tem permissão para editar este evento ou ele não existe."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void loadEvent();
  }, [id, loadEvent]);

  if (loading) return <EditorSkeleton />;

  if (error || !event) {
    return (
      <EmptyState
        icon="calendar"
        title="Evento não encontrado"
        description={error ?? "Você não tem permissão para editar este evento ou ele não existe."}
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/eventos">Voltar pra meus eventos</Link>
          </Button>
        }
      />
    );
  }

  return <EventoEditorLayout event={event} onRefresh={loadEvent} />;
}

function EditorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-3 w-1/3 max-w-xs" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    </div>
  );
}
