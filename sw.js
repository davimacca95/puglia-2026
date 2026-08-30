/* Service worker dell'itinerario in Puglia.
   Obiettivo: la pagina si apre ANCHE SENZA RETE. Fra Vieste e il Gargano il campo va
   e viene, e il programma serve proprio la.

   Strategia: network-first con fallback alla cache per i file dell'app, cosi con la
   rete vedi sempre l'ultima versione e senza rete quella salvata. Le tessere della
   mappa (altro origin) restano fuori: sono centinaia di file e riempirebbero lo
   spazio. Senza rete la mappa mostra il suo avviso, il resto funziona.

   VERSION si deriva dallo SHA del contenuto in build_puglia.py: non si bumpa a mano. */
var VERSION = "5972b5541a8b";
var CACHE = 'puglia-2026-' + VERSION;
var URLS = ['/puglia-2026/', '/puglia-2026/index.html', '/puglia-2026/manifest.json',
            '/puglia-2026/icon-192.png', '/puglia-2026/icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(URLS); })
    .catch(function () { /* un file che manca non deve impedire l'installazione */ }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (n) { return n !== CACHE; })
      .map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.status === 200) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      return hit || caches.match('/puglia-2026/index.html');
    });
  }));
});
