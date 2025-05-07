if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

const CACHE_NAME = 'mt-trading-cache-v1';
const urlsToCache = [
'/',
'/index.html',
'/styles.css',
'/main.js',  // or your main JS file
'/images/icon-192x192.png',
'/images/icon-512x512.png'
];

self.addEventListener('install', event => {
event.waitUntil(
  caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
);
});

self.addEventListener('fetch', event => {
event.respondWith(
  caches.match(event.request)
    .then(response => response || fetch(event.request))
);
});