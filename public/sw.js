// Minimal service worker.
//
// Its only job is to make the site installable as an app (Android Chrome
// requires a registered service worker with a fetch handler). It deliberately
// caches nothing, so every request still goes to the network and a new deploy
// is picked up immediately.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // No respondWith: the browser handles the request normally.
})
