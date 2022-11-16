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
/** @type {HTMLInputElement} */// @ts-ignore
const summaryTableSearch = document.getElementById('summary-table-search')
let milestone = null
let issuesMap = null

safeExecute(async () => {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))

  milestone = parseInt(params.get('milestone'))
  milestone = isNaN(milestone) ? null : milestone

  await loadSummaryTable()
})

let searchString = null
let searchTimerId = null

summaryTableSearch.onkeyup = () => {
  const searchStringCur = summaryTableSearch.value.length > 1 ? summaryTableSearch.value : null

  if (searchString !== searchStringCur) {
    searchString = searchStringCur
    if (searchTimerId) {
      clearTimeout(searchTimerId)
    }
    searchTimerId = setTimeout(() => safeExecute(loadSummaryTable), 300)
  }
}

async function loadSummaryTable() {
  let htmlHead = ''
  let html = ''
  let colid = 0
  let maxQLen = 0

  summaryTableName.textContent = `Период: ${milestone ? (await getMilestone(milestone)).data.title : getMilestoneTitle()}`
  issuesMap = issuesMap || await getIssuesMap({ milestone, state: milestone ? 'all' : 'open' }).catch(err => {
    return err.message === 'milestone not found' ? false : err
  })

  if (issuesMap === false) {
    summaryTable.innerHTML = '<div class="summary-table-middle">На этой неделе разведку не проводим</div>'

    return
  }

  for (const key in issuesMap) {
    const hoursMap = issuesMap[key]

    maxQLen = Math.max(maxQLen, hoursMap.len)
  }

  for (let hours = 0; hours < 24; hours++) {
    const utcHours = new Date(new Date().setHours(hours)).getUTCHours()
    const hoursMap = issuesMap[utcHours]

    if (!hoursMap) continue

    const hoursTxt = ('0' + hours).slice(-2)
    const gridColumn = `grid-column:${colid + 1};`
    let rowid = 1
    const htmlHeadTime = `<div class="summary-head" style="${gridColumn}grid-row:1;">` +
      `${hoursTxt}:00 - ${hoursTxt}:59</div>`
    let htmlTime = '<div>'
    let hasTime = false

    for (let qid = 0; qid < questionList.length; qid++) {
      const questionMap = hoursMap ? hoursMap[qid] : null
      const question = questionList[qid]
      let htmlQuestion = ''
      let hasQuestion = false

      if (!questionMap) continue

      htmlQuestion += '<div class="summary-question-container">' +
        `<div class="summary-question ${questionMap ? '' : 'skipped'}" style="${gridColumn}grid-row:${++rowid};">` +
        `${questionLabels[qid]}. ${question.sq || question.q}</div>`

      for (let aid = 0; aid < question.a.length; aid++) {
        const answerMap = questionMap ? questionMap[aid] : []
        let htmlAnswer = `<div class="summary-answer ${questionMap ? '' : 'skipped'}" style="${gridColumn}grid-row:${++rowid};">` +
          `<div class="summary-answer-title">- ${answerLabels[aid]}. ${question.sa ? question.sa[aid] : question.a[aid]}</div>`
        let hasAnswer = false

        if (answerMap) {
          for (const amitie of answerMap) {
            if (searchString) {
              const title = amitie.title.toLowerCase()
              const sVals = searchString.toLowerCase().split(' ')
              let matched = true

              for (let val of sVals) {
                if (val.startsWith(':')) {
                  matched = false
                  val = val.slice(1)
                  for (const label of amitie.labels) {
                    if (label.name.toLowerCase().includes(val)) {
                      matched = true
                      break
                    }
                  }
                } else {
                  matched = title.includes(val)
                }
                if (!matched) {
                  break
                }
              }

              if (matched) {
                htmlAnswer += renderAmitieRow(amitie)
                hasAnswer = true
              }
            } else {
              htmlAnswer += renderAmitieRow(amitie)
            }
          }
        } else {
          if (!searchString) {
            htmlAnswer += '<div class="amitie-row">' +
              '<div class="lost-amitie">Не разведано!</div>' +
              `<a class="text-button" target="_self" href="/amitie/new/#q=${qid}&a=${aid}&t=${utcHours}">+</a>` +
              '</div>'
          }
        }

        htmlAnswer += '</div>'
        if (!searchString || hasAnswer) {
          htmlQuestion += htmlAnswer
          hasQuestion = true
        }
      }
      htmlQuestion += '</div>'

      if (!searchString || hasQuestion) {
        htmlTime += htmlQuestion
        hasTime = true
      }
    }
    htmlTime += '</div>'

    if (!searchString || hasTime) {
      htmlHead += htmlHeadTime
      html += htmlTime
      ++colid
    }
  }

  summaryTableHead.innerHTML = htmlHead
  summaryTable.innerHTML = html
}
