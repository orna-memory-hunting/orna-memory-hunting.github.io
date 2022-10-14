export const questionList = [
  {
    q: 'Что висит над твоим камином?',
    sq: 'над камином',
    a: [
      'щит',
      'меч',
      'посох',
      'голова дракона',
      'ничего'
    ]
  },
  {
    q: 'Как ты считаешь, кто такие Непокорённые по своей сути...',
    sq: 'кто Непокорённые',
    a: [
      'герои',
      'отступники',
      'простаки',
      'понятие не имею'
    ]
  },
  {
    q: 'Вступив в бой, ты выберешь...',
    sq: 'в бою выберешь',
    a: [
      'силы своей фракции',
      'использовать тайные искусства',
      'искать другие решения',
      'довериться судьбе'
    ],
    sa: [
      'силы фракции',
      'тайные искусства',
      'другие решения',
      'довериться судьбе'
    ]
  },
  {
    q: 'Будучи почти на краю смерти, ты выберешь...',
    sq: 'на краю смерти',
    a: [
      'второе дыхание',
      'укрыться щитом',
      'принять неизбежное',
      'довериться судьбе'
    ]
  },
  {
    q: 'Чего бы тебе хотелось попросить у богов?',
    sq: 'попросить у богов',
    a: [
      'божественной силы',
      'утерянных знаний прошлого',
      'прощения',
      'ничего'
    ],
    sa: [
      'божественной силы',
      'утерянных знаний',
      'прощения',
      'ничего'
    ]
  },
  {
    q: 'Что движет тобой в битве против Падших?',
    sq: 'в битве c Падшими',
    a: [
      'желание принести мир',
      'месть за погибших',
      'стремление к гармонии',
      'ничего не движет'
    ],
    sa: [
      'мир',
      'месть',
      'гармонии',
      'ничего'
    ]
  },
  {
    q: 'К кому ты обратишься за помощью?',
    sq: 'к кому за помощью',
    a: [
      'наставнику',
      'партнёру по тренировочным боям',
      'питомцу',
      'себе'
    ],
    sa: [
      'наставнику',
      'партнёру',
      'питомцу',
      'себе'
    ]
  }
]
export const questionLabels = ['1', '2', '3', '4', '5', '6', '7']
export const answerLabels = ['А', 'Б', 'В', 'Г', 'Д']


function renderQuestionList() {
  let html = ''

  for (let qIndex = 0; qIndex < questionList.length; qIndex++) {
    const question = questionList[qIndex]
    const answers = question.a

    html += `
        <div class="question-content" data-qid="${qIndex}">
          <span class="question">
            <span class="arrow-back">⇦</span>
            <span>${questionLabels[qIndex]}. ${question.q}</span>
          </span>
          <div class="answers">
      `

    for (let aIndex = 0; aIndex < answers.length; aIndex++) {
      const answer = answers[aIndex]

      html += `
          <span class="answer" data-aid="${aIndex}">
            <span class="arrow-back">⇦</span>
            <span>${answerLabels[aIndex]}. ${answer}</span>
          </span>
        `
    }

    html += '</div></div>'
  }

  return html
}


function getSelectedAnswer() {
  /** @type {HTMLDivElement} */// @ts-ignore
  const question = document.querySelector('.question-content.active')
  /** @type {HTMLDivElement} */// @ts-ignore
  const answer = question ? question.querySelector('.answer.active') : null

  if (question && answer) {
    const qid = Number(question.dataset.qid)
    const aid = Number(answer.dataset.aid)

    return {
      qid,
      aid,
      q: questionList[qid].q,
      sq: questionList[qid].sq || questionList[qid].q,
      a: questionList[qid].a[aid],
      sa: (questionList[qid].sa || questionList[qid].a)[aid],
      qLabel: questionLabels[qid],
      aLabel: answerLabels[aid]
    }
  }
}


export {
  renderQuestionList,
  getSelectedAnswer
}
