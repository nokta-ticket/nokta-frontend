"use client";
import { useState, useEffect } from "react";
import FilterBar from "@/components/FilterBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Ticket, Search, ArrowUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ResaleCardSkeleton } from "@/components/ui/skeleton";
import { Filters } from "@/types/filters";
import api, { getErrorMessage } from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";
import { normalizePagination, PaginationDetails } from "@/lib/pagination";

interface ResaleItem {
  id: number;
  buyerPrice: number;
  sellerAmount: number;
  originalPrice: number;
  status: number;
  expiresAt: string;
  evento: {
    id: number;
    nome: string;
    data: string;
    horario: string;
    endereco: { localidade: string; uf: string } | null;
    thumbnail: string | null;
  } | null;
  ingresso: { nome: string; tipo: number; lote: number } | null;
}

interface ResaleListResponse {
  data: ResaleItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  paginate?: {
    total: number;
    perPage?: number;
    currentPage?: number;
    lastPage?: number;
  };
}

const RevendaPage = () => {
  const [resales, setResales] = useState<ResaleItem[]>([]);
  const [paginate, setPaginate] = useState<PaginationDetails>(
    normalizePagination(null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    city: "all-cities",
    date: null,
    category: "all-categories",
    sortBy: "closest",
  });
  const [visibleCount, setVisibleCount] = useState(6);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    async function fetchResales() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<ResaleListResponse>("/revenda", {
          params: { page: 1, limit: 100 },
        });
        setResales(res.data.data ?? []);
        setPaginate(
          normalizePagination(res.data.paginate ?? res.data.meta ?? null)
        );
      } catch (err) {
        console.error(err);
        setResales([]);
        setPaginate(normalizePagination(null));
        setError(
          getErrorMessage(
            err,
            "Nao foi possivel carregar os ingressos disponiveis."
          )
        );
      } finally {
        setLoading(false);
      }
    }
    fetchResales();
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const normalizeText = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredResales = resales
    .filter((r) => {
      const nomeEvento = r.evento?.nome ?? "";
      const cidade = r.evento?.endereco
        ? `${r.evento?.endereco?.localidade} ${r.evento?.endereco?.uf}`
        : "";
      const normalizedSearch = normalizeText(searchQuery);
      const matchesSearch =
        normalizeText(nomeEvento).includes(normalizedSearch) ||
        normalizeText(cidade).includes(normalizedSearch);
      const matchesCity =
        filters.city === "all-cities" ||
        normalizeText(cidade).includes(normalizeText(filters.city));
      let matchesDate = true;
      if (filters.date && r.evento?.data) {
        const eventDate = new Date(r.evento.data);
        const filterDate = new Date(filters.date);
        matchesDate = eventDate.toDateString() === filterDate.toDateString();
      }
      return matchesSearch && matchesCity && matchesDate;
    })
    .sort((a, b) => {
      if (filters.sortBy === "closest") {
        return new Date(a.evento?.data ?? 0).getTime() - new Date(b.evento?.data ?? 0).getTime();
      }
      if (filters.sortBy === "recent") {
        return new Date(b.evento?.data ?? 0).getTime() - new Date(a.evento?.data ?? 0).getTime();
      }
      return 0;
    });

  const displayedResales = filteredResales.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResales.length;
  const loadMore = () => setVisibleCount((prev) => prev + 6);
  const showLess = () => {
    const cards = document.querySelectorAll("[data-resale-card]");
    setVisibleCount(6);
    setTimeout(() => cards[5]?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen flex flex-col">
      <button
        onClick={scrollToTop}
        className={`fixed right-6 bottom-6 z-40 p-3 rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-primary hover:scale-110 hover:shadow-xl ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary/10 via-primary-glow/5 to-background py-8 md:py-16 overflow-hidden">
          <div className="container relative px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent leading-tight">
                Revenda oficial
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 font-bold">
                Transferência imediata • Pagamento protegido.
              </p>
              <div className="flex flex-col gap-4 max-w-2xl mx-auto pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Evento, cidade ou setor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-sm md:text-base bg-white"
                  />
                </div>
                <FilterBar filters={filters} onFiltersChange={setFilters} />
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="container py-8 md:py-12 px-4 mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
              {Array.from({ length: 6 }).map((_, i) => (
                <ResaleCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-12 w-12 text-destructive opacity-70" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  {filteredResales.length} ingressos disponíveis
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Ingressos verificados e prontos para compra
                </p>
              </div>

              {filteredResales.length === 0 ? (
                <div className="text-center py-16">
                  <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum ingresso disponível</h3>
                  <p className="text-muted-foreground">Tente ajustar sua busca ou volte mais tarde</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
                    {displayedResales.map((r) => (
                      <Card
                        key={r.id}
                        data-resale-card
                        className="overflow-hidden group cursor-pointer border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 py-0"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          {r.evento?.thumbnail ? (
                            <img
                              src={resolveMediaUrl(r.evento.thumbnail, null) ?? ""}
                              alt={r.evento.nome}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Ticket className="h-12 w-12 text-muted-foreground opacity-40" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary/90 backdrop-blur-sm text-white border-0 shadow-lg">
                              <Ticket className="h-3 w-3 mr-1" /> Revenda
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4 md:p-5 space-y-3">
                          <h3 className="font-bold text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {r.evento?.nome ?? "Evento"}
                          </h3>
                          <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
                            {r.evento?.data && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>
                                  {new Date(r.evento.data).toLocaleDateString("pt-BR", {
                                    day: "2-digit", month: "long", year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                            {r.evento?.endereco && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="line-clamp-1">
                                  {r.evento?.endereco?.localidade}, {r.evento?.endereco?.uf}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="pt-3 border-t flex items-center justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground">Preço</div>
                              <div className="text-lg md:text-xl font-bold text-primary">
                                R$ {(r.buyerPrice ?? r.originalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <Link href={`/revenda/${r.id}`}>
                              <Button size="sm" className="shadow-sm">Ver ingresso</Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <Button onClick={loadMore} size="lg" variant="outline" className="w-full sm:w-auto">
                        Ver mais ingressos
                      </Button>
                    </div>
                  )}
                  {!hasMore && visibleCount > 6 && (
                    <div className="flex justify-center mt-8">
                      <Button onClick={showLess} size="lg" variant="outline" className="w-full sm:w-auto">
                        Ver menos
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-primary/5 via-primary-glow/5 to-background py-12 md:py-20">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-2xl md:text-4xl font-bold">Tem ingressos para vender?</h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Anuncie seus ingressos de forma rápida, segura e gratuita
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button size="lg" className="w-full sm:w-auto shadow-lg">
                  <Ticket className="mr-2 h-5 w-5" /> Anunciar meus ingressos
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Saiba mais</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
export default RevendaPage;
