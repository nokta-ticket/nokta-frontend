"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Search } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";

type Address = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  numero: string;
  uf: string;
};

type EventoAPI = {
  id: string;
  nome: string;
  data: string; // yyyy-MM-dd
  horario: string; // HH:mm
  local: string;
  thumbnails: { url: string }[];
  endereco: Address;
  ativo: boolean;
};

interface GetEvents {
  data: EventoAPI[];
  paginate: Paginate;
}

type Filtro = "todos" | "ativos" | "inativos";

export default function AdminEventos() {
  const [eventos, setEventos] = useState<EventoAPI[]>([]);
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const debounceRef = useRef<null | NodeJS.Timeout>(null);

  function parseFilterValue(str: string) {
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
          nameOrStreet: busca,
        },
      });

      const data: EventoAPI[] = res.data.data;

      // const now = new Date();
      // const ajustados = data.map((e) => {
      //   const dateTime = new Date(`${e.data}T${e.horario}`);
      //   return { ...e, ativo: dateTime > now };
      // });
      setPaginate(res.data.paginate);
      setEventos(data);
    } catch (err: any) {
      toast.error(err.message ?? "Falha ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      getEvents();
    }, 1000);
  }, [busca]);

  useEffect(() => {
    getEvents();
  }, [filtro]);

  return (
    <section className="mx-auto w-full max-w-[1300px]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Todos os Eventos.</h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full lg:w-56">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Buscar por nome ou local"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
              }}
              className="pl-10 pr-4 py-2 bg-white text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div>
            <Button
              onClick={() => setFiltro("todos")}
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
              onClick={() => setFiltro("ativos")}
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
              onClick={() => setFiltro("inativos")}
              variant={filtro === "inativos" ? "default" : "outline"}
              className={`rounded-none rounded-r-lg ${
                filtro === "inativos"
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "text-sm"
              }`}
            >
              Inativos
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="py-20 text-center">Carregando…</p>
      ) : eventos.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Nenhum evento encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {eventos.map((ev) => {
            const cover = resolveThumbnailUrl(ev.thumbnails?.[0], MEDIA_FALLBACK);
            return (
              <div
                key={ev.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
              >
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={cover ?? MEDIA_FALLBACK}
                    alt={ev.nome}
                    fill
                    sizes="100%"
                    className="rounded-t-xl object-cover"
                  />
                </div>

                <div className="flex flex-col p-4">
                  <p className="flex items-center gap-1 text-sm font-medium text-violet-500">
                    <Calendar className="h-4 w-4" />
                    {formatarDataCurta(ev.data)}
                  </p>

                  <h2 className="mt-1 text-base font-semibold">{ev.nome}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {ev.endereco?.logradouro}, {ev.endereco?.numero} -{" "}
                    {ev.endereco?.localidade}
                  </p>

                  <Badge
                    className={
                      ev.ativo
                        ? "mt-2 bg-emerald-100 px-3 py-1 text-emerald-700"
                        : "mt-2 bg-gray-200 px-3 py-1 text-gray-600"
                    }
                  >
                    {ev.ativo ? "Ativo" : "Inativo"}
                  </Badge>

                  <Link href={`/admin/eventos/${ev.id}`}>
                    <Button
                      variant="outline"
                      className="mt-4 w-full border-violet-500 text-violet-600 hover:bg-violet-600 hover:text-white"
                    >
                      Editar evento
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
