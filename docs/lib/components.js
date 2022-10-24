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

export function initComponents() {
  /** @type {Array<HTMLDivElement>} */// @ts-ignore
  const textToggles = document.querySelectorAll('.text-toggle')

  if (textToggles) {
    textToggles.forEach(elm => elm.addEventListener('click', textToggleClick))
  }
}
