// Dee Chess service worker: keeps the app, the chess rules and the engine on
// the phone so the app works with no internet after the first visit.
const CACHE = "dee-chess-v2";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./engine-worker.js",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js",
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(CORE.map((url) => cache.add(new Request(url, { mode: url.startsWith("http") ? "cors" : "same-origin" })).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Serve from the phone first; refresh the saved copy in the background.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate";
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(isPage ? "./index.html" : req, { ignoreSearch: isPage });
      const network = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(isPage ? "./index.html" : req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
