import { safeExecute } from '../lib/utils.js'
import { getIssuesMap } from '../lib/github.js'

safeExecute(async () => {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))
  const milestone = parseInt(params.get('milestone'))

  // TODO
  await loadSummaryTable(isNaN(milestone) ? null : milestone)
})

/** @param {number} milestone */
async function loadSummaryTable(milestone) {
  const issuesMap = await getIssuesMap({ milestone, state: milestone ? 'all' : 'open' })

  console.log(issuesMap)
}
