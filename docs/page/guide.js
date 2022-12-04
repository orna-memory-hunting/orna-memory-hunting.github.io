import { safeExecute } from '../lib/utils.js'
import { getGuideList } from '../lib/github.js'
/* globals toastui */

/** @type {HTMLDivElement} */// @ts-ignore
const guideTable = document.getElementById('guide-table')


safeExecute(async () => {
  await loadGuide()

  const id = window.location.hash.replace('#', '')
  const elm = document.getElementById(id)

  if (elm) elm.click()
})

async function loadGuide() {
  guideTable.innerHTML = '<div class="guide-table-middle">Загрузка...</div>'

  const guideList = await getGuideList()
  let html = ''

  for (const guide of guideList) {
    html += `<div><div id="${guide.num}" class="guide-table-title">${guide.title}</div>` +
      `<div class="guide-table-body hide">${guide.body}</div></div>`
  }

  guideTable.innerHTML = html
}


guideTable.onclick = event => {
  /** @type {HTMLDivElement} */// @ts-ignore
  const elm = event.target

  if (elm.classList.contains('guide-table-title')) {
    const items = document.querySelectorAll('.guide-table-body')
    const body = elm.parentElement.querySelector('.guide-table-body')
    const isHide = body.classList.contains('hide')

    // @ts-ignore
    if (!body.editor) {
      // @ts-ignore
      body.editor = new toastui.Editor({
        el: body,
        initialValue: body.textContent,
        theme: 'dark'
      })
    }

    items.forEach(element => element.classList.add('hide'))
    if (isHide) {
      body.classList.remove('hide')
      window.history.replaceState(null, '', `#${elm.id}`)
    } else {
      window.history.replaceState(null, '', '#')
    }

    elm.scrollIntoView()
    document.documentElement.scrollBy({ top: -document.querySelector('.nav-head').clientHeight })
  }
}
