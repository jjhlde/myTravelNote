/**
 * Service Worker for Macau Travel PWA
 * Handles offline caching and navigation for PWA installation
 */

const CACHE_NAME = 'macau-travel-v1';
const STATIC_CACHE_NAME = 'macau-travel-static-v1';

// 캐시할 정적 파일들
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/macau/macau.css',
  '/macau/js/core/navigation.js',
  '/macau/js/utils/dom-helpers.js',
  '/macau/js/features/popup-manager.js',
  '/macau/js/features/expense-tracker.js',
  '/macau/js/features/exchange-rate.js',
  '/macau/js/features/todo-manager.js',
  '/macau/js/features/image-slider.js',
  '/macau/js/features/map-integration.js',
  '/macau/js/app.js',
  '/macau/config/config.js',
  '/macau/config/places-api.js',
  '/manifest.json'
];

// 동적으로 캐시할 페이지들
const DYNAMIC_PAGES = [
  '/macau/pages/info.html',
  '/macau/pages/day1.html',
  '/macau/pages/day2.html',
  '/macau/pages/day3.html',
  '/macau/pages/day4.html',
  '/macau/pages/budget.html'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // 정적 파일 캐시
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { cache: 'no-cache' });
        }));
      }),
      // 동적 페이지 캐시
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching dynamic pages');
        return cache.addAll(DYNAMIC_PAGES.map(url => {
          return new Request(url, { cache: 'no-cache' });
        }));
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      // 즉시 활성화
      return self.skipWaiting();
    }).catch((error) => {
      console.error('Service Worker: Installation failed', error);
    })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // 오래된 캐시 정리
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 모든 클라이언트에서 새 Service Worker 즉시 제어
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activation complete');
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 같은 도메인에서의 요청만 처리
  if (url.origin !== location.origin) {
    return;
  }
  
  // PWA 네비게이션 요청 처리
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request));
    return;
  }
  
  // 정적 자원 요청 처리
  event.respondWith(handleStaticAssets(request));
});

/**
 * 네비게이션 요청 처리 (PWA 404 문제 해결)
 */
async function handleNavigate(request) {
  try {
    // 네트워크에서 먼저 시도
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network failed, serving from cache');
  }
  
  // 네트워크 실패 시 캐시에서 index.html 반환
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match('/index.html') || await cache.match('/');
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 캐시에도 없으면 기본 응답
  return new Response('페이지를 찾을 수 없습니다.', { 
    status: 404, 
    statusText: 'Not Found',
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/**
 * 정적 자원 요청 처리
 */
async function handleStaticAssets(request) {
  const url = new URL(request.url);
  
  try {
    // 캐시 우선 전략 (Cache First)
    const cache = await caches.open(url.pathname.includes('/macau/pages/') ? CACHE_NAME : STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 백그라운드에서 네트워크 업데이트 시도
      fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      }).catch(() => {
        // 네트워크 실패는 무시
      });
      
      return cachedResponse;
    }
    
    // 캐시에 없으면 네트워크에서 가져와서 캐시에 저장
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('Service Worker: Fetch failed', error);
    
    // HTML 파일의 경우 index.html로 폴백
    if (request.headers.get('accept')?.includes('text/html')) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return await cache.match('/index.html') || await cache.match('/');
    }
    
    return new Response('자원을 찾을 수 없습니다.', { 
      status: 404, 
      statusText: 'Not Found' 
    });
  }
}

// 메시지 처리 (캐시 업데이트 등)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    // 캐시 업데이트 요청 처리
    event.waitUntil(updateCache());
  }
});

/**
 * 캐시 업데이트
 */
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(DYNAMIC_PAGES);
    console.log('Service Worker: Cache updated');
  } catch (error) {
    console.error('Service Worker: Cache update failed', error);
  }
}