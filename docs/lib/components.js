import { popup, safeExecute } from './utils.js'

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


/**
 * @param {HTMLDivElement}  uploadField
 * @param {File} file
 */
function selectedFile(uploadField, file) {
  const fileName = uploadField.querySelector('.upload-field__file-name')
  const event = new window.CustomEvent('selected-file', { detail: { file: file || null } })

  fileName.textContent = file ? `Файл: ${file.name}` : ''
  uploadField.dispatchEvent(event)
}


function bindUploadFields() {
  /** @type {Array<HTMLDivElement>} */// @ts-ignore
  const uploadFields = document.querySelectorAll('.upload-field')

  if (uploadFields) {
    uploadFields.forEach(elm => {
      /** @type {HTMLInputElement} */// @ts-ignore
      const input = elm.querySelector('.upload-field__file')
      /** @type {HTMLDivElement} */// @ts-ignore
      const fromClipboard = elm.querySelector('.upload-field__from-clipboard')

      if (input) {
        elm.addEventListener('click', () => {
          if (!elm.classList.contains('disable')) input.click()
        })
        input.addEventListener('change', () => {
          selectedFile(elm, input.files && input.files[0])
        })
      }

      // if (fromClipboard) {
      //   if ('navigator' in window && 'clipboard' in navigator && navigator.clipboard.read) {
      //     fromClipboard.addEventListener('click', (/** @type {MouseEvent} */ event) => {
      //       event.preventDefault()
      //       event.stopPropagation()
      //       if (!elm.classList.contains('disable')) {
      //         safeExecute(async () => {
      //           await navigator.clipboard.read()
      //             .catch(error => {
      //               if (error.name === 'NotAllowedError') {
      //                 input.click()
      //                 fromClipboard.classList.add('hide')
      //               } else {
      //                 throw error
      //               }
      //               console.log(error)
      //             })
      //             .then(clipboardItems => {
      //               if (clipboardItems) {
      //                 if (clipboardItems.length) {
      //                   const [clipboardItem] = clipboardItems

      //                   if (clipboardItem.types.length) {
      //                     clipboardItem.getType(clipboardItem.types[0]).then(data => {
      //                       const file = new window.File([data], 'image.png', { type: clipboardItem.types[0] })

      //                       selectedFile(elm, file)
      //                     })
      //                   } else {
      //                     window.alert('Не удалось найти файл изображения!')
      //                   }
      //                 } else {
      //                   window.alert('Не удалось получить файл!')
      //                 }
      //               }
      //             })
      //         })
      //       }
      //     })
      //   } else {
      //     fromClipboard.classList.add('hide')
      //   }
      // }

      elm.ondragover = (/** @type {DragEvent} */ event) => {
        event.preventDefault()
        event.stopPropagation()
        if (event.dataTransfer.items.length) {
          elm.classList.add('dragenter')
        }
      }

      elm.ondragleave = (/** @type {Event} */ event) => {
        event.preventDefault()
        event.stopPropagation()
        elm.classList.remove('dragenter')
      }

      elm.ondrop = (/** @type {DragEvent} */ event) => {
        event.preventDefault()
        event.stopPropagation()
        elm.classList.remove('dragenter')

        if (!elm.classList.contains('disable')) {
          const file = event.dataTransfer && event.dataTransfer.files[0]

          if (file) {
            selectedFile(elm, file)
          } else {
            window.alert('Не удалось получить файл!')
          }
        }
      }
    })
  }
}


export function initComponents() {
  /** @type {Array<HTMLDivElement>} */// @ts-ignore
  const textToggles = document.querySelectorAll('.text-toggle')
  /** @type {Array<HTMLDivElement>} */// @ts-ignore
  const textMultiToggles = document.querySelectorAll('.text-multi-toggle')
  /** @type {Array<HTMLDivElement>} */// @ts-ignore
  const closeButtons = document.querySelectorAll('.close-button')

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
    copyButton(event)
  })

  bindUploadFields()
}
