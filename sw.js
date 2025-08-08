const CACHE_NAME = 'inclinometer-cache-v4';
const urlsToCache = [
    '/inclinometer-pwa/',
    '/inclinometer-pwa/index.html',
    '/inclinometer-pwa/styles.css',
    '/inclinometer-pwa/script.js',
    '/inclinometer-pwa/manifest.json',
    '/inclinometer-pwa/sw.js',
    '/inclinometer-pwa/icons/icon-192.png',
    '/inclinometer-pwa/icons/icon-512.png',
    '/inclinometer-pwa/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(error => console.error('Cache addAll error:', error))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => caches.match('/inclinometer-pwa/index.html'))
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});