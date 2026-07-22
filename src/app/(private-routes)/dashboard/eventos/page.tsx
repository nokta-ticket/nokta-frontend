"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter } from "next/navigation";
import { useOrganizations } from "@/context/OrganizationContext";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatarDataCurta } from "@/lib/formatarData";
import { Paginate } from "@/interfaces/paginate";
import { PageContainer } from "../_components/page/page-container";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { DeleteEventoDialog } from "./_components/dialogs/delete-evento-dialog";
import { CancelEventoDialog } from "./_components/dialogs/cancel-evento-dialog";
import { N2VerificationBanner } from "./_components/n2-verification-banner";

// EventStatus: 1=DRAFT 2=PUBLISHED 3=CANCELLED 4=FINISHED
const STATUS_BADGE: Record<number, { label: string; className: string }> = {
  1: { label: "Rascunho",   className: "bg-gray-100 text-gray-600" },
  2: { label: "Ativo",      className: "bg-emerald-100 text-emerald-700" },
  3: { label: "Cancelado",  className: "bg-red-100 text-red-600" },
  4: { label: "Finalizado", className: "bg-blue-100 text-blue-600" },
};

type Thumbnail = { id?: string; url: string };

type Address = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  numero: string;
  uf: string;
};

type EventoAPI = {
  id: number;
  nome: string;
  data: string;
  horario: string;
  status: number;
  thumbnails: Thumbnail[];
  endereco: Address;
};

interface GetEvents {
  data: EventoAPI[];
  paginate: Paginate;
}

/**
 * Rota canônica de Eventos (Fase 5 — substitui o hub que só linkava para
 * `/produtor/*`). A listagem é escopada pela organização ativa
 * (`organizationId`, ver docs/platform/unified-navigation.md "Fase 5") —
 * trocar de organização troca os eventos exibidos.
 */
export default function EventosPage() {
  const router = useRouter();
  const { currentOrg, loadingOrgs } = useOrganizations();
  const [filtro, setFiltro] = useState<"todos" | "ativos" | "inativos">("todos");
  const [eventos, setEventos] = useState<EventoAPI[]>([]);
  const [paginate, setPaginate] = useState<Paginate>({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  function parseFilterValue(str: string) {
    switch (str) {
      case "ativos":   return 2; // EventStatus.PUBLISHED
      case "inativos": return 1; // EventStatus.DRAFT
      default:         return null;
    }
  }

  async function getEvents(page = 1) {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const res = await api.get<GetEvents>("/produtor/eventos", {
        params: { organizationId: currentOrg.id, page, status: parseFilterValue(filtro) },
      });
      setPaginate(res.data.paginate);
      setEventos(res.data.data);
    } catch (err: any) {
      toast.error(err.message ?? "Falha ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  }

  function goToEditor(eventId: number) {
    router.push(`/dashboard/eventos/${eventId}`);
  }

  useEffect(() => {
    getEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, currentOrg?.id]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/produtor/eventos/${id}`);
      await getEvents();
      toast.success("Evento excluído com sucesso");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao excluir evento");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.patch(`/produtor/eventos/${id}/cancelar`);
      await getEvents();
      toast.success("Evento cancelado com sucesso");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao cancelar evento");
    }
  };

  if (loadingOrgs) {
    return (
      <PageContainer>
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!currentOrg) {
    return (
      <PageContainer>
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para ver os eventos." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <N2VerificationBanner />

      <section className="w-full max-w-[1300px] mx-auto mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold">Eventos</h1>

          <div className="flex items-center gap-4">
            <div>
              <Button
                onClick={() => setFiltro("todos")}
                variant={filtro === "todos" ? "default" : "outline"}
                className={`rounded-none rounded-l-lg ${filtro === "todos" ? "bg-violet-600 text-white hover:bg-violet-700" : "text-sm"}`}
              >
                Todos
              </Button>
              <Button
                onClick={() => setFiltro("ativos")}
                variant={filtro === "ativos" ? "default" : "outline"}
                className={`rounded-none ${filtro === "ativos" ? "bg-violet-600 text-white hover:bg-violet-700" : "text-sm"}`}
              >
                Ativos
              </Button>
              <Button
                onClick={() => setFiltro("inativos")}
                variant={filtro === "inativos" ? "default" : "outline"}
                className={`rounded-none rounded-r-lg ${filtro === "inativos" ? "bg-violet-600 text-white hover:bg-violet-700" : "text-sm"}`}
              >
                Rascunhos
              </Button>
            </div>

            <Link href="/dashboard/eventos/criar">
              <Button>
                <PlusCircleIcon className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-20">Carregando...</p>
        ) : eventos.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground">
            Nenhum evento encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {eventos.map((ev) => {
              const badge = STATUS_BADGE[ev.status] ?? { label: "Desconhecido", className: "bg-gray-100 text-gray-500" };
              const isPublished  = ev.status === 2;
              const isDraft      = ev.status === 1;

              return (
                <div
                  key={ev.id}
                  className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition hover:-translate-y-[2px] bg-white"
                >
                  <div className="w-full aspect-[16/9] relative bg-gray-100">
                    {ev.thumbnails[0]?.url ? (
                      <Image
                        src={process.env.NEXT_PUBLIC_STORAGE_URL + ev.thumbnails[0].url}
                        alt={ev.nome}
                        fill
                        sizes="100%"
                        className="object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center rounded-t-xl bg-gray-100">
                        <span className="text-xs text-gray-400">Sem imagem</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col p-4">
                    <p className="text-sm text-violet-500 font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatarDataCurta(ev.data)}
                    </p>

                    <h2 className="text-base font-semibold mt-1">{ev.nome}</h2>

                    <p className="text-sm text-muted-foreground">
                      {ev.endereco?.logradouro}, {ev.endereco?.numero} – {ev.endereco?.localidade}
                    </p>

                    <div className="mt-2 mb-4">
                      <Badge className={`${badge.className} px-3 py-1`}>
                        {badge.label}
                      </Badge>
                    </div>

                    {/* Visualizar — sempre disponível */}
                    <Link href={`/eventos/${ev.id}`} target="_blank">
                      <Button variant="outline" className="mb-2 w-full border-violet-500 text-violet-600 hover:text-white hover:bg-violet-600">
                        Visualizar
                      </Button>
                    </Link>

                    {/* Publicado: editar + cancelar */}
                    {isPublished && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => goToEditor(ev.id)}
                          className="mb-2 w-full border-violet-500 text-violet-600 hover:text-white hover:bg-violet-600"
                        >
                          Editar
                        </Button>
                        <CancelEventoDialog
                          eventId={ev.id}
                          eventName={ev.nome}
                          onConfirm={handleCancel}
                        />
                      </>
                    )}

                    {/* Rascunho: editar + excluir */}
                    {isDraft && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => goToEditor(ev.id)}
                          className="mb-2 w-full border-violet-500 text-violet-600 hover:text-white hover:bg-violet-600"
                        >
                          Editar
                        </Button>
                        <DeleteEventoDialog
                          eventId={ev.id}
                          eventName={ev.nome}
                          onConfirm={handleDelete}
                        />
                      </>
                    )}

                    {/* Cancelado / Finalizado: sem ações adicionais */}
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
                    className={paginate.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                    className={paginate.currentPage === paginate.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    onClick={() => getEvents(paginate.currentPage + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
