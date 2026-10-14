"use client";

import { useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, Loader2, AlertCircle, X } from "lucide-react";
import { ResaleCardSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/media";
import { normalizePagination, PaginationDetails } from "@/lib/pagination";

type ResaleStatus = 1 | 2 | 3 | 4;

interface MyResale {
  id: number;
  resalePrice: number;
  originalPrice: number;
  status: ResaleStatus;
  expiresAt: string;
  evento: {
    nome: string;
    data: string;
    endereco: { localidade: string; uf: string } | null;
    thumbnail: string | null;
  } | null;
  ingresso: { nome: string; lote: number } | null;
}

interface MyResaleListResponse {
  data: MyResale[];
  paginate?: {
    total?: number;
    perPage?: number;
    currentPage?: number;
    lastPage?: number;
  };
}

const STATUS_LABELS: Record<ResaleStatus, { label: string; color: string }> = {
  1: { label: "Ativo", color: "bg-green-100 text-green-700" },
  2: { label: "Vendido", color: "bg-blue-100 text-blue-700" },
  3: { label: "Cancelado", color: "bg-gray-100 text-gray-500" },
  4: { label: "Expirado", color: "bg-orange-100 text-orange-600" },
};

export default function MinhasRevendasPage() {
  const [resales, setResales] = useState<MyResale[]>([]);
  const [paginate, setPaginate] = useState<PaginationDetails>(
    normalizePagination(null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  async function fetchMyResales(targetPage = page) {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<MyResale[] | MyResaleListResponse>("/revenda/meus", {
        params: { page: targetPage, limit: 10 },
      });
      const payload = Array.isArray(res.data)
        ? {
            data: res.data,
            paginate: {
              total: res.data.length,
              perPage: res.data.length,
              currentPage: 1,
              lastPage: 1,
            },
          }
        : res.data;

      setResales(payload.data ?? []);
      setPaginate(normalizePagination(payload.paginate ?? null));
    } catch (err) {
      setResales([]);
      setPaginate(normalizePagination(null));
      setError(getErrorMessage(err, "Nao foi possivel carregar seus anuncios."));
      return;
      setError("Não foi possível carregar seus anúncios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMyResales(page);
  }, [page]);

  async function handleCancel(resaleId: number) {
    if (!confirm("Tem certeza? O ingresso voltará para sua carteira.")) return;
    try {
      setCancelling(resaleId);
      await api.delete(`/revenda/${resaleId}`);
      toast.success("Revenda cancelada com sucesso.");
      setResales((prev) => prev.map((r) => (r.id === resaleId ? { ...r, status: 3 } : r)));
    } catch {
      toast.error("Não foi possível cancelar o anúncio.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Anúncios de Revenda</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os ingressos que você colocou para revenda.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          {Array.from({ length: 4 }).map((_, i) => (
            <ResaleCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive opacity-70" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => fetchMyResales(page)}>
            Tentar novamente
          </Button>
        </div>
      ) : resales.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h2 className="text-lg font-semibold mb-2">Nenhum anúncio</h2>
          <p className="text-muted-foreground mb-6">
            Você ainda não colocou nenhum ingresso para revenda.
          </p>
          <Button onClick={() => (window.location.href = "/meus-ingressos")}>
            Ver meus ingressos
          </Button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {resales.map((r) => {
            const statusInfo = STATUS_LABELS[r.status] ?? STATUS_LABELS[3];
            return (
              <Card key={r.id} className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-full md:w-28 h-24 md:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {r.evento?.thumbnail ? (
                      <img
                        src={resolveMediaUrl(r.evento.thumbnail, null) ?? ""}
                        alt={r.evento?.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Ticket className="h-8 w-8 text-muted-foreground opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{r.evento?.nome ?? "Evento"}</h3>
                      <Badge className={`text-xs ${statusInfo.color} border-0`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    {r.ingresso && (
                      <p className="text-sm text-muted-foreground">
                        {r.ingresso.nome} — Lote {r.ingresso.lote}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                      {r.evento?.data && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.evento.data).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {r.evento?.endereco && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {r.evento.endereco?.localidade}, {r.evento.endereco?.uf}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price + Action */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Preço de revenda</div>
                      <div className="text-lg font-bold text-primary">
                        R$ {r.resalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    {r.status === 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleCancel(r.id)}
                        disabled={cancelling === r.id}
                      >
                        {cancelling === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {!error && paginate.lastPage > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {paginate.lastPage}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setPage((current) => Math.min(paginate.lastPage, current + 1))
            }
            disabled={page === paginate.lastPage}
          >
            Proxima
          </Button>
        </div>
      )}
    </div>
  );
}
