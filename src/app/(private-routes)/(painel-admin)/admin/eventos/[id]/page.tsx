"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { EventoEditorLayout } from "@/app/(private-routes)/dashboard/eventos/[id]/_components/EventoEditorLayout";
import type { EventoData } from "@/app/(private-routes)/dashboard/eventos/[id]/_components/types";

export default function AdminEventoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadEvent = async () => {
    try {
      const res = await api.get<EventoData>(`/produtor/eventos/${id}`);
      setEvent(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold text-gray-700">Evento não encontrado</p>
        <Link href="/admin/eventos">
          <Button variant="outline">Voltar para eventos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/admin/eventos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-violet-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para eventos
      </Link>

      <EventoEditorLayout event={event} onRefresh={loadEvent} />
    </div>
  );
}
