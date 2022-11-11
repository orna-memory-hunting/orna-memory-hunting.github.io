import { safeExecute } from '../lib/utils.js'
import { getIssuesMap } from '../lib/github.js'
import { questionList, questionLabels, answerLabels } from '../lib/questions.js'

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
  const issuesMap = await getIssuesMap({ milestone, state: milestone ? 'all' : 'open' })

  for (let utcHours = 0; utcHours < 24; utcHours++) {
    let rowid = 2

    for (let qid = 0; qid < questionList.length; qid++) {
      const question = questionList[qid]

      for (let aid = 0; aid < question.a.length; aid++) {
        const elm = document.createElement('div')

        elm.setAttribute('style', `grid-column:${utcHours + 1}/${utcHours + 1}; grid-row:${rowid}/${rowid};`)
        elm.textContent = `${questionLabels[qid]}.${answerLabels[aid]}. ${question.sq || question.q}\n` +
          `- ${question.sa ? question.sa[aid] : question.a[aid]}`
        summaryTable.append(elm)
        rowid++
      }
    }
  }

  console.log(issuesMap)
}
