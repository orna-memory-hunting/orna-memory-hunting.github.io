import { doAsync, nextTick, nextAnimationFrame, registerServiceWorker } from './lib/utils.js'
import { questionList, questionLabels, answerLabels } from './lib/questions.js'

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
/** @type {HTMLCanvasElement} */// @ts-ignore
const amitieCanvas = document.getElementById('amitie-canvas')
/** @type {CanvasRenderingContext2D} */// @ts-ignore
const amitieContext = amitieCanvas.getContext('2d')
let html = ''

doAsync(registerServiceWorker)


for (let qIndex = 0; qIndex < questionList.length; qIndex++) {
  const question = questionList[qIndex]
  const answers = question.a

  html += `
      <div class="question-content">
        <span class="question" data-qid="${qIndex}">
          <span class="arrow-back">⇦</span>
          <span>${questionLabels[qIndex]} ${question.q}</span>
        </span>
        <div class="answers">
    `

  for (let aIndex = 0; aIndex < answers.length; aIndex++) {
    const answer = answers[aIndex]

    html += `
        <span class="answer" data-aid="${aIndex}">
          <span class="arrow-back">⇦</span>
          <span>${answerLabels[aIndex]} ${answer}</span>
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
    doAsync(() => prepareAmitieImage(amitieFile.files[0]))
  } else {
    amitieCanvas.classList.add('hide')
    timeFileField.classList.add('hide')
    amitieContext.clearRect(0, 0, amitieCanvas.width, amitieCanvas.height)
  }
}

/** @param {File} file */
async function prepareAmitieImage(file) {
  const lightColorBorder = 128
  const colorIntensityLimit = 16
  const animationTime = 100
  const image = new window.Image()

  amitieCanvas.classList.add('hide')
  image.src = URL.createObjectURL(file)

  await new Promise((resolve) => { image.onload = resolve })

  await nextAnimationFrame()
  amitieCanvas.width = image.width
  amitieCanvas.height = image.height
  amitieContext.drawImage(image, 0, 0)
  amitieCanvas.classList.remove('hide')
  await nextTick()

  const canvas = document.createElement('canvas')
  /** @type {CanvasRenderingContext2D} */// @ts-ignore
  const context = canvas.getContext('2d')
  const leftShift = image.width / 9 ^ 0
  const rightShift = image.width - leftShift
  let dataBlocks = []
  let currentBlock = 0
  let currentBlockEnd = 0
  let spaceHeight = 0
  let nameBlock = null
  const plusBlocks = []
  const minusBlocks = []

  canvas.width = image.width
  canvas.height = image.height
  context.drawImage(image, 0, 0)

  for (let index = 0; index < image.height; index++) {
    const imgData = context.getImageData(leftShift, index, rightShift, 1).data
    let match = false
    let iDataIndex = 0

    while (iDataIndex < imgData.length) {
      // imgData -> RGBA * len
      const r = imgData[iDataIndex]
      const g = imgData[iDataIndex + 1]
      const b = imgData[iDataIndex + 2]

      match = r > lightColorBorder || g > lightColorBorder || b > lightColorBorder
      if (match) break
      iDataIndex += 4
    }

    if (match) {
      if (!currentBlock) {
        currentBlock = index
      }
      currentBlockEnd = index
      spaceHeight = 0
    } else if (spaceHeight < 8) {
      spaceHeight++
    } else if (currentBlock) {
      currentBlock -= 1
      currentBlockEnd += 1
      index += 1
      spaceHeight = 0

      const h = currentBlockEnd - currentBlock

      dataBlocks.push({ y: currentBlock, newY: 0, h, totalH: 0 })

      await nextAnimationFrame()
      amitieContext.lineWidth = 0.5
      amitieContext.strokeStyle = '#f0fe'
      amitieContext.strokeRect(0, currentBlock, image.width, h)
      amitieContext.fillStyle = '#f0f1'
      amitieContext.fillRect(0, currentBlock, image.width, h)
      await nextTick(animationTime)

      currentBlock = 0
      currentBlockEnd = 0
    }
  }

  let firstBaffIndex = 0
  let lastBaffIndex = 0

  for (let index = 1; index < dataBlocks.length - 1; index++) {
    const prevBlock = dataBlocks[index - 1]
    const dataBlock = dataBlocks[index]
    const nextBlock = dataBlocks[index + 1]
    const prevSpace = dataBlock.y - prevBlock.y - prevBlock.h
    const nextSpace = nextBlock.y - dataBlock.y - dataBlock.h


    if (dataBlock.h * 2 < prevSpace) {
      firstBaffIndex = index
    }
    if (firstBaffIndex && dataBlock.h * 2 < nextSpace) {
      lastBaffIndex = index
    }

    if (firstBaffIndex && lastBaffIndex) {
      if (lastBaffIndex - firstBaffIndex > 0) {
        break
      } else {
        firstBaffIndex = lastBaffIndex = 0
      }
    }
  }

  await nextAnimationFrame()
  amitieContext.drawImage(image, 0, 0)
  await nextTick()

  if (firstBaffIndex && lastBaffIndex) {
    let isGreenButton = false
    const lastBlock = dataBlocks[dataBlocks.length - 1]
    const imgData = context.getImageData(leftShift, lastBlock.y + lastBlock.h / 2, rightShift, 1).data
    let iDataIndex = 0

    while (iDataIndex < imgData.length) {
      // imgData -> RGBA * len
      const r = imgData[iDataIndex]
      const g = imgData[iDataIndex + 1]
      const b = imgData[iDataIndex + 2]
      const match = r > lightColorBorder || g > lightColorBorder || b > lightColorBorder

      if (match) {
        isGreenButton = g > (r + b) / 2 + colorIntensityLimit
        if (isGreenButton) break
      }
      iDataIndex += 4
    }


    if (isGreenButton) {
      nameBlock = dataBlocks[firstBaffIndex - 1]
      firstBaffIndex++
    } else {
      nameBlock = dataBlocks[firstBaffIndex - 5]

      const imgData = context.getImageData(leftShift, nameBlock.y + nameBlock.h / 2, rightShift, 1).data
      let iDataIndex = 0

      while (iDataIndex < imgData.length) {
        // imgData -> RGBA * len
        const r = imgData[iDataIndex]
        const g = imgData[iDataIndex + 1]
        const b = imgData[iDataIndex + 2]
        const match = r > lightColorBorder || g > lightColorBorder || b > lightColorBorder

        if (match) {
          const colored =
            (r > (g + b) / 2 + colorIntensityLimit) ||
            (g > (b + r) / 2 + colorIntensityLimit) ||
            (b > (r + g) / 2 + colorIntensityLimit)

          if (!colored) {
            nameBlock = dataBlocks[firstBaffIndex - 6]
          }
          break
        }

        iDataIndex += 4
      }
    }

    if (nameBlock) {
      await nextAnimationFrame()
      amitieContext.lineWidth = 0.5
      amitieContext.strokeStyle = '#00fe'
      amitieContext.strokeRect(0, nameBlock.y, image.width, nameBlock.h)
      amitieContext.fillStyle = '#00f1'
      amitieContext.fillRect(0, nameBlock.y, image.width, nameBlock.h)
      await nextTick(animationTime)
    }

    for (let index = firstBaffIndex; index < lastBaffIndex + 1; index++) {
      const dataBlock = dataBlocks[index]
      const imgData = context.getImageData(leftShift, dataBlock.y + dataBlock.h / 2, rightShift, 1).data
      let iDataIndex = 0
      let isRed = false

      while (iDataIndex < imgData.length) {
        // imgData -> RGBA * len
        const r = imgData[iDataIndex]
        const g = imgData[iDataIndex + 1]
        const b = imgData[iDataIndex + 2]
        const match = r > lightColorBorder || g > lightColorBorder || b > lightColorBorder

        if (match) {
          isRed = r > (b + g) / 2 + colorIntensityLimit
          break
        }

        iDataIndex += 4
      }

      await nextAnimationFrame()
      if (isRed) {
        minusBlocks.push(dataBlock)
        amitieContext.strokeStyle = '#f00e'
        amitieContext.fillStyle = '#f001'
      } else {
        plusBlocks.push(dataBlock)
        amitieContext.strokeStyle = '#0f0e'
        amitieContext.fillStyle = '#0f01'
      }
      amitieContext.lineWidth = 0.5
      amitieContext.strokeRect(0, dataBlock.y, image.width, dataBlock.h)
      amitieContext.fillRect(0, dataBlock.y, image.width, dataBlock.h)
      await nextTick(animationTime)
    }

    dataBlocks = [
      nameBlock,
      ...plusBlocks,
      ...minusBlocks
    ]
  }

  if (dataBlocks.length) {
    dataBlocks[0].totalH = dataBlocks[0].h
    for (let index = 1; index < dataBlocks.length; index++) {
      const dataBlock = dataBlocks[index]

      dataBlock.newY = dataBlocks[index - 1].totalH
      dataBlock.totalH = dataBlock.newY + dataBlock.h
    }

    await nextAnimationFrame()
    amitieCanvas.width = canvas.width
    amitieCanvas.height = dataBlocks[dataBlocks.length - 1].totalH
    for (const dataBlock of dataBlocks) {
      amitieContext.drawImage(canvas,
        0, dataBlock.y, canvas.width, dataBlock.h,
        0, dataBlock.newY, canvas.width, dataBlock.h
      )
    }
  }

  const lDate = new Date(file.lastModified)

  timeSelect.value = ('0' + lDate.getHours()).slice(-2)
  timeFile.textContent = lDate.toLocaleString()
  timeFileField.classList.remove('hide')
}
