import { Octokit } from 'https://cdn.skypack.dev/octokit@2.0.10'
import { getAnswerByLabels } from './questions.js'

const octokit = new Octokit()
const storage = { owner: 'orna-memory-hunting', repo: 'storage' }
const knowledge = { owner: 'orna-memory-hunting', repo: 'knowledge' }


/**
 * @param {Date} [date]
 * @returns {string}
 */
function getMilestoneTitle(date) {
  const dt = date ? new Date(date) : new Date()
  let day = dt.getUTCDay() - 1

  if (day < 0) day = 6

  const sWeek = new Date(dt.setUTCDate(dt.getUTCDate() - day))
  const eWeek = new Date(dt.setUTCDate(dt.getUTCDate() + 6))
  const sDate = sWeek.toJSON().replace(/.*\d\d(\d\d)(-\d\d-\d\d).*/, '$1$2').split('-').reverse().join('.')
  const eDate = eWeek.toJSON().replace(/.*\d\d(\d\d)(-\d\d-\d\d).*/, '$1$2').split('-').reverse().join('.')

  return `${sDate} - ${eDate}`
}


/**
 * @param {Date} [date]
 * @returns {Promise<number>}
 */
async function getMilestoneNumber(date) {
  const curMilestoneName = getMilestoneTitle(date)
  let milestoneId = window.sessionStorage.getItem(`milestone_${curMilestoneName}`)

  if (!milestoneId) {
    const milestones = (await octokit.rest.issues
      .listMilestones({ state: 'open', ...storage })).data

    for (const { number, title } of milestones) {
      if (curMilestoneName === title) {
        milestoneId = number + ''
        window.sessionStorage.setItem(`milestone_${curMilestoneName}`, milestoneId)
        break
      }
    }
  }

  if (!milestoneId) {
    throw Error('milestone not found')
  }

  return parseInt(milestoneId)
}

/* eslint-disable jsdoc/valid-types */
/**
 * @param {number} number
 * @returns {Promise<import('@octokit/plugin-rest-endpoint-methods').RestEndpointMethodTypes["issues"]["getMilestone"]["response"]>}
 */
/* eslint-enable jsdoc/valid-types */
async function getMilestone(number) {
  return await octokit.rest.issues.getMilestone({
    ...storage,
    milestone_number: number
  })
}


/**
 *
 * @param {number} utcHours
 * @returns {{timeUTC:string,timeMSK:string}}
 */
function getTimeLabels(utcHours) {
  return {
    timeUTC: `time ${('0' + utcHours).slice(-2)}h UTC`,
    timeMSK: `time ${('0' + (utcHours + 3) % 24).slice(-2)}h MSK`
  }
}


/** @typedef {{name:string,plusBlocks:string[],minusBlocks:string[]}} Amitie */
/** @typedef {Array<{name:string,description:string,color:string}>} Labels */
/**
 * @typedef Issue
 * @property {string} url
 * @property {string} urlGH
 * @property {string} title
 * @property {Labels} labels
 * @property {number} milestoneNumber
 * @property {string} milestone
 * @property {number} utcHours
 * @property {string} timeUTC
 * @property {string} timeMSK
 * @property {string} timeLocal
 * @property {string} body
 * @property {import('./questions.js').AnswerData} answer
 * @property {string} answerLabel
 * @property {number} clone
 * @property {Amitie} amitie
 * @property {string} miniСard
 * @property {boolean} broken
 * @property {import('../lib/amitie.js').NormalizedMapData} witchMap
 */
/* eslint-disable jsdoc/valid-types */
/**
 *
 * @param {import('@octokit/plugin-rest-endpoint-methods').RestEndpointMethodTypes['issues']['get']['response']['data']} issue
 * @returns {Issue}
 */
