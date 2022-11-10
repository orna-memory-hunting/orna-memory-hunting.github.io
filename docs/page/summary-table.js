import { safeExecute } from '../lib/utils.js'
import { getIssuesMap } from '../lib/github.js'

safeExecute(async () => {
  // TODO
  await loadSummaryTable()
})

async function loadSummaryTable() {
  const issuesMap = await getIssuesMap()

  console.log(issuesMap)
}
