import { getAnswerByLabels } from './questions.js'

export const ghAPI = 'https://api.github.com/repos/orna-memory-hunting/storage'
/**
 * @param {Date} [date]
 * @returns {string}
 */
export function getAmitieMilestone(date) {
  const dt = date ? new Date(date) : new Date()
  const sWeek = new Date(dt.setUTCDate(dt.getUTCDate() - dt.getUTCDay() + 1))
  const eWeek = new Date(dt.setUTCDate(dt.getUTCDate() + (7 - dt.getUTCDay())))
  const sDate = sWeek.toJSON().replace(/.*\d\d(\d\d)(-\d\d-\d\d).*/, '$1$2').split('-').reverse().join('.')
  const eDate = eWeek.toJSON().replace(/.*\d\d(\d\d)(-\d\d-\d\d).*/, '$1$2').split('-').reverse().join('.')

  return `${sDate} - ${eDate}`
}
/**
 *
 * @param {Date} [time]
 * @returns {{timeUTC:string,timeMSK:string}}
 */
export function getTimeLabels(time) {
  const tm = time ? new Date(time) : new Date()

  return {
    timeUTC: `time ${('0' + tm.getUTCHours()).slice(-2)}h UTC`,
    timeMSK: `time ${('0' + (tm.getUTCHours() + 3) % 24).slice(-2)}h MSK`
  }
}
/* eslint-ignore-nextlint */
/** @typedef {Array<{name:string,description:string,color:string}>} Labels */
/** @typedef {{url:string,title:string,labels:Labels,body:string,answer:import('./questions.js').AnswerData,answerLabel:string}} Issue */
/**
 * @param {{html_url:string,title:string,labels:Labels,body:string }} issue
 * @returns {Issue}
 */
export function parseIssue({ html_url, title, labels, body }) { // eslint-disable-line camelcase
  const issue = {
    url: html_url, // eslint-disable-line camelcase
    title,
    labels: [],
    body,
    answer: null,
    answerLabel: ''
  }

  for (const { name, description, color } of labels) {
    if (name.startsWith('q.')) {
      const [q, a] = name.replace(/q.(\d)-([А-Я]).*/, '$1-$2').split('-')

      issue.answer = getAnswerByLabels(q, a)
      issue.answerLabel = name
      continue
    } else if (name.startsWith('time ')) {
      continue
    }
    issue.labels.push({ name, description, color })
  }

  return issue
}
