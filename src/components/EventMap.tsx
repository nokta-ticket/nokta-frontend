'use client';

import { useEffect, useRef } from 'react';

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

    // Leaflet só roda no browser
    import('leaflet').then((L) => {
      // Fix ícone padrão do Leaflet no Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initMap = (coords: [number, number]) => {
        if (!containerRef.current || mapRef.current) return;

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
      };

      if (lat !== undefined && lng !== undefined) {
        initMap([lat, lng]);
      } else {
        // Geocode via Nominatim
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
          .then((r) => r.json())
          .then((results) => {
            if (results?.[0]) {
              initMap([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
            }
          });
      }
    });

    // Carregar CSS do Leaflet dinamicamente
    if (!document.querySelector('#leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    return () => {
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
