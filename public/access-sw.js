// Nokta Access — service worker do scanner offline. Escopo restrito a
// /dashboard/check-in/ (ver registro em src/lib/access/register-sw.ts) —
// NUNCA registrado no site inteiro. public/sw.js continua existindo
// separadamente como anti-service-worker de propósito geral; este arquivo
// é o primeiro SW real do projeto, deliberadamente isolado por escopo.
const CACHE_NAME = "nokta-access-shell-v1";
const APP_SHELL_URLS = ["/dashboard/check-in"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS).catch(() => {})),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

// Cache-first só para o próprio app shell dentro do escopo — nunca
// intercepta chamadas de API (/access/*, /tickets/*), que precisam sempre
// ir à rede real (ou falhar explicitamente, para o app cair no fallback
// offline via IndexedDB, que é a fonte de verdade real, não o SW).
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.pathname.includes("/api/") || url.pathname.startsWith("/access/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached || new Response("Offline", { status: 503 }));
    }),
  );
});
