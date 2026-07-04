// 방문영업 일지 시스템 — 서비스워커
// 이 파일이 있어야 안드로이드(갤럭시탭 등)에서 "홈 화면에 추가/설치"가
// 정식 앱처럼 동작하고, 인터넷이 안 될 때도 화면이 열립니다.
const CACHE_NAME = 'gfc-visit-log-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-120.png',
  './icon-152.png',
  './icon-167.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : null)))
    )
  );
  self.clients.claim();
});

// 기본 전략: 우리 앱 파일(HTML/manifest/아이콘)은 캐시 우선, 그 외(외부 CDN 등)는 네트워크 우선
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
  // 외부 CDN(엑셀/OCR/지도 등)은 서비스워커가 손대지 않고 그대로 네트워크로 통과시킵니다.
});
