'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatarDataBR } from '@/lib/formatarData'
import { MEDIA_FALLBACK, resolveThumbnailUrl } from '@/lib/media'
import api from '@/lib/axios'

interface Evento {
  id: string
  nome: string
  data: string
  horario: string
  local: string
  thumbnails?: { url: string }[]
}

const ITEMS_PER_PAGE = 2

export default function EventosAtivos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        // Fase 5: sessão é cookie HttpOnly enviado automaticamente — o
        // client compartilhado já resolve a API certa e envia credenciais.
        const res = await api.get('/eventos/ativos')
        setEventos(res.data)
      } catch (err) {
        setErro(true)
      } finally {
        setLoading(false)
      }
    }

    fetchEventos()
  }, [])

  const totalPages = Math.ceil(eventos.length / ITEMS_PER_PAGE)
  const eventosPaginados = eventos.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const handleClick = (id: string) => {
    router.push(`/painel-produtor/eventos/${id}`)
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando eventos...</p>
  }

  if (erro || eventos.length === 0) {
    return (
      <div className="pt-8 px-2 lg:px-0">
        <h1 className="text-2xl font-semibold">Eventos Ativos</h1>
        <p className="text-muted-foreground text-sm mb-3">
          Gerencie seus eventos publicados
        </p>
        <div className="flex flex-col items-center justify-center text-center min-h-[300px] bg-muted rounded-lg py-12 px-4">
          <p className="text-lg font-medium text-gray-700">
            Não há nenhum evento ativo no momento.
          </p>
          <Link href="/produtor/eventos/criar">
            <Button className="cursor-pointer mt-6 bg-violet-600 text-white px-8 py-3">
              Criar novo evento
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-8 px-2 lg:px-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Eventos Ativos</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie seus eventos publicados
        </p>
      </div>

      {eventosPaginados.map((evento) => (
        <div
          key={evento.id}
          onClick={() => handleClick(evento.id)}
          className="cursor-pointer border rounded-xl overflow-hidden bg-white shadow-sm transform transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex flex-col lg:flex-row items-stretch">
            <div className="w-full lg:w-[140px] aspect-[16/9] lg:aspect-auto flex-shrink-0">
              <img
                src={resolveThumbnailUrl(evento.thumbnails?.[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK}
                alt={evento.nome}
                className="object-cover w-full h-full rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none"
              />
            </div>

            <div className="flex flex-col p-3 w-full justify-between">
              <div>
                <h2 className="text-sm font-semibold">{evento.nome}</h2>

                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatarDataBR(evento.data)} às {evento.horario.slice(0, 5)}
                </p>

                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {evento.local}
                </p>
              </div>

              <div className="flex justify-end mt-2">
                <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1">
                  Ativo
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className="cursor-pointer"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              />
            </PaginationItem>

            <PaginationItem>
              <span className="text-sm px-2">
                Página {page} de {totalPages}
              </span>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                className="cursor-pointer"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
