import { Octokit } from 'https://cdn.skypack.dev/octokit@2.0.10'
import { safeExecute } from '../lib/utils.js'
import { parseIssue, loadMilestoneId } from '../lib/github.js'

safeExecute(async () => {
  // TODO
  // await loadSummaryTable()
})

async function loadSummaryTable() {
  const octokit = new Octokit()
  const issuesMap = {}
  let page = 1

  while (true) {
    const issuesRaw = (await octokit.rest.issues.listForRepo({
      owner: 'orna-memory-hunting',
      repo: 'storage',
      state: 'open',
      milestone: await loadMilestoneId(),
      per_page: 100,
      page
    })).data


    page++
    if (!issuesRaw.length) {
      break
    }

    for (const issueRaw of issuesRaw) {
      // @ts-ignore
      const issue = parseIssue(issueRaw)
      const time = issue.time.getUTCHours()

      if (!(time in issuesMap)) {
        issuesMap[time] = {}
      }

      const questionMap = issuesMap[time]

      if (!(issue.answer.qid in questionMap)) {
        questionMap[issue.answer.qid] = { len: 0 }
      }

      const answerMap = questionMap[issue.answer.qid]

      if (!(issue.answer.aid in answerMap)) {
        answerMap[issue.answer.aid] = []
      }
      answerMap[issue.answer.aid].push(issue)
      answerMap.len = Math.max(answerMap.len, answerMap[issue.answer.aid].length)
    }
  }

  console.log(issuesMap)
}
