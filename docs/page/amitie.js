import { safeExecute, doAsync, escapeHTML } from '../lib/utils.js'
import { getIssue } from '../lib/github.js'
import { drawWitchMapLabels } from '../lib/amitie.js'

safeExecute(() => {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))
  const issueNumber = parseInt(params.get('issue'))


  if (isNaN(issueNumber)) {
    window.location.pathname = '/'
  }
  document.getElementById('copy-link').setAttribute('title', window.location.href)

  /** @type {HTMLDivElement} */// @ts-ignore
  const amitieBroken = document.getElementById('amitie-broken')
  /** @type {HTMLDivElement} */// @ts-ignore
  const plusBlocks = document.getElementById('plus-blocks')
  /** @type {HTMLDivElement} */// @ts-ignore
  const minusBlocks = document.getElementById('minus-blocks')
  /** @type {HTMLDivElement} */// @ts-ignore
  const labelsBlocks = document.getElementById('labels-blocks')
  /** @type {HTMLDivElement} */// @ts-ignore
  const questionBlock = document.getElementById('question-block')
  /** @type {HTMLDivElement} */// @ts-ignore
  const timeBlock = document.getElementById('time-block')
  /** @type {HTMLDivElement} */// @ts-ignore
  const periodBlock = document.getElementById('period-block')
  /** @type {HTMLDivElement} */// @ts-ignore
  const witchMapContainer = document.getElementById('witch-map-container')
  /** @type {HTMLLinkElement} */// @ts-ignore
  const openOnGitHub = document.getElementById('open-on-github')

  doAsync(async () => {
    const issue = await getIssue(issueNumber)
    let html = ''

    document.title = `${issue.amitie.name} / Memory Hunting - Orna`
    document.getElementById('amitie-name').textContent = issue.amitie.name
    document.getElementById('copy-card').setAttribute('title', issue.miniСard)
    openOnGitHub.href = issue.urlGH
    openOnGitHub.classList.remove('hide')
    if (issue.broken) {
      amitieBroken.classList.remove('hide')
    }
    for (const plus of issue.amitie.plusBlocks) {
      html += `<div>${escapeHTML(plus)}</div>`
    }
    plusBlocks.innerHTML = html
    html = ''
    for (const minus of issue.amitie.minusBlocks) {
      html += `<div>${escapeHTML(minus)}</div>`
    }
    minusBlocks.innerHTML = html

    html = ''
    if (issue.labels.length) {
      html += '<div class="amitie-labels">'
      for (const label of issue.labels) {
        html += '<div class="amitie-label"' +
          ` style="color:#${label.color};border-color:#${label.color};"` +
          ` title="${escapeHTML(label.description)}">${escapeHTML(label.name)}</div>`
      }
      html += '</div>'
    }
    labelsBlocks.innerHTML = html

    questionBlock.innerHTML =
      `<div class="question">${issue.answer.qLabel}. ${issue.answer.q}</div>` +
      `<div class="answer">${issue.answer.aLabel}. ${issue.answer.a}</div>`

    timeBlock.innerHTML = `<div>${issue.timeLocal}</div><div>${issue.timeUTC} / ${issue.timeMSK}</div>`

    periodBlock.innerHTML = `<div>${escapeHTML(issue.milestone)}</div>`

    if (issue.witchMap) {
      /** @type {HTMLCanvasElement} */// @ts-ignore
      const canvas = document.createElement('canvas')

      drawWitchMapLabels(canvas, issue.witchMap)
      witchMapContainer.innerHTML = ''
      witchMapContainer.append(canvas)
    } else {
      witchMapContainer.innerHTML = 'Нет'
    }
  })
})
