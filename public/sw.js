const CACHE_NAME = 'ciburial-pwa-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple fetch handler to pass the PWA installability criteria
  // We just let the request go to the network, no caching for now
  event.respondWith(fetch(event.request));
});
