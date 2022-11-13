import { safeExecute } from '../lib/utils.js'
import { getMilestone, getMilestoneTitle, getIssuesMap } from '../lib/github.js'
import { questionList, questionLabels, answerLabels } from '../lib/questions.js'
import { renderAmitieRow } from '../lib/amitie.js'

/** @type {HTMLDivElement} */// @ts-ignore
const summaryTableName = document.getElementById('summary-table-name')
/** @type {HTMLDivElement} */// @ts-ignore
const summaryTableHead = document.getElementById('summary-table-head')
/** @type {HTMLDivElement} */// @ts-ignore
const summaryTable = document.getElementById('summary-table')

safeExecute(async () => {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))
  const milestone = parseInt(params.get('milestone'))

  // TODO
  await loadSummaryTable(isNaN(milestone) ? null : milestone)
})

/** @param {number} milestone */
async function loadSummaryTable(milestone) {
  summaryTableName.textContent = `Период: ${milestone ? (await getMilestone(milestone)).data.title : getMilestoneTitle()}`

  const issuesMap = await getIssuesMap({ milestone, state: milestone ? 'all' : 'open' })
  let htmlHead = ''
  let html = ''
  let colid = 0
  let maxQLen = 0

  for (const key in issuesMap) {
    const hoursMap = issuesMap[key]

    maxQLen = Math.max(maxQLen, hoursMap.len)
  }

  for (let utcHours = 0; utcHours < 24; utcHours++) {
    const hoursMap = issuesMap[utcHours]
    const dt = new Date()

    if (!hoursMap) continue

    const hours = ('0' + (utcHours + dt.getHours() - dt.getUTCHours())).slice(-2)
    const gridColumn = `grid-column:${++colid};`
    let rowid = 1

    htmlHead += `<div class="summary-head" style="${gridColumn}grid-row:1;">` +
      `${hours}:00 - ${hours}:59</div>`

    for (let qid = 0; qid < questionList.length; qid++) {
      const questionMap = hoursMap ? hoursMap[qid] : null
      const question = questionList[qid]

      html += `<div class="summary-question ${questionMap ? '' : 'skipped'}" style="${gridColumn}grid-row:${++rowid};">` +
        `${questionLabels[qid]}. ${question.sq || question.q}</div>`

      for (let aid = 0; aid < question.a.length; aid++) {
        const answerMap = questionMap ? questionMap[aid] : []

        html += `<div class="summary-answer ${questionMap ? '' : 'skipped'}" style="${gridColumn}grid-row:${++rowid};">` +
          `<div class="summary-answer-title">- ${answerLabels[aid]}. ${question.sa ? question.sa[aid] : question.a[aid]}</div>`

        if (answerMap) {
          for (const amitie of answerMap) {
            html += renderAmitieRow(amitie)
          }
        } else {
          html += '<div class="amitie-row">' +
            '<div class="lost-amitie">Не разведано!</div>' +
            `<a class="text-button" target="_self" href="/amitie/new/#q=${qid}&a=${aid}&t=${utcHours}">+</a>` +
            '</div>'
        }

        html += '</div>'
      }
    }
  }

  summaryTableHead.innerHTML = htmlHead
  summaryTable.innerHTML = html
}
