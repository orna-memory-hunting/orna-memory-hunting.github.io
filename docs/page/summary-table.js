import { safeExecute } from '../lib/utils.js'
import { getIssuesMap, getMilestoneNumber } from '../lib/github.js'

safeExecute(async () => {
  // TODO
  // await loadSummaryTable()
})

async function loadSummaryTable() {
  const issuesMap = await getIssuesMap({
    state: 'open',
    milestone: await getMilestoneNumber()
  })

  console.log(issuesMap)
}
