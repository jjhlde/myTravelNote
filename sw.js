const CACHE_NAME = 'travel-chatbot-v1';
const urlsToCache = [
  './',
  './chatbot.html',
  './chatbot.css',
  './chatbot.js',
  './config.js',
  './manifest.json',
  './prompt2.txt',
  './main-script.js',
  './styles.css',
  './pwa-template.css',
  './pwa-script.js',
  './templates/main-template.html',
  './templates/info-template.html',
  './templates/day-template.html',
  './templates/budget-template.html',
  './templates/todo-template.html',
  './templates/manifest-template.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에서 찾으면 반환, 없으면 네트워크 요청
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
