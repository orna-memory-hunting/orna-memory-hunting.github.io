import { popup } from './utils.js'

/** @param {Event} event */
function textToggleClick(event) {
  /** @type {HTMLDivElement} */// @ts-ignore
  const toggle = event.currentTarget
  /** @type {HTMLDivElement} */// @ts-ignore
  const item = event.target

  if (item.classList.contains('text-toggle-item') && !item.classList.contains('active')) {
    toggle.querySelector('.text-toggle-item.active').classList.remove('active')
    item.classList.add('active')
  }
}


/** @param {Event} event */
function textMultiToggleClick(event) {
  /** @type {HTMLDivElement} */// @ts-ignore
  const toggle = event.currentTarget
  /** @type {HTMLDivElement} */// @ts-ignore
  const item = event.target

  if (item.classList.contains('text-multi-toggle-item')) {
    item.classList.toggle('active')
  }
  if (toggle.dataset.saveState) {
    const { id } = toggle
    const states = {}

    toggle.querySelectorAll('.text-multi-toggle-item[data-state]')
      .forEach((/** @type {HTMLDivElement} */item) => {
        states[item.dataset.state] = item.classList.contains('active')
      })

    window.localStorage.setItem(`text-multi-toggle__${id}`, JSON.stringify(states))
  }
}


function closeOrBack() {
  if (document.referrer && new URL(document.referrer).host === window.location.host) {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.close()
    }
  } else {
    // @ts-ignore
    window.location = '/'
  }
}


/** @param {Event} event */
function copyButton(event) {
  /** @type {HTMLDivElement} */// @ts-ignore
  const elm = event.target
  const title = elm.getAttribute('title')

  if (elm.classList.contains('copy-button')) {
    try {
      navigator.clipboard.writeText(title)
        .then(() => {
          popup(`Скопировано\n\n${title}`)
        })
        .catch(err => window.alert(err))
    } catch (error) {
      window.alert(error)
    }
    event.stopPropagation()
    event.preventDefault()
  }
}


export function initComponents() {
  /** @type {Array<HTMLDivElement>} */// @ts-ignore
  const textToggles = document.querySelectorAll('.text-toggle')
  /** @type {Array<HTMLDivElement>} */// @ts-ignore
  const textMultiToggles = document.querySelectorAll('.text-multi-toggle')
  /** @type {Array<HTMLDivElement>} */// @ts-ignore
  const closeButtons = document.querySelectorAll('.close-button')
  /** @type {HTMLDivElement} */// @ts-ignore
  const menuButtonOpen = document.getElementById('menu-button-open')
  /** @type {HTMLDivElement} */// @ts-ignore
  const menuButtonClose = document.getElementById('menu-button-close')
  /** @type {HTMLDivElement} */// @ts-ignore
  const menuList = document.getElementById('menu-list')

  if (textToggles) {
    textToggles.forEach(elm => elm.addEventListener('click', textToggleClick))
  }

  if (textMultiToggles) {
    textMultiToggles.forEach(elm => {
      elm.addEventListener('click', textMultiToggleClick)
      if (elm.dataset.saveState) {
        const { id } = elm
        const states = JSON.parse(window.localStorage.getItem(`text-multi-toggle__${id}`) || '{}')

        elm.querySelectorAll('.text-multi-toggle-item[data-state]')
          .forEach((/** @type {HTMLDivElement} */item) => {
            if (states[item.dataset.state]) {
              item.classList.add('active')
            }
          })
      }
    })
  }

  if (closeButtons) {
    closeButtons.forEach(elm => elm.addEventListener('click', closeOrBack))
  }
  document.addEventListener('click', event => {
    /** @type {HTMLDivElement} */// @ts-ignore
    const elm = event.target

    if (menuList && !elm.classList.contains('menu-button')) {
      menuList.classList.add('hide')
    }
    copyButton(event)
  })

  if (menuButtonOpen) {
    menuButtonOpen.onclick = menuButtonClose.onclick = () => {
      menuList.classList.toggle('hide')
    }
  }
}
