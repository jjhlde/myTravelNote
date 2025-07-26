const CACHE_NAME = 'travel-chatbot-v3';
// 확실히 존재하는 파일들만 캐시
const urlsToCache = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  // 캐시 설정을 안전하게 처리
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        
        // 각 파일을 개별적으로 캐시하여 실패한 파일이 있어도 계속 진행
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null; // 실패해도 계속 진행
            });
          })
        );
      })
      .then(() => {
        console.log('Service Worker installation completed');
        // 설치 즉시 활성화
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
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
        
        // 네트워크 요청 시도, 실패하면 에러 로그와 함께 기본 응답 반환
        return fetch(event.request).catch((error) => {
          console.warn('Service Worker fetch failed for:', event.request.url, error);
          
          // HTML 페이지 요청이 실패한 경우 기본 응답 반환
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
          
          // 다른 리소스는 404 응답 반환
          return new Response('', {
            status: 404,
            statusText: 'Not Found'
          });
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('Found caches:', cacheNames);
      
      // 이전 버전의 캐시들 삭제
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker activated');
      // 즉시 모든 클라이언트를 제어
      return self.clients.claim();
    })
    .catch(error => {
      console.error('Service Worker activation failed:', error);
    })
  );
});
