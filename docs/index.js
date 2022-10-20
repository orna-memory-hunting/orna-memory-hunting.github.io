import { doAsync } from './lib/utils.js'
import { ghAPI, getAmitieMilestone, getTimeLabels, parseIssue } from './lib/github.js'

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

  const time = new Date(new Date().setUTCHours(utcHours))
  const labels = `&labels=${getTimeLabels(time).timeUTC}`
  const milestone = `&milestone=${await loadMilestone()}`
  const apiURL = `${ghAPI}/issues?state=open${labels}${milestone}`
  const issues = await (await fetch(apiURL)).json()
  let issuesHTML = ''


  for (const issueRaw of issues) {
    const issue = parseIssue(issueRaw)

    issuesHTML += `<div>${issue.answerLabel}</div>`
    issuesHTML += `<div>${issue.title}</div>`
    issuesHTML += `<div>${issue.body}</div>`
  }

  amitieList.innerHTML = issuesHTML

  amitieListLoader.classList.add('hide')
  amitieList.classList.remove('hide')
}
