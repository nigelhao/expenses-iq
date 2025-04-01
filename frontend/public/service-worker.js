// Version of the cache - change this when you want to invalidate the cache
const CACHE_VERSION = "v1";
const CACHE_NAME = `expenses-iq-cache-${CACHE_VERSION}`;
const SESSION_COOKIE_NAME = "SESSION_ID";

// Get the base URL - important for S3 bucket hosting
const getBaseUrl = () => {
  return self.location.pathname.replace(/\/service-worker\.js$/, "");
};

// Helper function to normalize URLs for caching
// This helps with S3 bucket paths
const normalizeUrl = (url) => {
  // If it's already a full URL, return it
  if (url.startsWith("http")) {
    return url;
  }

  // If it's a root path, prepend the origin and base path
  if (url.startsWith("/")) {
    return `${self.location.origin}${getBaseUrl()}${url}`;
  }

  // Otherwise, it's a relative path
  return `${self.location.origin}${getBaseUrl()}/${url}`;
};

// List of initial assets to cache
const initialAssets = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
  "/apple-icon.png",
  "/icon-512.png",
];

// Install event - cache all initial assets
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Pre-caching initial assets");
        // Normalize URLs for S3 bucket compatibility
        const normalizedUrls = initialAssets.map((url) => normalizeUrl(url));

        // Cache each asset individually to prevent one failure from stopping all caching
        const cachePromises = normalizedUrls.map((url) =>
          cache.add(url).catch((error) => {
            console.error(`[ServiceWorker] Failed to cache ${url}:`, error);
            return Promise.resolve(); // Continue despite error
          })
        );

        return Promise.all(cachePromises);
      })
      .catch((error) => {
        console.error("[ServiceWorker] Pre-cache error:", error);
        // Continue with installation even if pre-caching fails
        return Promise.resolve();
      })
      .then(() => {
        console.log("[ServiceWorker] Installation complete");
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any old caches that don't match the current version
            if (cacheName.startsWith("expenses-iq-cache-") && cacheName !== CACHE_NAME) {
              console.log("[ServiceWorker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Claiming clients");
        return self.clients.claim();
      })
  );
});

// Helper function to determine if a request should be cached
function shouldCache(request) {
  const url = request.url;

  // Don't cache API requests except those with SESSION_ID
  if (url.includes("/api/")) {
    // Check if the request has the SESSION_ID cookie
    const cookies = request.headers.get("cookie");
    if (cookies && cookies.includes(SESSION_COOKIE_NAME)) {
      return true;
    }
    return false;
  }

  // Don't cache service worker itself
  if (url.includes("service-worker.js")) {
    return false;
  }

  // Cache all static assets
  if (request.method === "GET") {
    // Cache same-origin requests
    if (url.startsWith(self.location.origin)) {
      return true;
    }

    // Cache Google Fonts
    if (
      url.startsWith("https://fonts.googleapis.com") ||
      url.startsWith("https://fonts.gstatic.com")
    ) {
      return true;
    }

    // Cache assets from the same S3 bucket
    if (url.includes(".s3.amazonaws.com/") || url.includes(".cloudfront.net/")) {
      return true;
    }
  }

  return false;
}

// Helper function to check if a response indicates session invalidation
function isSessionInvalid(response) {
  // Check for 401 Unauthorized or 403 Forbidden status
  if (response.status === 401 || response.status === 403) {
    return true;
  }

  return false;
}

// Fetch event - serve from cache, falling back to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip requests that shouldn't be cached and aren't already in cache
  if (!shouldCache(event.request)) {
    // For cross-origin requests that we don't want to cache,
    // just let the browser handle them normally
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        console.log("[ServiceWorker] Serving from cache:", event.request.url);

        // Fetch in the background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            // Check if session is invalid
            if (isSessionInvalid(networkResponse)) {
              console.log("[ServiceWorker] Session invalid, clearing cache");
              caches.open(CACHE_NAME).then((cache) => {
                cache.delete(event.request);
              });
              return;
            }

            // Update cache with new response
            if (networkResponse.ok) {
              console.log("[ServiceWorker] Updating cache:", event.request.url);
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch((error) => {
            console.log("[ServiceWorker] Network fetch failed:", error);
          });

        return cachedResponse;
      }

      // If not in cache, fetch from network
      console.log("[ServiceWorker] Fetching from network:", event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Don't cache bad responses
          if (!networkResponse || !networkResponse.ok) {
            console.log("[ServiceWorker] Bad response, not caching:", event.request.url);
            return networkResponse;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = networkResponse.clone();

          // Cache the response
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              console.log("[ServiceWorker] Caching new resource:", event.request.url);
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.error("[ServiceWorker] Error caching new resource:", error);
            });

          return networkResponse;
        })
        .catch((error) => {
          console.error("[ServiceWorker] Fetch failed:", error);

          // For HTML requests, return the offline page
          if (
            event.request.headers.get("accept") &&
            event.request.headers.get("accept").includes("text/html")
          ) {
            return caches.match(normalizeUrl("/index.html"));
          }

          // Otherwise, just propagate the error
          throw error;
        });
    })
  );
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[ServiceWorker] Skip waiting message received");
    self.skipWaiting();
  }

  // Handle cache invalidation message
  if (event.data && event.data.type === "INVALIDATE_CACHE") {
    console.log("[ServiceWorker] Cache invalidation message received");
    caches.delete(CACHE_NAME).then(() => {
      console.log("[ServiceWorker] Cache invalidated");
    });
  }
});

console.log("[ServiceWorker] Service worker registered");
