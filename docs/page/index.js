import { safeExecute, doAsync } from '../lib/utils.js'
import { getIssuesMap, getTimeLabels } from '../lib/github.js'
import { questionList, questionLabels, answerLabels } from '../lib/questions.js'
import { renderAmitieRow } from '../lib/amitie.js'

safeExecute(() => {
  /** @type {HTMLDivElement} */// @ts-ignore
  const currentTime = document.getElementById('current-time')
  /** @type {HTMLDivElement} */// @ts-ignore
  const navTimeBack = document.getElementById('nav-time-back')
  /** @type {HTMLDivElement} */// @ts-ignore
  const navTimeForward = document.getElementById('nav-time-forward')
  /** @type {HTMLDivElement} */// @ts-ignore
  const amitieListLoader = document.getElementById('amitie-list-loader')
  /** @type {HTMLDivElement} */// @ts-ignore
  const amitieList = document.getElementById('amitie-list')
  let utcHours = 0

  initTimeLap()
  updateCurrentTime()
  setInterval(updateCurrentTime, 1000)
  doAsync(loadAmitieList)

  navTimeBack.onclick = () => changeUTCHours(false)
  navTimeForward.onclick = () => changeUTCHours(true)
  currentTime.onclick = () => { setCurrentUTCHours(); doAsync(loadAmitieList) }


  function initTimeLap() {
    const params = new URLSearchParams(window.location.hash.replace('#', ''))
    const utcHoursParam = parseInt(params.get('utcHours'))
    const dt = isNaN(utcHoursParam) ? new Date() : new Date(new Date().setUTCHours(utcHoursParam))
    const hr = ('0' + dt.getHours()).slice(-2)

    utcHours = dt.getUTCHours()
    navTimeBack.textContent = `<- ${hr}:00`
    navTimeForward.textContent = `${hr}:59 ->`
  }

  function setCurrentUTCHours() {
    const dt = new Date()
    const hr = ('0' + dt.getHours()).slice(-2)
    const params = new URLSearchParams(window.location.hash.replace('#', ''))

    params.delete('utcHours')
    window.history.replaceState(null, '', `/#${params.toString()}`)
    utcHours = dt.getUTCHours()
    navTimeBack.textContent = `<- ${hr}:00`
    navTimeForward.textContent = `${hr}:59 ->`
  }

  /** @param {boolean} forward */
  function changeUTCHours(forward) {
    forward ? utcHours++ : utcHours--
    utcHours = utcHours % 24
    utcHours = utcHours < 0 ? 23 : utcHours


    const dt = new Date(new Date().setUTCHours(utcHours))
    const hr = ('0' + dt.getHours()).slice(-2)
    const params = new URLSearchParams(window.location.hash.replace('#', ''))

    params.set('utcHours', utcHours + '')
    window.history.replaceState(null, '', `/#${params.toString()}`)
    navTimeBack.textContent = `<- ${hr}:00`
    navTimeForward.textContent = `${hr}:59 ->`
    doAsync(loadAmitieList)
  }


  function updateCurrentTime() {
    const dt = new Date()
    const time = ('0' + dt.getHours()).slice(-2) +
      (dt.getSeconds() % 2 === 0 ? ':' : ' ') +
      ('0' + dt.getMinutes()).slice(-2)

    currentTime.textContent = time
  }


  async function loadAmitieList() {
    amitieListLoader.classList.remove('hide')
    amitieList.classList.add('hide')

    const { timeUTC } = getTimeLabels(utcHours)
    const questionMap = (await getIssuesMap({ labels: [timeUTC] }).catch(err => {
      return err.message === 'milestone not found' ? { [utcHours]: false } : err
    }))[utcHours]
    let qExistsHTML = ''
    let qNotExistsHTML = ''
    let html = ''

    if (questionMap) {
      for (let qid = 0; qid < questionList.length; qid++) {
        const question = questionList[qid]
        const answerMap = questionMap[qid]

        if (answerMap) {
          qExistsHTML += `<div class="question">${questionLabels[qid]}. ${question.q}</div>`
          for (let aid = 0; aid < question.a.length; aid++) {
            const answer = question.a[aid]
            /** @type {Array<import('../lib/github').Issue>} */
            const amities = answerMap[aid]

            if (amities) {
              qExistsHTML += `<div class="answer">${answerLabels[aid]}. ${answer}</div>`
              for (const amitie of amities) {
                qExistsHTML += renderAmitieRow(amitie)
              }
              if (amities.length < answerMap.len) {
                qExistsHTML += '<div class="amitie-row">' +
                  '<div class="lost-amitie">Не разведано!</div>' +
                  `<a class="text-button" target="_self" href="/amitie/new/#q=${qid}&a=${aid}&t=${utcHours}">+</a>` +
                  '</div>'
              }
            } else {
              qExistsHTML += `<div class="answer">${answerLabels[aid]}. ${answer}</div>` +
                '<div class="amitie-row">' +
                '<div class="lost-amitie">Не разведано!</div>' +
                `<a class="text-button" target="_self" href="/amitie/new/#q=${qid}&a=${aid}&t=${utcHours}">+</a>` +
                '</div>'
            }
          }
        } else {
          qNotExistsHTML += `<div class="question">${questionLabels[qid]}. ${question.q}</div>` +
            '<div class="answer">' +
            '<div>Не разведано</div>' +
            `<a class="text-button" target="_self" href="/amitie/new/#q=${qid}&t=${utcHours}">+</a>` +
            '</div>'
        }
      }
      html = qExistsHTML + qNotExistsHTML
    } else if (questionMap === false) {
      html = '<div class="amitie-list-middle">На этой неделе разведку не проводим</div>'
    } else {
      for (let qid = 0; qid < questionList.length; qid++) {
        const question = questionList[qid]

        qNotExistsHTML += `<div class="question">${questionLabels[qid]}. ${question.q}</div>` +
          '<div class="answer">' +
          '<div>Не разведано</div>' +
          `<a class="text-button" target="_self" href="/amitie/new/#q=${qid}&t=${utcHours}">+</a>` +
          '</div>'
      }
      html = qNotExistsHTML
    }

    amitieList.innerHTML = html

    amitieListLoader.classList.add('hide')
    amitieList.classList.remove('hide')
  }


  let xDownTouch = null
  let yDownTouch = null

  document.addEventListener('touchstart', (/** @type {TouchEvent} */evt) => {
    xDownTouch = evt.touches[0].clientX
    yDownTouch = evt.touches[0].clientY
  }, false)
  document.addEventListener('touchmove', (/** @type {TouchEvent} */evt) => {
    if (!xDownTouch || !yDownTouch) return

    const xUp = evt.touches[0].clientX
    const yUp = evt.touches[0].clientY
    const xDiff = xDownTouch - xUp
    const yDiff = yDownTouch - yUp

    if (Math.abs(xDiff) - Math.abs(yDiff) > 10) {
      if (xDiff > 0) {
        changeUTCHours(true)
        xDownTouch = yDownTouch = null
      } else {
        changeUTCHours(false)
        xDownTouch = yDownTouch = null
      }
    }
  }, false)
})
