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
      const imgMiddle = image.width / 2 ^ 0
      const imgQuarterLeft = imgMiddle / 2 ^ 0
      const imgQuarterRight = image.height - imgQuarterLeft
      const amitiePos = [0, image.height]
      const baffsPos = [0, 0]
      let index = 0
      let lastIndex = 0 // Сохранеине индекса, если нужно начать поиск с предыдущей фазы
      let backward = image.height
      let isBlue = 0
      let isRed = 0

      canvas.width = image.width
      canvas.height = image.height
      context.drawImage(image, 0, 0)

      // Идем до начала рисунка осколка
      while (1) {
        const imgData = context.getImageData(imgMiddle, index, 1, 1).data
        const medium = (imgData[0] + imgData[1] + imgData[2]) / 3
        const coloured = (Math.abs(imgData[0] - medium) +
          Math.abs(imgData[1] - medium) +
          Math.abs(imgData[2] - medium))

        if (medium > 100 && coloured > 50) {
          amitiePos[0] = index
          index++
          break
        }

        index++
        if (index > image.height) {
          break
        }
      }

      // Проходим рисунок осколка
      while (1) {
        const imgData = context.getImageData(imgQuarterLeft, index, imgQuarterRight, 1).data
        const maxData = imgData.filter(i => i < 255 && i > 100)

        if (!maxData.length) {
          amitiePos[0] = index
          index++
          break
        }

        index++
        if (index > image.height) {
          break
        }
      }

      // Ищем начало текста названия осколка
      while (1) {
        const imgData = context.getImageData(imgQuarterLeft, index, imgQuarterRight, 1).data
        const maxData = imgData.filter(i => i < 255 && i > 100)

        if (maxData.length) {
          amitiePos[0] = index - 2
          index++
          break
        }

        index++
        if (index > image.height) {
          break
        }
      }

      // Ищем конец текста названия осколка
      while (1) {
        const imgData = context.getImageData(imgQuarterLeft, index, imgQuarterRight, 1).data
        const maxData = imgData.filter(i => i < 255 && i > 100)

        if (!maxData.length) {
          amitiePos[1] = index + 12
          index++
          break
        }

        index++
        if (index > image.height) {
          break
        }
      }

      baffsPos[0] = amitiePos[1] + 1
      baffsPos[1] = image.height

      // # 1 - Бафы после вопроса, синий сверху -> красный снизу
      lastIndex = index
      while (1) {
        // imgData -> RGBA -- Ищем синий
        const imgData = aSplit(context.getImageData(imgQuarterLeft, index, imgQuarterRight, 1).data, 4)
        const blue = imgData
          .map(i => i[2] - Math.max(i[0], i[1]))
          .filter(i => i > 25)

        if (blue.length > 25) {
          isBlue = index - 12
          index++
          break
        }

        index++
        if (index > image.height) {
          break
        }
      }
      while (1) {
        // imgData -> RGBA -- ищем красный
        const imgData = aSplit(context.getImageData(imgQuarterLeft, backward, imgQuarterRight, 1).data, 4)
        const red = imgData
          .map(i => i[0] - Math.max(i[1], i[2]))
          .filter(i => i > 25)

        if (red.length > 25) {
          isRed = backward + 6
          backward--
          break
        }

        backward--
        if (backward < index) {
          break
        }
      }

      if (isBlue && isRed) {
        baffsPos[0] = isBlue
        baffsPos[1] = isRed
        // # 2 - Не удалось распонать осколок со скрина с завершения последнего испытания
        //   ищем по скрину со склада
      } else {
        const blockArea = []
        let heightEmptyBlock = 0
        let patternEmptyBlock = 0

        index = lastIndex
        while (1) {
          const imgData = context.getImageData(imgQuarterLeft, index, imgQuarterRight, 1).data
          const maxData = Math.max(...imgData.filter(i => i < 255))

          console.log(maxData)
          if (maxData < 100) {
            heightEmptyBlock++
          } else if (!patternEmptyBlock) {
            patternEmptyBlock = heightEmptyBlock * 1.8 ^ 0
          } else if (heightEmptyBlock > patternEmptyBlock) {
            if (blockArea.length === 0) {
              blockArea.push(index)
            } else if (blockArea.length === 1) {
              blockArea.push(index - heightEmptyBlock)
            }
            heightEmptyBlock = 0
            if (blockArea.length > 1) {
              break
            }
          } else {
            heightEmptyBlock = 0
          }

          index++
          if (index > image.height) {
            break
          }
        }
        if (blockArea.length === 2) {
          [baffsPos[0], baffsPos[1]] = blockArea
        }
      }

      const amitieSize = amitiePos[1] - amitiePos[0]
      const baffsSize = baffsPos[1] - baffsPos[0]

      amitieCanvas.width = canvas.width
      amitieCanvas.height = amitieSize + baffsSize
      amitieContext.drawImage(canvas,
        0, amitiePos[0], canvas.width, amitieSize,
        0, 0, canvas.width, amitieSize
      )
      amitieContext.drawImage(canvas,
        0, baffsPos[0], canvas.width, baffsSize,
        0, amitieSize, canvas.width, baffsSize
      )

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

function aSplit(arr, partSize) {
  const numParts = arr.length / partSize | 0

  return Array
    .from({ length: numParts }, (n, i) => i * partSize)
    .map((n, i, a) => arr.slice(n, a[i + 1]))
}
