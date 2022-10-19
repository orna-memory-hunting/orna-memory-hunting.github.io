/** @type {HTMLDivElement} */// @ts-ignore
const currentTime = document.getElementById('current-time')
/** @type {HTMLDivElement} */// @ts-ignore
const timeLapText = document.getElementById('time-lap-text')
/** @type {HTMLDivElement} */// @ts-ignore
const navTimeBack = document.getElementById('nav-time-back')
/** @type {HTMLDivElement} */// @ts-ignore
const navTimeForward = document.getElementById('nav-time-forward')
let utcHours = 0

initTimeLap()
updateCurrentTime()
setInterval(updateCurrentTime, 1000)

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
}


function updateCurrentTime() {
  const dt = new Date()
  const time = ('0' + dt.getHours()).slice(-2) +
    (dt.getSeconds() % 2 === 0 ? ':' : ' ') +
    ('0' + dt.getMinutes()).slice(-2)

  currentTime.textContent = time
}
