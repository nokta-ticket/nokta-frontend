"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { formatarDataCurta } from "@/lib/formatarData";
import { AlertCircle, Calendar, Heart, RefreshCcw, Search } from "lucide-react";
import api, { getErrorMessage } from "@/lib/axios";
import { EventoAPI } from "@/interfaces/events";
import { Paginate } from "@/interfaces/paginate";
import { AxiosError } from "axios";
import EventCard from "@/components/layout/EventCard";
import { EventCardSkeleton } from "@/components/ui/skeleton";
import { toPaginate } from "@/lib/pagination";


interface GetEvents {
  data: EventoAPI[];
  paginate: Paginate;
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<EventoAPI[]>([]);
  const [paginate, setPaginate] = useState<Paginate>({
    totalPages: 1,
    currentPage: 1,
  });
  const [name, setName] = useState("");
  const debounceRef = useRef<null | NodeJS.Timeout>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasSearchedRef = useRef(false);

  async function getEvents(page = 1) {
    try {
      setError(null);
      const res = await api.get<GetEvents>("/eventos", {
        params: { page, name },
      });

      const data: EventoAPI[] = res.data.data;

      setEventos(data);
      setPaginate(toPaginate(res.data.paginate));
    } catch (err) {
      setEventos([]);
      setPaginate(toPaginate(null));
      setError(getErrorMessage(err, "Nao foi possivel carregar os eventos."));
      console.error("Erro ao buscar eventos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getEvents();
  }, []);

  useEffect(() => {
    if (!hasSearchedRef.current) {
      hasSearchedRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      getEvents(1);
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name]);

  const toggleFavorite = async (id: string, favorite: boolean) => {
    try {
      await api.patch(`/eventos/${id}/favoritos`, { favorite: favorite });
      await getEvents(paginate.currentPage);

      toast.success("Favorito atualizado com sucesso");
    } catch (e) {
      console.error(e);
      if (e instanceof AxiosError) {
        const message =
          e.response?.data.message === "Unauthenticated."
            ? "É necessário estar logado para favoritar."
            : e.response?.data.message;
        toast.error(message || "Falha ao atualizar favorito.");
        return;
      }
      toast.error("Falha ao atualizar favorito.");
    }
  };

  return (
    <section className="mx-auto mt-8 w-full max-w-[1300px] px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Todos os Eventos</h1>

        <div className="relative hidden w-full max-w-sm md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="Pesquisar eventos"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-9 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-4 animate-fade-in">
          {Array.from({ length: 8 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-9 w-9 text-red-400" />
          </div>
          <div>
            <p className="text-lg font-semibold">
              Nao foi possivel carregar os eventos
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              getEvents();
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      ) : eventos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold">Nenhum evento encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {name
                ? "Tente outro termo ou limpe a busca para ver mais resultados."
                : "Novos eventos aparecerao aqui assim que forem publicados."}
            </p>
          </div>
          {name && (
            <Button variant="outline" onClick={() => setName("")}>
              Limpar busca
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 animate-fade-in">
          {eventos.map((ev) => (
            <EventCard key={ev.id} event={ev} toggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}

      {!loading && !error && paginate.totalPages > 1 && (
        <div className="border-t bg-muted/30 p-4">
          <Pagination>
            <PaginationContent className="justify-center gap-4">
              <PaginationPrevious
                onClick={(e) => getEvents(paginate.currentPage - 1)}
                className={
                  paginate.currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
              <span className="text-sm font-medium">
                Página {paginate.currentPage} de {paginate.totalPages}
              </span>
              <PaginationNext
                onClick={(e) => getEvents(paginate.currentPage + 1)}
                className={
                  paginate.currentPage === paginate.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
}
