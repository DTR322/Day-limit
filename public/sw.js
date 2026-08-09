const CACHE_NAME = 'daylimit-v2'
const PRECACHE = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  // Новый SW занимает место сразу, не ждёт закрытия вкладок
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)))
})

self.addEventListener('activate', (event) => {
  // Удаляем все старые кеши и берём управление
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Навигация (index.html): сначала сеть, кеш только как оффлайн-фолбэк.
  // Благодаря этому новые деплои подхватываются сразу.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Остальное (хэшированные ассеты, иконки): кеш, потом сеть
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, copy))
        }
        return res
      })
    })
  )
})