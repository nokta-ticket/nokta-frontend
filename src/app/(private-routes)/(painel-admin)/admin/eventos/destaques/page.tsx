"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import { toast } from "@/lib/toast";
import { Calendar, Star, StarOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatarDataCurta } from "@/lib/formatarData";
import { Paginate } from "@/interfaces/paginate";
import api from "@/lib/axios";
import { EventoAPI, GetEvents } from "@/interfaces/events";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";

type Filtro = "todos" | "ativos" | "inativos" | null;

/* ──────────────────────────── consts ────────────────────────────── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 6;

/* ───────────────────────── componente ───────────────────────────── */
export default function EventosEmDestaquePage() {
  const [eventos, setEventos] = useState<EventoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [destaque, setDestaque] = useState(false);
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });

  function parseFilterValue(str: string | null) {
    switch (str) {
      case "todos":
        return null;
      case "ativos":
        return 1;
      case "inativos":
        return 0;
      default:
        return null;
    }
  }

  async function getEvents(page = 1) {
    try {
      const res = await api.get<GetEvents>("/admin/eventos", {
        params: {
          page,
          status: parseFilterValue(filtro),
          destaque: destaque,
        },
      });

      const data: EventoAPI[] = res.data.data;

      setPaginate(res.data.paginate);
      setEventos(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Falha ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getEvents();
  }, [filtro, destaque]);

  /* ─────────────── marcar / remover destaque ────────────────────── */
  const toggleDestaque = async (id: string, destacar: boolean) => {
    try {
      await api.put(`/admin/eventos/${id}`, { destaque: destacar });
      await getEvents();

      toast.success(
        destacar ? "Evento colocado em destaque" : "Evento removido do destaque"
      );
    } catch (e: any) {
      toast.error(e.message || "Falha ao atualizar destaque");
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1300px]">
      {/* topo / filtros */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Eventos em Destaque</h1>

        <div>
          <Button
            onClick={() => {
              setFiltro("todos");
              setDestaque(false);
            }}
            variant={filtro === "todos" ? "default" : "outline"}
            className={`rounded-none rounded-l-lg ${
              filtro === "todos"
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "text-sm"
            }`}
          >
            Todos
          </Button>
          <Button
            onClick={() => {
              setFiltro("ativos");
              setDestaque(false);
            }}
            variant={filtro === "ativos" ? "default" : "outline"}
            className={`rounded-none ${
              filtro === "ativos"
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "text-sm"
            }`}
          >
            Ativos
          </Button>
          <Button
            onClick={() => {
              setFiltro("inativos");
              setDestaque(false);
            }}
            variant={filtro === "inativos" ? "default" : "outline"}
            className={`rounded-none ${
              filtro === "inativos"
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "text-sm"
            }`}
          >
            Inativos
          </Button>
          <Button
            onClick={() => {
              setFiltro(null);
              setDestaque(true);
            }}
            variant={destaque === true ? "default" : "outline"}
            className={`rounded-none rounded-r-lg ${
              destaque === true
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "text-sm"
            }`}
          >
            Destaque
          </Button>
        </div>
      </div>

      {/* listagem */}
      {loading ? (
        <p className="py-20 text-center">Carregando…</p>
      ) : eventos.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Nenhum evento encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {eventos.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={resolveThumbnailUrl(ev.thumbnails?.[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK}
                  alt={ev.nome}
                  fill
                  sizes="100%"
                  className="rounded-t-xl object-cover"
                />
              </div>

              {/* conteúdo */}
              <div className="flex flex-col p-4">
                <p className="flex items-center gap-1 text-sm font-medium text-violet-500">
                  <Calendar className="h-4 w-4" />
                  {formatarDataCurta(ev.data)}
                </p>

                <h2 className="mt-1 text-base font-semibold">{ev.nome}</h2>
                <p className="text-sm text-muted-foreground">
                  {ev.endereco.logradouro}, {ev.endereco.numero} -{" "}
                  {ev.endereco.localidade}
                </p>

                <div className="mt-2">
                  <Badge
                    className={
                      ev.ativo
                        ? "bg-emerald-100 px-3 py-1 text-emerald-700"
                        : "bg-gray-200 px-3 py-1 text-gray-600"
                    }
                  >
                    {ev.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <Button
                  variant={ev.destaque ? "destructive" : "outline"}
                  className="mt-4 w-full"
                  onClick={() => toggleDestaque(ev.id, !ev.destaque)}
                >
                  {ev.destaque ? (
                    <>
                      <StarOff className="mr-2 h-4 w-4" />
                      Remover&nbsp;dos&nbsp;Destaques
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Colocar&nbsp;em&nbsp;Destaque
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* paginação */}
      {paginate.totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className={
                    paginate.currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  onClick={() => getEvents(paginate.currentPage - 1)}
                />
              </PaginationItem>

              <PaginationItem>
                <span className="text-sm px-2">
                  Página {paginate.currentPage} de {paginate.totalPages}
                </span>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  className={
                    paginate.currentPage === paginate.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  onClick={() => getEvents(paginate.currentPage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
}
