import { Octokit } from 'https://cdn.skypack.dev/octokit@2.0.10'
import { doAsync, escapeHTML } from '../lib/utils.js'
import { parseIssue } from '../lib/github.js'

const octokit = new Octokit()
const params = new URLSearchParams(window.location.hash.replace('#', ''))
const issueNumber = parseInt(params.get('issue'))


if (isNaN(issueNumber)) {
  window.location.pathname = '/'
}

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

doAsync(async () => {
  const issueRaw = await octokit.rest.issues.get({
    owner: 'orna-memory-hunting',
    repo: 'storage',
    issue_number: issueNumber
  })
  // @ts-ignore
  const issue = parseIssue(issueRaw.data)
  let html = ''

  document.title = `${issue.amitie.name} / Memory Hunting - Orna`
  document.getElementById('amitie-name').textContent = issue.amitie.name
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
        ` style="color:#${label.color};border-color:#${label.color};#` +
        ` title="${escapeHTML(label.description)}">${escapeHTML(label.name)}</div>`
    }
    html += '</div>'
  }
  labelsBlocks.innerHTML = html

  const time = issue.time
    ? `${('0' + issue.time.getUTCHours()).slice(-2)}ч. utc` +
    ` / ${('0' + (issue.time.getUTCHours() + 3) % 24).slice(-2)}ч. msk`
    : ''
  const timeLocal = issue.time
    ? `${('0' + (issue.time.getHours()) % 24).slice(-2)}ч. местное`
    : ''

  questionBlock.innerHTML =
    `<div class="question">${issue.answer.qLabel}. ${issue.answer.q}</div>` +
    `<div class="answer">${issue.answer.aLabel}. ${issue.answer.a}</div>`

  timeBlock.innerHTML = `<div>${timeLocal}</div><div>${time}</div>`

  periodBlock.innerHTML = `<div>${escapeHTML(issue.milestone)}</div>`
})
