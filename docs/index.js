/** @type {HTMLDivElement} */// @ts-ignore
const questions = document.getElementById('questions')
/** @type {HTMLInputElement} */// @ts-ignore
const timeSelect = document.getElementById('time-select')
/** @type {HTMLSpanElement} */// @ts-ignore
const timeFileField = document.getElementById('time-file-field')
/** @type {HTMLSpanElement} */// @ts-ignore
const timeFile = document.getElementById('time-file')
/** @type {HTMLInputElement} */// @ts-ignore
const amitieFile = document.getElementById('amitie-file')
/** @type {HTMLDivElement} */// @ts-ignore
const amitiePrep = document.getElementById('amitie-preprocessing')
/** @type {HTMLCanvasElement} */// @ts-ignore
const amitieCanvas = document.getElementById('amitie-canvas')
/** @type {CanvasRenderingContext2D} */// @ts-ignore
const amitieContext = amitieCanvas.getContext('2d')
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
    toggleUpload(false)
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
    toggleUpload(true)
  } else {
    toggleUpload(false)
  }
}

/** @param {boolean} status  */
function toggleUpload(status) {
  /** @type {HTMLDivElement} */// @ts-ignore
  const upload = document.getElementById('upload')

  if (status) {
    if (!amitieFile.files?.length) {
      timeSelect.value = ('0' + new Date().getHours()).slice(-2)
    }
    upload.classList.remove('hide')
  } else {
    upload.classList.add('hide')
  }
}

amitieFile.addEventListener('change', handleAmitieFile)

function handleAmitieFile() {
  if (amitieFile.files?.length) {
    /** @type {File} */// @ts-ignore
    const [file] = amitieFile.files
    const image = new window.Image()

    amitieCanvas.classList.add('hide')
    amitiePrep.classList.remove('hide')
    image.src = URL.createObjectURL(file)
    image.onload = () => {
      const canvas = document.createElement('canvas')
      /** @type {CanvasRenderingContext2D} */// @ts-ignore
      const context = canvas.getContext('2d')
      const leftShift = image.width / 9 ^ 0
      const rightShift = image.width - leftShift
      const dataBlocks = []
      let currentBlock = 0
      let currentBlockEnd = 0

      canvas.width = image.width
      canvas.height = image.height
      amitieCanvas.width = canvas.width
      amitieCanvas.height = 0
      context.drawImage(image, 0, 0)

      for (let index = 0; index < image.height; index++) {
        const imgData = context.getImageData(leftShift, index, rightShift, 1).data
        let match = false
        let iDataIndex = 0

        while (iDataIndex < imgData.length) {
          // imgData -> RGBA * len
          if (Math.max(imgData[iDataIndex], imgData[iDataIndex + 1], imgData[iDataIndex + 2]) > 128) {
            match = true
            break
          }
          iDataIndex += 4
        }

        if (match) {
          if (!currentBlock) {
            currentBlock = index
          }
          currentBlockEnd = index
        } else if (currentBlock) {
          currentBlock -= 2
          currentBlockEnd += 2
          index += 2

          const h = currentBlockEnd - currentBlock

          dataBlocks.push({ y: currentBlock, newY: 0, h, totalH: 0 })
          currentBlock = 0
          currentBlockEnd = 0
        }
      }

      // TODO Убираем ненужные строки

      dataBlocks[0].totalH = dataBlocks[0].h
      for (let index = 1; index < dataBlocks.length; index++) {
        const dataBlock = dataBlocks[index]

        dataBlock.newY = dataBlocks[index - 1].totalH + 1
        dataBlock.totalH = dataBlock.newY + dataBlock.h
      }

      amitieCanvas.height = dataBlocks[dataBlocks.length - 1].totalH
      for (const dataBlock of dataBlocks) {
        amitieContext.drawImage(canvas,
          0, dataBlock.y, canvas.width, dataBlock.h,
          0, dataBlock.newY, canvas.width, dataBlock.h
        )
        amitieContext.fillStyle = 'red'
        amitieContext.fillRect(0, dataBlock.totalH, canvas.width, 1)
      }

      amitiePrep.classList.add('hide')
      amitieCanvas.classList.remove('hide')

      const lDate = new Date(file.lastModified)

      timeSelect.value = ('0' + lDate.getHours()).slice(-2)
      timeFile.textContent = lDate.toLocaleString()
      timeFileField.classList.remove('hide')
    }
  } else {
    amitiePrep.classList.add('hide')
    amitieCanvas.classList.add('hide')
    timeFileField.classList.add('hide')
    amitieContext.clearRect(0, 0, amitieCanvas.width, amitieCanvas.height)
  }
}
