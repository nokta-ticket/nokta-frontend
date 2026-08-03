'use client';

import { useEffect, useRef } from 'react';
import api from '@/lib/axios';

interface EventMapProps {
  address: string;
  lat?: number;
  lng?: number;
}

export function EventMap({ address, lat, lng }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    // O Leaflet mede a grade de tiles usando o CSS dele (altura da linha,
    // overflow etc.) — inicializar antes do <link> carregar faz o mapa
    // calcular um viewport errado (renderiza só um pedaço no canto, o
    // resto fica em branco). Espera o CSS estar de fato aplicado antes de
    // montar o mapa, nunca dispara os dois em paralelo.
    const ensureLeafletCss = () =>
      new Promise<void>((resolve) => {
        const existing = document.querySelector<HTMLLinkElement>('#leaflet-css');
        if (existing) {
          // Já pode ter carregado antes deste efeito rodar.
          if (existing.sheet) resolve();
          else existing.addEventListener('load', () => resolve(), { once: true });
          return;
        }
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.addEventListener('load', () => resolve(), { once: true });
        document.head.appendChild(link);
      });

    Promise.all([import('leaflet'), ensureLeafletCss()]).then(([L]) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Fix ícone padrão do Leaflet no Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
    <div className="relative" style={{ height: 180 }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* Botões de zoom */}
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
    </div>
  );
}
