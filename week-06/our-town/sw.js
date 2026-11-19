// 서비스 워커: 앱 화면(HTML, 아이콘)을 폰에 저장해 두어서 인터넷이 끊겨도 앱이 열리게 함.
// 날씨 정보는 앱이 마지막으로 받은 것을 따로 저장해 두고 보여 줌 (index.html 의 저장 부분).
// 앱을 고치면 아래 숫자를 올려야 폰에 새 버전이 들어감.
const CACHE = 'our-town-weather-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('our-town-weather-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // 날씨 서버(Open-Meteo)는 서비스 워커가 건드리지 않음 → 끊기면 앱이 까닭과 마지막 정보를 보여 줌
  if (url.origin !== self.location.origin) return;
  // 앱 화면: 먼저 인터넷으로 새것을 받고, 안 되면 저장해 둔 것
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
