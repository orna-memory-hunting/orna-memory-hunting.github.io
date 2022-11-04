import { buildNumber } from '../version.js'

/** @param {()=> Promise} fn */
function doAsync(fn) {
  fn().catch(console.error)
}


/**
 * @param {number|null} [delay]
 * @returns {Promise}
 */
function nextTick(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay || 0)
  })
}


/** @returns {Promise} */
function nextAnimationFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(resolve)
  })
}


async function registerServiceWorker() {
  if ('serviceWorker' in window.navigator) {
    const { serviceWorker } = window.navigator

    serviceWorker.addEventListener('message', event => {
      if (event.data.name) {
        switch (event.data.name) {
          case 'force-refresh':
            if (event.data.buildNumber !== buildNumber) {
              window.location.reload()
            }
            break
          case 'pong':
            console.log(`serviceWorker succeeded. buildNumber = ${event.data.buildNumber}`)
            break
        }
      }
    })

    await serviceWorker.register('/offline.js', { scope: '/', type: 'module' })

    navigator.serviceWorker.ready.then((/** @type {ServiceWorkerRegistration} */worker) => {
      if (worker.active) {
        worker.active.postMessage({ name: 'ping', buildNumber })
      }
    })
  }
}


/**
 * @param {string} text
 * @returns {string}
 */
function escapeHTML(text) {
  return text
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}


/** @param {string} text */
function popup(text) {
  const div = document.createElement('div')

  div.classList.add('popup')
  div.textContent = text
  document.body.append(div)

  setTimeout(() => {
    div.remove()
  }, 1000)
}


export {
  doAsync,
  nextTick,
  nextAnimationFrame,
  registerServiceWorker,
  escapeHTML,
  popup
}
