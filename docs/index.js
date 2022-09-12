const questions = document.getElementById('questions')
const qData = [
  {
    q: 'Как ты считаешь, кто такие Непокорённые по своей сути...',
    a: [
      'герои',
      'отступники',
      'простаки',
      'понятие не имею'
    ]
  },
  {
    q: 'Вступив в бой, ты выберешь...',
    a: [
      'силы своей фракции',
      'использовать тайные  искусства',
      'искать другие решения',
      'довериться судьбе'
    ]
  },
  {
    q: 'Будучи почти на краю смерти, ты выберешь...',
    a: [
      'второе дыхание',
      'укрыться щитом',
      'принять неизбежное',
      'довериться судьбе'
    ]
  },
  {
    q: 'Чего бы тебе хотелось попросить у богов?',
    a: [
      'божественной силы',
      'утерянных знаний прошлого',
      'прощения',
      'ничего'
    ]
  },
  {
    q: 'Что движет тобой в битве против Падших?',
    a: [
      'желание принести мир',
      'месть за погибших',
      'стремление к гармонии',
      'ничего не движет'
    ]
  },
  {
    q: 'К кому ты обратишься за помощью?',
    a: [
      'наставнику',
      'партнёру по тренировочным боям',
      'питомцу',
      'себе'
    ]
  },
  {
    q: 'Что висит над твоим камином?',
    a: [
      'щит',
      'меч',
      'посох',
      'голова дракона',
      'ничего'
    ]
  }
]
const qLabels = ['1.', '2.', '3.', '4.', '5.', '6.', '7.']
const aLabels = ['А.', 'Б.', 'В.', 'Г.', 'Д.']

if (questions) {
  let html = ''

  for (let qIndex = 0; qIndex < qData.length; qIndex++) {
    const question = qData[qIndex]
    const answers = question.a

    html += `
      <div class="question-content">
        <span class="question" data-qid="${qIndex}">
          <span class="arrow-back">⇦</span>
          <span>${qLabels[qIndex]} ${question.q}</span>
        </span>
        <div class="answers">
    `

    for (let aIndex = 0; aIndex < answers.length; aIndex++) {
      const answer = answers[aIndex]

      html += `
        <span class="answer" data-aid="${aIndex}">
          <span class="arrow-back">⇦</span>
          <span>${aLabels[aIndex]} ${answer}</span>
        </span>
      `
    }

    html += '</div></div>'
  }

  questions.innerHTML = html
}

// @ts-ignore
document.querySelectorAll('.question').forEach((/** @type {HTMLDivElement} */ element) => {
  element.onclick = questionClick
})

// @ts-ignore
document.querySelectorAll('.answer').forEach((/** @type {HTMLDivElement} */ element) => {
  element.onclick = answerClick
})

/**
 * @param {Event} event
 */
function questionClick(event) {
  /** @type {HTMLDivElement} */// @ts-ignore
  const qContent = event.currentTarget.parentElement
  const isClose = qContent.classList.contains('active')

  // @ts-ignore
  document.querySelectorAll('.question-content').forEach((/** @type {HTMLDivElement} */ element) => {
    element.classList.remove('active')
    element.classList.remove('hide')
  })
  if (!isClose) {
    qContent.classList.add('active')
  } else {
    // @ts-ignore
    document.querySelectorAll('.answer').forEach((/** @type {HTMLDivElement} */ element) => {
      element.classList.remove('active')
      element.classList.remove('hide')
    })
    document.getElementById('upload')?.classList.add('hide')
  }
}

/**
 * @param {Event} event
 */
function answerClick(event) {
  /** @type {HTMLDivElement} */// @ts-ignore
  const answer = event.currentTarget
  const isClose = answer.classList.contains('active')

  // @ts-ignore
  document.querySelectorAll('.question-content').forEach((/** @type {HTMLDivElement} */ element) => {
    if (!element.classList.contains('active')) {
      element.classList.add('hide')
    }
  })
  // @ts-ignore
  document.querySelectorAll('.answer').forEach((/** @type {HTMLDivElement} */ element) => {
    element.classList.remove('active')
    if (!isClose && element !== answer) {
      element.classList.add('hide')
    } else {
      element.classList.remove('hide')
    }
  })

  if (!isClose) {
    answer.classList.add('active')
    document.getElementById('upload')?.classList.remove('hide')
  } else {
    document.getElementById('upload')?.classList.add('hide')
  }
}

/** @type {HTMLInputElement} */// @ts-ignore
const amitieFile = document.getElementById('amitie-file')
/** @type {HTMLImageElement} */// @ts-ignore
const amitieImg = document.getElementById('amitie-img')

amitieFile.addEventListener('change', handleAmitieFile)

function handleAmitieFile() {
  if (amitieFile.files?.length) {
    amitieImg.src = URL.createObjectURL(amitieFile.files[0])
    amitieImg.classList.remove('hide')
  } else {
    amitieImg.src = ''
    amitieImg.classList.add('hide')
  }
}
