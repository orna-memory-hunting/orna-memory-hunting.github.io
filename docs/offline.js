/* global self caches */
import { buildNumber } from './version.js'

const appResources = [
  './add-amitie.css',
  './add-amitie.html',
  './add-amitie.js',
  './index.css',
  './index.js',
  './main.css',
  './main.js',
  './lib/components.js',
  './lib/github.js',
  './lib/utils.js',
  './lib/questions.js'
]
/** @type {ServiceWorkerGlobalScope} */// @ts-ignore
const workerScope = self

workerScope.addEventListener('install', (event) => {
  workerScope.skipWaiting()
  event.waitUntil(caches.open(buildNumber)
    .then((cache) => cache.addAll(appResources)))
})

workerScope.addEventListener('activate', (event) => {
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
        await workerScope.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ name: 'force-refresh', buildNumber })
          })
        })
      }
    }))
})

workerScope.addEventListener('fetch', event => {
  event.respondWith((async () => {
    if (new URL(event.request.url).pathname === '/') {
      const data = await fetch(`./version.json?t=${new Date().toJSON()}`).catch(() => null)

      if (data) {
        const version = await data.json()

        if (version.buildNumber !== buildNumber) {
          const keyList = await caches.keys()

          for (const key of keyList) {
            await caches.delete(key)
          }

          workerScope.registration.update()
        }
      }
    }

    if (!event.request.url.startsWith('http') ||
      event.request.url.startsWith('https://api.github.com')) {
      return fetch(event.request)
    } else {
      return caches.match(event.request, { cacheName: buildNumber }).then((response) => {
        return response || fetch(event.request).then((response) => {
          return caches.open(buildNumber).then((cache) => {
            cache.put(event.request, response.clone())

            return response
          })
        })
      })
    }
  })())
})

workerScope.addEventListener('message', (event) => {
  if (event.data.name) {
    switch (event.data.name) {
      case 'ping':
        if (event.data.buildNumber !== buildNumber) {
          caches.keys().then(async keyList => {
            for (const key of keyList) {
              await caches.delete(key)
            }
            event.source.postMessage({ name: 'force-refresh', buildNumber })
          })
        } else {
          event.source.postMessage({ name: 'pong', buildNumber })
        }
        break
    }
  }
})
