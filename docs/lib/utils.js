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
            window.location.reload()
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
        worker.active.postMessage({ name: 'ping' })
      }
    })
  }
}


export {
  doAsync,
  nextTick,
  nextAnimationFrame,
  registerServiceWorker
}
