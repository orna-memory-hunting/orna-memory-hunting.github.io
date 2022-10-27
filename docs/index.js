import { doAsync } from './lib/utils.js'
import { ghAPI, getAmitieMilestone, getTimeLabels, parseIssue } from './lib/github.js'
import { questionList, questionLabels, answerLabels } from './lib/questions.js'

/** @type {HTMLDivElement} */// @ts-ignore
const currentTime = document.getElementById('current-time')
/** @type {HTMLDivElement} */// @ts-ignore
const timeLapText = document.getElementById('time-lap-text')
/** @type {HTMLDivElement} */// @ts-ignore
const navTimeBack = document.getElementById('nav-time-back')
/** @type {HTMLDivElement} */// @ts-ignore
const navTimeForward = document.getElementById('nav-time-forward')
/** @type {HTMLDivElement} */// @ts-ignore
const amitieListLoader = document.getElementById('amitie-list-loader')
/** @type {HTMLDivElement} */// @ts-ignore
const amitieList = document.getElementById('amitie-list')
let utcHours = 0
let milestone = null

initTimeLap()
updateCurrentTime()
setInterval(updateCurrentTime, 1000)
doAsync(loadAmitieList)

navTimeBack.onclick = () => changeUTCHours(false)
navTimeForward.onclick = () => changeUTCHours(true)
currentTime.onclick = () => { initTimeLap(); doAsync(loadAmitieList) }


function initTimeLap() {
  const dt = new Date()
  const hr = ('0' + dt.getHours()).slice(-2)

  utcHours = dt.getUTCHours()
  timeLapText.textContent = `${hr}:00 - ${hr}:59`
}

/** @param {boolean} forward */
function changeUTCHours(forward) {
  forward ? utcHours++ : utcHours--

  const dt = new Date(new Date().setUTCHours(utcHours))
  const hr = ('0' + dt.getHours()).slice(-2)

  timeLapText.textContent = `${hr}:00 - ${hr}:59`
  doAsync(loadAmitieList)
}


function updateCurrentTime() {
  const dt = new Date()
  const time = ('0' + dt.getHours()).slice(-2) +
    (dt.getSeconds() % 2 === 0 ? ':' : ' ') +
    ('0' + dt.getMinutes()).slice(-2)

  currentTime.textContent = time
}


async function loadMilestone() {
  if (!milestone) {
    const apiURL = `${ghAPI}/milestones?state=open`
    const milestones = await (await fetch(apiURL)).json()
    const curMilestone = getAmitieMilestone()

    for (const { number, title } of milestones) {
      if (curMilestone === title) {
        milestone = number
        break
      }
    }
  }

  return milestone
}

async function loadAmitieList() {
  amitieListLoader.classList.remove('hide')
  amitieList.classList.add('hide')

  const time = new Date(new Date().setUTCHours(utcHours || 0))
  const labels = `&labels=${getTimeLabels(time).timeUTC}`
  const milestoneId = await loadMilestone()
  const milestone = `&milestone=${milestoneId}`
  const apiURL = `${ghAPI}/issues?state=open${labels}${milestone}`
  /** @type {Array} */
  const issues = milestoneId ? await (await fetch(apiURL)).json() : []
  const questionMap = {}
  let qExistsHTML = ''
  let qNotExistsHTML = ''
  let html = ''

  if (issues.length) {
    for (const issueRaw of issues) {
      const issue = parseIssue(issueRaw)

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
    for (let qid = 0; qid < questionList.length; qid++) {
      const question = questionList[qid]
      const answerMap = questionMap[qid]

      if (answerMap) {
        qExistsHTML += `<div class="question">${questionLabels[qid]}. ${question.q}</div>`
        for (let aid = 0; aid < question.a.length; aid++) {
          const answer = question.a[aid]
          /** @type {Array<import('./lib/github').Issue>} */
          const amities = answerMap[aid]

          if (amities) {
            qExistsHTML += `<div class="answer">${answerLabels[aid]}. ${answer}</div>`
            for (const amitie of amities) {
              qExistsHTML += `<div class="amitie"><a class="amitie-button blue text-button" target="_blank" href="${amitie.url}">${amitie.title}</a>`
              if (amitie.labels.length) {
                qExistsHTML += '<div class="amitie-labels">'
                for (const label of amitie.labels) {
                  qExistsHTML += '<div class="amitie-label"' +
                    ` style="color:#${label.color};border-color:#${label.color};#` +
                    ` title="${label.description}">${label.name}</div>`
                }
                qExistsHTML += '</div>'
              }
              qExistsHTML += '</div>'
            }
            if (amities.length < answerMap.len) {
              qExistsHTML += '<div class="amitie">' +
                '<div class="lost-amitie">Не разведано!</div>' +
                `<a class="text-button" target="_self" href="./add-amitie.html#q=${qid}&a=${aid}">+</a>` +
                '</div>'
            }
          } else {
            qExistsHTML += `<div class="answer">${answerLabels[aid]}. ${answer}</div>` +
              '<div class="amitie">' +
              '<div class="lost-amitie">Не разведано!</div>' +
              `<a class="text-button" target="_self" href="./add-amitie.html#q=${qid}&a=${aid}">+</a>` +
              '</div>'
          }
        }
      } else {
        qNotExistsHTML += `<div class="question">${questionLabels[qid]}. ${question.q}</div>` +
          '<div class="answer">' +
          '<div>Не разведано</div>' +
          `<a class="text-button" target="_self" href="./add-amitie.html#q=${qid}">+</a>` +
          '</div>'
      }
    }
    html = qExistsHTML + qNotExistsHTML
  } else {
    for (let qid = 0; qid < questionList.length; qid++) {
      const question = questionList[qid]

      qNotExistsHTML += `<div class="question">${questionLabels[qid]}. ${question.q}</div>` +
        '<div class="answer">' +
        '<div>Не разведано</div>' +
        `<a class="text-button" target="_self" href="./add-amitie.html#q=${qid}">+</a>` +
        '</div>'
    }
    html = qNotExistsHTML
  }

  amitieList.innerHTML = html

  amitieListLoader.classList.add('hide')
  amitieList.classList.remove('hide')
}
