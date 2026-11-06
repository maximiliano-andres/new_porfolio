/* Service worker: near-instant repeat visits and offline support.
   - /assets/* (content-hashed, immutable), /fonts/*, /img/*: cache first
   - page navigations: network first (with navigation preload), so a new deploy is seen immediately. Only the app
     shell ("/", text/html) is ever cached; offline, or when the network hangs ("lie-fi"), app routes get that
     cached shell. Navigations to files (/cv/….pdf, /robots.txt…) are never cached nor answered with the shell.
   - /api/* and other origins: never touched
   BUILD is replaced by a hash of the whole dist/ on every `npm run build` (frontend/scripts/prerender.mjs): each
   deploy ships a byte-different sw.js, the browser installs it and the caches of the previous build are purged on
   activate — no manual VERSION bump. Bump VERSION only when this file's caching logic changes. */
const VERSION = "v3"; // v3: purges caches where v2 stored any navigation (e.g. the CV PDF) as the offline home page
const BUILD = "dev";
const STATIC_CACHE = `static-${VERSION}-${BUILD}`;
const PAGE_CACHE = `pages-${VERSION}-${BUILD}`;
const MAX_STATIC_ENTRIES = 80; // safety net within one build
const NAV_TIMEOUT_MS = 3000; // after this, an app route falls back to the cached shell (if there is one)

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    for (const key of await caches.keys()) {
      if (key !== STATIC_CACHE && key !== PAGE_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") event.respondWith(networkFirst(event, url));
  else if (/^\/(assets|fonts|img)\//.test(url.pathname)) event.respondWith(cacheFirst(event));
});

async function cacheFirst(event) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(event.request);
  if (hit) return hit;
  const response = await fetch(event.request);
  const type = response.headers.get("content-type") || "";
  if (response.ok && !type.startsWith("text/html")) {
    await cache.put(event.request, response.clone());
    event.waitUntil(trim(cache)); // inside the event's lifetime: the browser may stop the worker otherwise
  }
  return response;
}

/* App routes are "/" and extension-less paths (?vista=… lives in the query); anything with a file extension other
   than .html (/cv/CV.pdf, /robots.txt, /sw.js) is a file and must never get the HTML shell. */
const isAppRoute = (pathname) => !/\.[a-z0-9]+$/i.test(pathname) || /\/index\.html$/i.test(pathname);

function networkFirst(event, url) {
  const network = (async () => (await event.preloadResponse) || fetch(event.request))();
  // keep the offline shell fresh: ONLY the real home page, ONLY HTML (SW-3/SW-5)
  // (registered before the page gets the response, and cloned synchronously: the body is still unread here)
  event.waitUntil(network.then((response) => {
    const type = response.headers.get("content-type") || "";
    if (url.pathname !== "/" || !response.ok || !type.startsWith("text/html")) return;
    const copy = response.clone();
    return caches.open(PAGE_CACHE).then((cache) => cache.put("/", copy));
  }).catch(() => {}));
  if (!isAppRoute(url.pathname)) return network.catch(() => Response.error());
  return new Promise((resolve) => {
    let settled = false;
    const fallback = async () => {
      const cached = await caches.match("/", { cacheName: PAGE_CACHE });
      if (cached && !settled) { settled = true; resolve(cached); }
      return Boolean(cached);
    };
    const timer = setTimeout(fallback, NAV_TIMEOUT_MS); // lie-fi: don't hang on a stalled connection
    network.then(
      (response) => { clearTimeout(timer); if (!settled) { settled = true; resolve(response); } },
      async () => { clearTimeout(timer); if (!(await fallback()) && !settled) { settled = true; resolve(Response.error()); } },
    );
  });
}

async function trim(cache) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_STATIC_ENTRIES))) await cache.delete(key);
}
