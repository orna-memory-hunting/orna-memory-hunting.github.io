/* global self caches */
import { buildNumber } from './version.js'

const appResources = [
  './',
  './index.js',
  './index.css'
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(buildNumber)
    .then((cache) => cache.addAll(appResources)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then(async keyList => {
      let isUpdate = false

      await Promise.all(keyList.map(async key => {
        if (key !== buildNumber) {
          isUpdate = true
          await caches.delete(key)
        }
      }))

      if (isUpdate) {
        await self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ name: 'force-refresh' })
          })
        })
      }
    }))
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        return caches.open(buildNumber).then((cache) => {
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, response.clone())
          }

          return response
        })
      })
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data.name) {
    switch (event.data.name) {
      case 'ping':
        event.source.postMessage({ name: 'pong', buildNumber })
        break
    }
  }
})
