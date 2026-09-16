/* Service worker.

   Regola unica: per pagine, JS e CSS si prova SEMPRE la rete per prima, e per
   questi file si chiede anche al browser di rivalidare la sua copia. La cache
   serve solo quando si e offline. Cosi non puo mai capitare di ritrovarsi con
   un HTML nuovo e uno script vecchio (i due si aspettano gli stessi elementi:
   se si disallineano, la pagina resta a meta).

   La versione va aumentata a ogni rilascio che tocca i file statici: in
   "activate" tutte le cache con un nome diverso vengono buttate via. */
const VERSIONE = 'v4';
const CACHE = 'allenamento-' + VERSIONE;

const STATICI = [
  '/css/style.css',
  '/js/comune.js',
  '/manifest.json',
  '/icone/icona-192.png',
  '/icone/icona-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATICI)).catch(() => {}));
  // Il nuovo service worker entra subito in servizio, senza aspettare
  // la chiusura delle schede aperte.
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// File che devono sempre essere rivalidati contro il server.
function daRivalidare(url) {
  return /\.(css|js)$/.test(url.pathname);
}

// File che ha senso conservare per l uso offline.
function daConservare(url) {
  return /\.(css|js|png|svg|webmanifest)$/.test(url.pathname) || url.pathname === '/manifest.json';
}

const PAGINA_OFFLINE =
  '<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<title>Senza connessione</title>' +
  '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d10;color:#eef2f6;' +
  'font-family:system-ui,sans-serif;text-align:center;padding:24px}' +
  'h1{font-size:1.3rem;margin:0 0 8px}p{color:#98a4b3;margin:0 0 20px}' +
  'button{padding:12px 20px;border:0;border-radius:14px;background:#ff7a2d;color:#24120a;' +
  'font:inherit;font-weight:600;cursor:pointer}</style></head><body><div>' +
  '<h1>Sei senza connessione</h1><p>Riprova quando torna la rete.</p>' +
  '<button onclick="location.reload()">Riprova</button></div></body></html>';

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== 'GET') return;

  const url = new URL(richiesta.url);
  if (url.origin !== self.location.origin) return;
  // Le API restano sempre fuori dalla cache: devono dire la verita del momento.
  if (url.pathname.startsWith('/api/')) return;

  const navigazione = richiesta.mode === 'navigate';

  evento.respondWith(
    (navigazione ? fetch(richiesta) : fetch(richiesta, daRivalidare(url) ? { cache: 'no-cache' } : undefined))
      .then((risposta) => {
        if (risposta && risposta.ok && daConservare(url)) {
          const copia = risposta.clone();
          caches.open(CACHE).then((c) => c.put(richiesta, copia)).catch(() => {});
        }
        return risposta;
      })
      .catch(() => {
        // Solo qui, cioe senza rete, si guarda nella cache.
        if (navigazione) {
          return new Response(PAGINA_OFFLINE, {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
        // Per gli altri file: la copia salvata se c e, altrimenti l errore vero,
        // mai una risposta di tipo sbagliato.
        return caches.match(richiesta).then((salvata) => salvata || Response.error());
      })
  );
});
