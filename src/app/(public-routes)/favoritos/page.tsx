'use client';

import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageState } from '@/components/ui/page-state';
import { Calendar, Heart, Search } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/axios';
import { toast } from '@/lib/toast';
import { formatarDataCurta } from '@/lib/formatarData';
import { resolveMediaUrl } from '@/lib/media';

const PLACEHOLDER = '/placeholder.png';
const ITEMS_PER_PAGE = 40;

type FavoriteEvent = {
  eventoId: string;
  nome: string;
  data: string;
  local: string;
  thumbnailUrl?: string | null;
};

function uniqById(items: FavoriteEvent[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.eventoId)) {
      return false;
    }

    seen.add(item.eventoId);
    return true;
  });
}

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);

  async function loadFavorites() {
    const token = Cookies.get('token');

    if (!token) {
      setRequiresLogin(true);
      setFavorites([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRequiresLogin(false);

      const response = await api.get<FavoriteEvent[]>('/eventos/favoritos');
      setFavorites(uniqById(response.data));
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Nao foi possivel carregar os favoritos.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFavorites();
  }, []);

  const filteredFavorites = useMemo(() => {
    if (!term.trim()) {
      return favorites;
    }

    const normalizedTerm = term.toLowerCase();

    return favorites.filter(
      (favorite) =>
        favorite.nome.toLowerCase().includes(normalizedTerm) ||
        favorite.local.toLowerCase().includes(normalizedTerm),
    );
  }, [favorites, term]);

  const totalPages = Math.max(1, Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE));
  const pageItems = filteredFavorites.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function unfavorite(eventId: string) {
    const token = Cookies.get('token');

    if (!token) {
      setRequiresLogin(true);
      toast.warn('Faca login para gerenciar favoritos.');
      return;
    }

    let removedFavorite: FavoriteEvent | undefined;

    setFavorites((current) => {
      removedFavorite = current.find((favorite) => favorite.eventoId === eventId);
      return current.filter((favorite) => favorite.eventoId !== eventId);
    });

    try {
      await api.delete(`/eventos/favoritos/${eventId}`);
      toast.success('Favorito removido com sucesso.');
    } catch (err) {
      console.error(err);
      toast.error(
        getErrorMessage(err, 'Nao foi possivel remover dos favoritos.'),
      );

      if (removedFavorite) {
        setFavorites((current) => uniqById([...current, removedFavorite!]));
      }
    }
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-[1300px] px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Meus Favoritos</h1>

        {!requiresLogin ? (
          <div className="relative hidden w-full max-w-sm md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Pesquisar favoritos"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-9 text-sm"
            />
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Carregando favoritos...
        </p>
      ) : requiresLogin ? (
        <PageState
          title="Entre para ver seus favoritos"
          description="Os eventos favoritados ficam salvos na sua conta e podem ser acessados daqui."
          actionLabel="Ir para login"
          onAction={() => {
            window.location.href = '/login';
          }}
        />
      ) : error ? (
        <PageState
          title="Nao foi possivel carregar os favoritos"
          description={error}
          actionLabel="Tentar novamente"
          onAction={() => {
            void loadFavorites();
          }}
        />
      ) : pageItems.length === 0 ? (
        <PageState
          title={term ? 'Nenhum favorito encontrado' : 'Voce ainda nao favoritou eventos'}
          description={
            term
              ? 'Tente outro termo de busca ou limpe o filtro para ver todos os seus favoritos.'
              : 'Quando voce favoritar um evento na vitrine, ele passa a aparecer aqui.'
          }
          actionLabel={term ? 'Limpar busca' : 'Ver eventos'}
          onAction={() => {
            if (term) {
              setTerm('');
              setPage(1);
              return;
            }

            window.location.href = '/eventos';
          }}
        />
      ) : (
        <div className="flex flex-wrap gap-4">
          {pageItems.map((event) => (
            <Card
              key={event.eventoId}
              className="flex w-[400px] flex-col overflow-hidden pt-0 transition-transform duration-300 hover:scale-105 hover:shadow-xl"
            >
              <AspectRatio ratio={16 / 9} className="relative">
                <Image
                  src={resolveMediaUrl(event.thumbnailUrl, PLACEHOLDER) ?? PLACEHOLDER}
                  alt={event.nome}
                  fill
                  sizes="(max-width:768px)100vw,(max-width:1024px)50vw,400px"
                  className="object-cover"
                  loading="lazy"
                  unoptimized
                />

                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-black backdrop-blur-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatarDataCurta(event.data)}
                </div>

                <button
                  onClick={(currentEvent) => {
                    currentEvent.stopPropagation();
                    void unfavorite(event.eventoId);
                  }}
                  aria-label="Remover dos favoritos"
                  className="absolute right-2 top-2 rounded-full bg-white/80 p-1 transition hover:scale-110 backdrop-blur-sm"
                >
                  <Heart className="h-5 w-5" fill="#ef4444" stroke="#ef4444" />
                </button>
              </AspectRatio>

              <CardContent className="px-4 pt-3">
                <h2 className="text-md font-semibold leading-tight">{event.nome}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{event.local}</p>
              </CardContent>

              <CardFooter className="px-4 pb-4">
                <Button
                  asChild
                  className="w-full border border-violet-500 bg-transparent text-violet-500 transition-colors hover:bg-violet-600 hover:text-white"
                >
                  <Link href={`/eventos/${event.eventoId}`}>Ver Ingressos</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && !requiresLogin && !error && filteredFavorites.length > 0 && totalPages > 1 ? (
        <div className="mb-16 mt-10 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, index) => (
                <PaginationItem key={index + 1}>
                  <PaginationLink
                    isActive={page === index + 1}
                    onClick={() => setPage(index + 1)}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </section>
  );
}
