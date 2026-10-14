"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { EventoAPI } from "@/interfaces/events";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { EventCard, EventCardSkeleton, EventRow, EventRowSkeleton } from "@/components/events/event-card";

const ITEMS_PER_PAGE = 40;

type FavoriteEvent = {
  eventoId: string;
  slug?: string | null;
  nome: string;
  data: string;
  local: string;
  thumbnailUrl?: string | null;
};

function uniqById(items: FavoriteEvent[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.eventoId)) return false;
    seen.add(item.eventoId);
    return true;
  });
}

/** O favorito vem resumido da API; vira o formato dos cards de evento. */
function toEvento(f: FavoriteEvent): EventoAPI {
  return {
    id: f.eventoId,
    slug: f.slug,
    nome: f.nome,
    data: f.data,
    horario: "",
    local: f.local,
    thumbnails: f.thumbnailUrl ? [{ url: f.thumbnailUrl }] : [],
    endereco: { cep: "", logradouro: "", bairro: "", localidade: "", numero: "", uf: "" },
    ativo: true,
    isFavorite: true,
  };
}

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);

  async function loadFavorites() {
    // Fase 5: sessão é cookie HttpOnly (ilegível por JS) — "user" é o sinal
    // local de "provavelmente autenticado" (ver AuthContext).
    const token = Cookies.get("user");

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
      const response = await api.get<FavoriteEvent[]>("/eventos/favoritos");
      setFavorites(uniqById(response.data));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os favoritos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFavorites();
  }, []);

  const filteredFavorites = useMemo(() => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) return favorites;
    return favorites.filter((favorite) => favorite.nome.toLowerCase().includes(normalizedTerm) || favorite.local.toLowerCase().includes(normalizedTerm));
  }, [favorites, term]);

  const totalPages = Math.max(1, Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE));
  const visible = filteredFavorites.slice(0, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function unfavorite(eventId: string) {
    const token = Cookies.get("user");

    if (!token) {
      setRequiresLogin(true);
      toast.warn("Faça login para gerenciar favoritos.");
      return;
    }

    let removedFavorite: FavoriteEvent | undefined;

    setFavorites((current) => {
      removedFavorite = current.find((favorite) => favorite.eventoId === eventId);
      return current.filter((favorite) => favorite.eventoId !== eventId);
    });

    try {
      await api.delete(`/eventos/favoritos/${eventId}`);
      toast.success("Removido dos favoritos.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover dos favoritos."));
      if (removedFavorite) {
        const restored = removedFavorite;
        setFavorites((current) => uniqById([...current, restored]));
      }
    }
  }

  const events = visible.map(toEvento);
  const showSearch = !loading && !requiresLogin && !error && favorites.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <h1 className="font-display text-[2rem] uppercase leading-none text-foreground lg:text-display">Favoritos</h1>
      {showSearch ? (
        <SearchInput
          id="busca-favoritos"
          value={term}
          onChange={(value) => {
            setTerm(value);
            setPage(1);
          }}
          placeholder="Buscar nos favoritos"
          className="mt-4 lg:max-w-2xl [&_button]:right-3 [&_input]:h-14 [&_input]:rounded-pill [&_input]:bg-surface [&_input]:pl-12 [&_input]:text-base [&_input]:shadow-card [&_svg]:left-5 [&_svg]:text-base"
        />
      ) : null}

      {loading ? (
        <>
          <div className="mt-6 space-y-2.5 lg:hidden">{Array.from({ length: 4 }).map((_, i) => <EventRowSkeleton key={i} />)}</div>
          <div className="mt-8 hidden grid-cols-4 gap-6 lg:grid">{Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}</div>
        </>
      ) : requiresLogin ? (
        <EmptyState
          icon="heart"
          title="Entre pra ver seus favoritos"
          description="Os rolês que você salvar ficam guardados na sua conta."
          action={
            <Button asChild variant="contrast" shape="pill">
              <Link href="/login">Entrar</Link>
            </Button>
          }
          className="mt-6"
        />
      ) : error ? (
        <ErrorState title="Não deu pra carregar os favoritos" description={error} onRetry={() => void loadFavorites()} className="mt-6" />
      ) : events.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={term ? "Nenhum favorito com esse nome" : "Você ainda não salvou nenhum rolê"}
          description={term ? "Tenta outro termo ou limpa a busca." : "Toca no coração de um evento e ele aparece aqui."}
          action={
            term ? (
              <Button
                variant="outline"
                shape="pill"
                onClick={() => {
                  setTerm("");
                  setPage(1);
                }}
              >
                Limpar busca
              </Button>
            ) : (
              <Button asChild variant="contrast" shape="pill">
                <Link href="/eventos">Explorar eventos</Link>
              </Button>
            )
          }
          className="mt-6"
        />
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground tnum">
            {filteredFavorites.length} {filteredFavorites.length === 1 ? "evento salvo" : "eventos salvos"}
          </p>
          <div className="mt-4 space-y-2.5 lg:hidden">
            {events.map((e, i) => (
              <div key={e.id} className="row-in" style={{ ["--i" as string]: i % 12 } as React.CSSProperties}>
                <EventRow event={e} onToggleFavorite={(id) => void unfavorite(id)} />
              </div>
            ))}
          </div>
          <div className="mt-6 hidden grid-cols-4 gap-6 lg:grid">
            {events.map((e, i) => (
              <EventCard key={e.id} event={e} onToggleFavorite={(id) => void unfavorite(id)} className="fade-up" style={{ ["--i" as string]: i % 8 } as React.CSSProperties} />
            ))}
          </div>
          {page < totalPages ? (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" shape="pill" onClick={() => setPage((p) => p + 1)}>
                Mostrar mais
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
