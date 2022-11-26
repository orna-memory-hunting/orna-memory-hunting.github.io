import { buildNumber } from '../version.js'

/** @type {Array<Error>}  */
const errors = []
let errorElm = null

/** @param {Error} error */
function showError(error) {
  errors.push(error)

  const stack = errors.reduce((text, err) => {
    return (text += `${err instanceof Error ? `${err}\n${err.stack}` : err}\n\n`)
  }, '')

  if (!errorElm) {
    errorElm = document.createElement('div')
    errorElm.classList.add('fatal-error')
    errorElm.onclick = (/** @type {Event} */event) => {
      /** @type {HTMLDivElement} */// @ts-ignore
      const elm = event.target

      if (elm.classList.contains('error-button')) {
        errorElm.querySelector('.error-details').classList.toggle('hide')
      }
    }
    document.body.prepend(errorElm)
  }
  errorElm.innerHTML = '<div class="error-button">' +
    'В приложении возникла критическая ошибка! Нажмите для просмотра сведений' +
    `</div><div class="error-details hide">${stack}` +
    `<a target="_blank" href="${'https://github.com/orna-memory-hunting/project/issues/new?' +
    `title=${encodeURIComponent(errors[0].message || errors[0] + '')}` +
    `&labels=${encodeURIComponent('bug report')}` +
    '&assignees=IgorNovozhilov' +
    `&body=${encodeURIComponent(stack)}`}" ` +
    'class="report-bug">Сообщить об ошибке</a></div>'
  console.error(error)
}


/** @param {()=> any} fn */
function safeExecute(fn) {
  let result = null

  try {
    result = fn()
  } catch (error) {
    showError(error)
  }
  if (result instanceof Promise) {
    result.catch(showError)
  }
}


/** @param {()=> Promise} fn */
function doAsync(fn) {
  fn().catch(showError)
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
              // @ts-ignore
              window.location = '/'
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
  safeExecute,
  doAsync,
  nextTick,
  nextAnimationFrame,
  registerServiceWorker,
  escapeHTML,
  popup
}
