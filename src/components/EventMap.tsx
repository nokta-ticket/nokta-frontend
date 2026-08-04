'use client';

import { useEffect, useRef } from 'react';
// Importado estaticamente (não injetado via <link> de CDN): o CSP do site
// só libera style-src 'self' — um <link> pra unpkg.com é bloqueado pelo
// navegador (erro de console, silencioso pro usuário), e a Promise que
// esperava o evento 'load' do <link> nunca resolvia, deixando o mapa
// vazio pra sempre em produção. Next.js empacota este CSS como parte do
// próprio bundle (mesma origem), sem depender de CDN externa.
import 'leaflet/dist/leaflet.css';
import api from '@/lib/axios';

interface EventMapProps {
  address: string;
  lat?: number;
  lng?: number;
  /** Altura em px do mapa — default 180 (usado na página de evento). A Home pública do Venue usa um valor menor (mapa ilustrativo ao lado do endereço). */
  height?: number;
  /** Default true. Desligar em mapas pequenos/ilustrativos — os botões (28px cada) dominam um mapa de ~90px de altura. */
  showZoomControls?: boolean;
}

export function EventMap({ address, lat, lng, height = 180, showZoomControls = true }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Ícones do marker servidos pelo próprio domínio (/leaflet/*.png),
      // nunca unpkg.com — mesmo motivo do CSS: bloqueados pelo CSP em
      // produção (img-src aceita https: amplo, mas evitar dependência de
      // CDN externa que já causou um bug real aqui).
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: '/leaflet/marker-icon.png',
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        shadowUrl: '/leaflet/marker-shadow.png',
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

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
        }).addTo(map);

        L.marker(coords).addTo(map);

        // Botões de zoom customizados já estão no JSX — expõe métodos
        (containerRef.current as any)._leafletMap = map;
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
          .get<{ lat: number | null; lng: number | null }>('/geocoding', { params: { address } })
          .then(({ data }) => {
            if (data.lat !== null && data.lng !== null) {
              initMap([data.lat, data.lng]);
            }
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

  const zoomIn  = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className="relative" style={{ height }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* Botões de zoom */}
      {showZoomControls ? (
        <div className="absolute top-2 right-2 flex flex-col gap-px z-[999]">
          <button
            onClick={zoomIn}
            className="h-7 w-7 flex items-center justify-center rounded-t-lg bg-white shadow text-gray-700 hover:bg-gray-50 text-base font-bold leading-none transition"
            aria-label="Zoom in"
          >+</button>
          <button
            onClick={zoomOut}
            className="h-7 w-7 flex items-center justify-center rounded-b-lg bg-white shadow text-gray-700 hover:bg-gray-50 text-base font-bold leading-none transition"
            aria-label="Zoom out"
          >−</button>
        </div>
      ) : null}
    </div>
  );
}
