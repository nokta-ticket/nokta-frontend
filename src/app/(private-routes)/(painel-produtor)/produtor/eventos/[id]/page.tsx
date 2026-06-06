"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/axios"
import { EventoEditorLayout } from "./_components/EventoEditorLayout"
import { EventoData } from "./_components/types"

export default function EventoEditorPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const [event,   setEvent]   = useState<EventoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const loadEvent = async () => {
    try {
      const res = await api.get<EventoData>(`/produtor/eventos/${id}`)
      setEvent(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadEvent()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-500">Carregando evento...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-800 font-semibold mb-1">Evento não encontrado</p>
          <p className="text-[13px] text-gray-500 mb-4">
            Você não tem permissão para editar este evento ou ele não existe.
          </p>
          <button
            onClick={() => router.push("/produtor/eventos")}
            className="text-primary text-[13px] underline"
          >
            Voltar para meus eventos
          </button>
        </div>
      </div>
    )
  }

  return <EventoEditorLayout event={event} onRefresh={loadEvent} />
}
