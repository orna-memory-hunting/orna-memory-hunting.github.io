import { Octokit } from 'https://cdn.skypack.dev/octokit@2.0.10'
import { getAnswerByLabels } from './questions.js'

export const octokit = new Octokit()
export const ghAPI = 'https://api.github.com/repos/orna-memory-hunting/storage'

const repo = { owner: 'orna-memory-hunting', repo: 'storage' }

/**
 * @param {Date} [date]
 * @returns {string}
 */
function getMilestone(date) {
  const dt = date ? new Date(date) : new Date()
  const sWeek = new Date(dt.setUTCDate(dt.getUTCDate() - dt.getUTCDay() + 1))
  const eWeek = new Date(dt.setUTCDate(dt.getUTCDate() + (7 - dt.getUTCDay())))
  const sDate = sWeek.toJSON().replace(/.*\d\d(\d\d)(-\d\d-\d\d).*/, '$1$2').split('-').reverse().join('.')
  const eDate = eWeek.toJSON().replace(/.*\d\d(\d\d)(-\d\d-\d\d).*/, '$1$2').split('-').reverse().join('.')

  return `${sDate} - ${eDate}`
}


/**
 * @param {Date} [date]
 * @returns {Promise<string>}
 */
async function getMilestoneNumber(date) {
  const curMilestoneName = getMilestone(date)
  let milestoneId = window.sessionStorage.getItem(`milestone_${curMilestoneName}`)

  if (!milestoneId) {
    const milestones = (await octokit.rest.issues
      .listMilestones({ state: 'open', ...repo })).data

    for (const { number, title } of milestones) {
      if (curMilestoneName === title) {
        milestoneId = number + ''
        window.sessionStorage.setItem(`milestone_${curMilestoneName}`, milestoneId)
        break
      }
    }
  }

  return milestoneId
}


/**
 *
 * @param {Date} [time]
 * @returns {{timeUTC:string,timeMSK:string}}
 */
function getTimeLabels(time) {
  const tm = time ? new Date(time) : new Date()

  return {
    timeUTC: `time ${('0' + tm.getUTCHours()).slice(-2)}h UTC`,
    timeMSK: `time ${('0' + (tm.getUTCHours() + 3) % 24).slice(-2)}h MSK`
  }
}


/** @typedef {{name:string,plusBlocks:string[],minusBlocks:string[]}} Amitie */
/** @typedef {Array<{name:string,description:string,color:string}>} Labels */
/** @typedef {{url:string,title:string,labels:Labels,milestone:string,time:Date,timeUTC:string,timeMSK:string,timeLocal:string,body:string,answer:import('./questions.js').AnswerData,answerLabel:string,amitie:Amitie,miniСard:string}} Issue */
/**
 * @param {{number:number,html_url:string,title:string,labels:Labels,milestone:{title:string},body:string }} issue
 * @returns {Issue}
 */
function parseIssue({ number, html_url, title, labels, milestone, body }) { // eslint-disable-line camelcase
  const issue = {
    url: `/amitie/#issue=${number}`,
    urlGH: html_url, // eslint-disable-line camelcase
    title,
    labels: [],
    milestone: (milestone || { title: '' }).title,
    time: null,
    timeUTC: '',
    timeMSK: '',
    timeLocal: '',
    body,
    answer: null,
    answerLabel: '',
    amitie: {
      name: title,
      plusBlocks: [title],
      minusBlocks: ['?']
    },
    miniСard: ''
  }
  const bodyList = body.split('### ')

  for (const { name, description, color } of labels) {
    if (name.startsWith('q.')) {
      const [q, a] = name.replace(/q.(\d)-([А-Я]).*/, '$1-$2').split('-')

      issue.answer = getAnswerByLabels(q, a)
      issue.answerLabel = name
      continue
    } else if (name.startsWith('time ')) {
      if (name.endsWith('UTC')) {
        const utcHours = parseInt(name.replace('time ', '').replace('h UTC', ''))
        const time = new Date()

        if (!isNaN(utcHours)) {
          time.setUTCHours(utcHours)
          issue.time = time
        }

        issue.timeUTC = `${('0' + issue.time.getUTCHours()).slice(-2)}ч. utc`
        issue.timeMSK = `${('0' + (issue.time.getUTCHours() + 3) % 24).slice(-2)}ч. msk`
        issue.timeLocal = `${('0' + (issue.time.getHours()) % 24).slice(-2)}ч. местное`
      }
      continue
    }
    issue.labels.push({ name, description, color })
  }

  if (bodyList.length > 2) {
    if ((/# [А-ЯA-Z]/).test(bodyList[0])) {
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
    }
  }

  issue.miniСard = `${issue.amitie.name}\n` +
    `+ ${issue.amitie.plusBlocks.join('\n+')}\n` +
    `- ${issue.amitie.minusBlocks.join('\n-')}\n` +
    `${issue.answer.code} ${issue.answer.textShort}\n` +
    `${issue.timeUTC}, ${issue.timeMSK}, ${issue.milestone}\n` +
    `${window.location.origin}${issue.url}\n` +
    '#поделисьосколком'

  return issue
}


export {
  getMilestone,
  getMilestoneNumber,
  getTimeLabels,
  parseIssue
}
