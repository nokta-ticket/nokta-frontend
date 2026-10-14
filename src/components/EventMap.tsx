"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
// Importado estaticamente (não injetado via <link> de CDN): o CSP do site
// só libera style-src 'self' — um <link> pra unpkg.com é bloqueado pelo
// navegador (erro de console, silencioso pro usuário), e a Promise que
// esperava o evento 'load' do <link> nunca resolvia, deixando o mapa
// vazio pra sempre em produção. Next.js empacota este CSS como parte do
// próprio bundle (mesma origem), sem depender de CDN externa.
import "leaflet/dist/leaflet.css";
import api from "@/lib/axios";
import { Icon } from "@/components/ui/icon";

interface EventMapProps {
  address: string;
  lat?: number;
  lng?: number;
  /** Altura em px do mapa — default 180 (usado na página de evento). A Home pública do Venue usa um valor menor (mapa ilustrativo ao lado do endereço). */
  height?: number;
  /** Default true. Desligar em mapas pequenos/ilustrativos — os botões dominam um mapa de ~90px de altura. */
  showZoomControls?: boolean;
}

/**
 * Mapa estático (Leaflet + tiles escuros da Carto) com um marcador no
 * endereço. Não arrasta nem dá zoom com a roda — é ilustrativo; os botões
 * de zoom são os únicos controles.
 */
export function EventMap({ address, lat, lng, height = 180, showZoomControls = true }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Ícones do marker servidos pelo próprio domínio (/leaflet/*.png),
      // nunca unpkg.com — mesmo motivo do CSS: bloqueados pelo CSP em
      // produção (img-src aceita https: amplo, mas evitar dependência de
      // CDN externa que já causou um bug real aqui).
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const initMap = (coords: [number, number]) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          center: coords,
          zoom: 15,
          zoomControl: false,
          scrollWheelZoom: false,
          dragging: false,
          doubleClickZoom: false,
          attributionControl: false,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 20 }).addTo(map);
        L.marker(coords).addTo(map);
        mapRef.current = map;

        // invalidateSize() recalcula o viewport se o container mudar de
        // tamanho depois de montado (ex.: dentro de um dialog/accordion
        // que só assume a altura final após a primeira pintura) — sem
        // isso, o Leaflet fica preso nas dimensões medidas na hora do
        // L.map(), mesmo que o elemento cresça depois.
        requestAnimationFrame(() => map.invalidateSize());
        resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(containerRef.current);
      };

      if (lat !== undefined && lng !== undefined) {
        initMap([lat, lng]);
      } else {
        // Geocoding via backend (nunca direto do Nominatim no browser —
        // respostas cacheadas por eles às vezes vêm sem
        // Access-Control-Allow-Origin, e o fetch é bloqueado por CORS
        // silenciosamente, sem erro visível: o mapa fica vazio pra sempre).
        api
          .get<{ lat: number | null; lng: number | null }>("/geocoding", { params: { address } })
          .then(({ data }) => {
            if (data.lat !== null && data.lng !== null) initMap([data.lat, data.lng]);
          })
          .catch(() => {});
      }
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [address, lat, lng]);

  return (
    <div className="relative bg-surface-2" style={{ height }}>
      <div ref={containerRef} className="size-full" />

      {showZoomControls ? (
        <div className="absolute right-2 top-2 z-[999] flex flex-col overflow-hidden rounded-lg border border-border bg-surface/95 shadow-thumb backdrop-blur-sm">
          <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Aproximar" className="flex size-8 items-center justify-center text-foreground transition-colors hover:bg-surface-2">
            <Icon name="plus" size={12} />
          </button>
          <span className="h-px bg-border" aria-hidden />
          <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Afastar" className="flex size-8 items-center justify-center text-foreground transition-colors hover:bg-surface-2">
            <Icon name="minus" size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