/* eslint-enable jsdoc/valid-types */
function parseIssue({ number, html_url, title, labels, milestone, body }) { // eslint-disable-line camelcase
  const issue = {
    url: `/amitie/#issue=${number}`,
    urlGH: html_url, // eslint-disable-line camelcase
    title,
    labels: [],
    milestoneNumber: (milestone || { number: null }).number,
    milestone: (milestone || { title: '' }).title,
    utcHours: null,
    timeUTC: '',
    timeMSK: '',
    timeLocal: '',
    body,
    answer: null,
    answerLabel: '',
    clone: 0,
    amitie: {
      name: title,
      plusBlocks: [title],
      minusBlocks: ['?']
    },
    miniСard: '',
    witchMap: null,
    broken: false
  }
  const bodyList = body.split('### ')

  for (const label of labels) {
    if (typeof label !== 'object') break

    const { name, description, color } = label

    if (name.startsWith('q.')) {
      const [q, a] = name.replace(/q.(\d)-([А-Я]).*/, '$1-$2').split('-')

      if (q && a) {
        issue.answer = getAnswerByLabels(q, a)
        issue.answerLabel = name
      }
      continue
    } else if (name.startsWith('time ')) {
      if (name.endsWith('UTC')) {
        const timeLocal = new Date()

        issue.utcHours = parseInt(name.replace('time ', '').replace('h UTC', ''))
        issue.timeUTC = `${('0' + issue.utcHours).slice(-2)}ч. utc`
        issue.timeMSK = `${('0' + (issue.utcHours + 3) % 24).slice(-2)}ч. msk`
        timeLocal.setUTCHours(issue.utcHours)
        issue.timeLocal = `${('0' + (timeLocal.getHours()) % 24).slice(-2)}ч. местное`
      }
      continue
    } else if (name === 'NOT FOUND') {
      issue.broken = true
    } else if (label.name.startsWith('clone #')) {
      const clone = parseInt(label.name.replace('clone #', ''))

      if (!isNaN(clone)) issue.clone = clone
    }
    issue.labels.push({ name, description, color })
  }

  if (bodyList.length > 2) {
    if ((/# [А-Яа-яA-Za-z]/).test(bodyList[0])) {
      issue.amitie.name = bodyList.shift()
      issue.amitie.name = issue.amitie.name
        .replace('# ', '').trim()
    }
  }
  if (bodyList.length > 1) {
    const plusBlocks = bodyList[0].split('\n').map(i => i.trim())
      .filter(i => i.startsWith('- **'))
      .map(i => i.replace(/^- \*\*/, '').replace(/\*\*$/, ''))
    const minusBlocks = bodyList[1].split('\n').map(i => i.trim())
      .filter(i => i.startsWith('- _'))
      .map(i => i.replace(/^- _/, '').replace(/_$/, ''))

    if (plusBlocks.length && plusBlocks.length === minusBlocks.length) {
      issue.amitie.plusBlocks = plusBlocks
      issue.amitie.minusBlocks = minusBlocks
    } else {
      issue.broken = true
    }
  } else {
    issue.broken = true
  }

  issue.broken = issue.broken ||
    issue.utcHours === null ||
    issue.answer === null

  issue.miniСard = `${issue.amitie.name}\n` +
    `+ ${issue.amitie.plusBlocks.join('\n+ ')}\n` +
    `- ${issue.amitie.minusBlocks.join('\n- ')}\n` +
    `${issue.answer.code} ${issue.answer.textShort}\n` +
    `${issue.timeUTC}, ${issue.timeMSK}, ${issue.milestone}\n` +
    `${window.location.origin}${issue.url}\n` +
    '#поделисьосколком'

  if ((/&witch_map=/).test(body)) {
    body.replace(/&witch_map=(.*) -->/, (_, map) => (issue.witchMap = map))
    try {
      issue.witchMap = JSON.parse(issue.witchMap)
    } catch (_) {
      issue.witchMap = null
    }
  }

  return issue
}


/**
 * @typedef IssuesOpts
 * @property {"open" | "closed" | "all"} [state="open"]
 * @property {number} [milestone="<current week>"]
 * @property {Array<string>} [labels]
 */
/* eslint-disable jsdoc/valid-types */
/**
 * @param {IssuesOpts} [options]
 * @returns {Promise<import('@octokit/plugin-rest-endpoint-methods').RestEndpointMethodTypes['issues']['listForRepo']['parameters']>}
 */
/* eslint-enable jsdoc/valid-types */
async function getIssuesOpts(options) {
  return {
    ...storage,
    state: options.state || 'open',
    milestone: String(options.milestone || await getMilestoneNumber()),
    labels: (options.labels || []).join(',') || undefined
  }
}


/**
 * @param {IssuesOpts} [options]
 * @returns {Promise<Array<Issue>>}
 */
async function getIssuesList(options = {}) {
  const restOptions = await getIssuesOpts(options)
  const issuesList = []
  const perPage = 100
  let page = 1

  while (true) {
    const response = await octokit.rest.issues.listForRepo({
      ...restOptions,
      per_page: perPage,
      page
    })

    if (response.status !== 200) {
      throw new Error(JSON.stringify({
        status: response.status,
        url: response.url,
        json: response
      }, null, '  '))
    }

    const issuesRaw = response.data

    for (const issueRaw of issuesRaw) {
      const issue = parseIssue(issueRaw)

      if (!issue.broken) {
        issuesList.push(issue)
      }
    }

    if (issuesRaw.length < perPage) {
      break
    }
    page++
  }

  return issuesList
}


/**
 * @param {IssuesOpts} [options]
 * @returns {Promise<object>}
 */
async function getIssuesMap(options = {}) {
  const restOptions = await getIssuesOpts(options)
  const issuesMap = {}
  const perPage = 100
  let page = 1

  while (true) {
    const response = await octokit.rest.issues.listForRepo({
      ...restOptions,
      per_page: perPage,
      page
    })

    if (response.status !== 200) {
      throw new Error(JSON.stringify({
        status: response.status,
        url: response.url,
        json: response
      }, null, '  '))
    }

    const issuesRaw = response.data

    for (const issueRaw of issuesRaw) {
      const issue = parseIssue(issueRaw)

      if (issue.broken) {
        continue
      }

      if (!(issue.utcHours in issuesMap)) {
        issuesMap[issue.utcHours] = {}
      }

      const questionMap = issuesMap[issue.utcHours]

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

    if (issuesRaw.length < perPage) {
      break
    }
    page++
  }

  return issuesMap
}


/**
 * @param {number} number
 * @returns {Promise<Issue>}
 */
async function getIssue(number) {
  const issueRaw = await octokit.rest.issues.get({
    ...storage,
    issue_number: number
  })

  return parseIssue(issueRaw.data)
}


/**
 * @param {IssuesOpts} [options]
 * @returns {Promise<Array<{login:string,avatar:string,count:number}>>}
 */
async function getTopScouts(options = {}) {
  const restOptions = await getIssuesOpts(options)
  const topScouts = []
  const topScoutsMap = {}
  const perPage = 100
  let page = 1

  while (true) {
    const response = await octokit.rest.issues.listForRepo({
      ...restOptions,
      per_page: perPage,
      page
    })

    if (response.status !== 200) {
      throw new Error(JSON.stringify({
        status: response.status,
        url: response.url,
        json: response
      }, null, '  '))
    }

    const issuesRaw = response.data

    for (const { user: { login, avatar_url } } of issuesRaw) { // eslint-disable-line camelcase
      if (login in topScoutsMap) {
        topScoutsMap[login].count++
      } else {
        topScouts.push(
          topScoutsMap[login] = { login, avatar: avatar_url, count: 1 }// eslint-disable-line camelcase
        )
      }
    }

    if (issuesRaw.length < perPage) {
      break
    }
    page++
  }

  topScouts.sort((b, a) => (a.count > b.count) ? 1 : ((b.count > a.count) ? -1 : 0))

  return topScouts
}


/** @returns {Promise<Array<{id:number,num:number,title:string,body:string}>>} */
async function getGuideList() {
  const guideList = []
  const perPage = 100
  let page = 1

  while (true) {
    const response = await octokit.rest.issues.listForRepo({
      ...knowledge,
      state: 'open',
      labels: 'guide',
      per_page: perPage,
      page
    })

    if (response.status !== 200) {
      throw new Error(JSON.stringify({
        status: response.status,
        url: response.url,
        json: response
      }, null, '  '))
    }

    const issuesRaw = response.data

    for (const { number, title, body } of issuesRaw) {
      const num = Number(title.replace(/^#(\d+).*/, '$1'))

      guideList.push({ id: number, num: isNaN(num) ? 0 : num, title, body })
    }

    if (issuesRaw.length < perPage) {
      break
    }
    page++
  }

  guideList.sort((a, b) => (a.num > b.num) ? 1 : ((b.num > a.num) ? -1 : 0))

  return guideList
}


export {
  getMilestoneTitle,
  getMilestoneNumber,
  getMilestone,
  getTimeLabels,
  getIssuesList,
  getIssuesMap,
  getIssue,
  getTopScouts,
  getGuideList
}
