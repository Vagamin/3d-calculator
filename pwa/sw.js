// При любом изменении файлов приложения увеличьте версию —
// тогда у пользователей подтянется обновление.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `calc3d-${CACHE_VERSION}`;

const APP_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './libs/html2canvas.min.js',
    './libs/jspdf.umd.min.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/maskable-192.png',
    './icons/maskable-512.png',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith('calc3d-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

    // Страница: сначала сеть (чтобы получать обновления), без сети — из кэша.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
                    }
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Остальные файлы: сначала кэш, затем сеть.
    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request))
    );
});
