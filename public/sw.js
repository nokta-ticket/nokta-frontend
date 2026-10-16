/*
 * Service worker da Nokta Tickets: SÓ notificações (Web Push).
 *
 * Não tem handler de `fetch` de propósito: nada é guardado em cache e o site
 * nunca serve página velha. Até 2026-10-16 este arquivo era um
 * "anti-service-worker" que se removia (limpeza de um cache antigo); quem
 * ainda tiver aquele registrado recebe este no lugar, que também não guarda
 * nada.
 *
 * O payload vem de PushService (nokta-api, src/integrations/push/push.service.ts):
 * { title, body, url, image?, tag?, marketing?: { unsubscribeToken, organizationName }, receiptToken? }.
 * Mudar um lado, mudar o outro.
 */

const API_BY_HOST = {
  'www.noktatickets.com.br': 'https://api.noktatickets.com.br/api',
  'noktatickets.com.br': 'https://api.noktatickets.com.br/api',
  'app.nokta.live': 'https://api.nokta.live/api',
  'www.nokta.live': 'https://api.noktatickets.com.br/api',
  'nokta.live': 'https://api.noktatickets.com.br/api',
};

function apiBase() {
  const fromQuery = new URL(self.location.href).searchParams.get('api');
  if (fromQuery && /^https?:\/\/(localhost(:\d+)?|api\.noktatickets\.com\.br|api\.nokta\.live)\/api$/.test(fromQuery)) return fromQuery;
  return API_BY_HOST[self.location.hostname] || 'https://api.noktatickets.com.br/api';
}

function post(path, body) {
  return fetch(apiBase() + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
    credentials: 'omit',
    keepalive: true,
  }).catch(() => undefined);
}

/** Só abre páginas do próprio site (o backend já garante, isto é a segunda trava). */
function safeUrl(raw) {
  try {
    const url = new URL(raw || '/', self.location.origin);
    if (url.origin !== self.location.origin && !/(^|\.)noktatickets\.com\.br$/.test(url.hostname)) return self.location.origin + '/';
    return url.href;
  } catch {
    return self.location.origin + '/';
  }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Nokta Tickets', body: event.data ? event.data.text() : '' };
  }
  const actions = data.marketing ? [{ action: 'stop', title: 'Parar de receber' }] : [];
  const options = {
    body: data.body || '',
    icon: '/brand/app-icon-192.png',
    badge: '/brand/app-badge-96.png',
    image: data.image || undefined,
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: safeUrl(data.url), marketing: data.marketing || null, receiptToken: data.receiptToken || null },
    actions,
  };
  const shown = self.registration.showNotification(data.title || 'Nokta Tickets', options);
  const receipt = data.receiptToken ? post('/crm/push-receipts', { token: data.receiptToken, event: 'shown' }) : Promise.resolve();
  event.waitUntil(Promise.all([shown, receipt]));
});

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};
  event.notification.close();

  if (event.action === 'stop' && data.marketing && data.marketing.unsubscribeToken) {
    event.waitUntil(
      post('/crm/unsubscribe/' + encodeURIComponent(data.marketing.unsubscribeToken)).then(() =>
        self.registration.showNotification('Pronto', {
          body: 'Você não vai mais receber avisos de ' + (data.marketing.organizationName || 'este produtor') + '.',
          icon: '/brand/app-icon-192.png',
          badge: '/brand/app-badge-96.png',
          tag: 'push-stop-confirmation',
        }),
      ),
    );
    return;
  }

  const url = data.url || self.location.origin + '/';
  const receipt = data.receiptToken ? post('/crm/push-receipts', { token: data.receiptToken, event: 'clicked' }) : Promise.resolve();
  const open = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
        return client.focus().then((c) => (c && 'navigate' in c ? c.navigate(url) : undefined)).catch(() => self.clients.openWindow(url));
      }
    }
    return self.clients.openWindow(url);
  });
  event.waitUntil(Promise.all([open, receipt]));
});

// O navegador trocou a inscrição (expirou): o site refaz a inscrição na próxima visita (PushSync).
self.addEventListener('pushsubscriptionchange', () => undefined);
