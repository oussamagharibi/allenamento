/* Service worker: la rete viene sempre provata per prima, la cache serve solo
   come rete di salvataggio quando si e offline. Cosi non si resta mai con
   file vecchi dopo un aggiornamento. */
const CACHE = 'allenamento-v1';
const STATICI = [
  '/css/style.css',
  '/js/comune.js',
  '/manifest.json',
  '/icone/icona-192.png',
  '/icone/icona-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATICI)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== 'GET') return;

  const url = new URL(richiesta.url);
  if (url.origin !== self.location.origin) return;
  // Le API e le pagine protette non finiscono mai in cache.
  if (url.pathname.startsWith('/api/')) return;

  evento.respondWith(
    fetch(richiesta)
      .then((risposta) => {
        if (risposta && risposta.ok && /\.(css|js|png|json|webmanifest)$/.test(url.pathname)) {
          const copia = risposta.clone();
          caches.open(CACHE).then((c) => c.put(richiesta, copia)).catch(() => {});
        }
        return risposta;
      })
      .catch(() => caches.match(richiesta).then((salvata) => salvata || caches.match('/css/style.css')))
  );
});
