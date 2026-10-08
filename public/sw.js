const STATIC_CACHE = "doly-static-v1";
const PAGE_CACHE = "doly-pages-v1";
const IMAGE_CACHE = "doly-images-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = ["/", OFFLINE_URL, "/branding/doly-wordmark.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

function pathOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

function shouldNeverIntercept(url, method) {
  if (method !== "GET") return true;
  const path = pathOf(url);
  if (path.startsWith("/admin")) return true;
  if (path.startsWith("/api/")) return true;
  if (path.startsWith("/auth")) return true;
  if (path.startsWith("/account")) return true;
  return false;
}

function isStaticAsset(url) {
  return pathOf(url).startsWith("/_next/static/");
}

function isImageRequest(request, url) {
  if (request.destination === "image") return true;
  return /\.(png|jpe?g|gif|webp|svg|avif|ico)$/i.test(pathOf(url));
}

function isHtmlNavigation(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return request.destination === "document" || accept.includes("text/html");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  if (shouldNeverIntercept(url, request.method)) return;
  if (request.method !== "GET") return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (isHtmlNavigation(request)) {
    event.respondWith(networkFirstPage(request));
  }
});
