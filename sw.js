/* Сохраняет файлы игры на телефоне: игра открывается быстрее и работает без интернета.
   Звук (audio/…?h=…) и картинки берём из сохранённого — у звука в адресе отметка версии, новый звук придёт с новой отметкой.
   Всё остальное (страница, скрипты, стили) сначала пытаемся скачать свежим и только без сети берём сохранённое. */
const CACHE = 'tiny-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const keep = res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) } return res };
  if (/\/audio\/.+\?h=|\/img\//.test(url.pathname + url.search)){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(keep)));
  } else {
    e.respondWith(fetch(req).then(keep).catch(() => caches.match(req, {ignoreSearch: url.pathname.endsWith('/') || url.pathname.endsWith('.html')})));
  }
});
