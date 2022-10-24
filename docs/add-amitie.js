import { doAsync, nextTick, nextAnimationFrame } from './lib/utils.js'
import { renderQuestionList, getSelectedAnswer } from './lib/questions.js'
import { getAmitieMilestone, getTimeLabels } from './lib/github.js'

/** @type {{Tesseract:import('tesseract.js')}} */
const { Tesseract } = window
const tesseractCore = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@3.0.2/tesseract-core.wasm.js'
/** @type {HTMLDivElement} */// @ts-ignore
const questions = document.getElementById('questions')
/** @type {HTMLInputElement} */// @ts-ignore
const timeSelect = document.getElementById('time-select')
/** @type {HTMLSpanElement} */// @ts-ignore
const timeFileField = document.getElementById('time-file-field')
/** @type {HTMLSpanElement} */// @ts-ignore
const timeFile = document.getElementById('time-file')
/** @type {HTMLCanvasElement} */// @ts-ignore
const amitieCanvas = document.getElementById('amitie-canvas')
/** @type {CanvasRenderingContext2D} */// @ts-ignore
const amitieContext = amitieCanvas.getContext('2d')
/** @type {HTMLDivElement} */// @ts-ignore
const amitieResults = document.getElementById('amitie-results')
/** @type {HTMLInputElement} */// @ts-ignore
const amitieName = document.getElementById('amitie-name')
/** @type {HTMLDivElement} */// @ts-ignore
const qualityField = document.getElementById('quality-field')
/** @type {HTMLInputElement} */// @ts-ignore
const amitiePlus1 = document.getElementById('amitie-plus1')
/** @type {HTMLInputElement} */// @ts-ignore
const amitiePlus2 = document.getElementById('amitie-plus2')
/** @type {HTMLInputElement} */// @ts-ignore
const amitiePlus3 = document.getElementById('amitie-plus3')
/** @type {HTMLInputElement} */// @ts-ignore
const amitieMinus1 = document.getElementById('amitie-minus1')
/** @type {HTMLInputElement} */// @ts-ignore
const amitieMinus2 = document.getElementById('amitie-minus2')
/** @type {HTMLInputElement} */// @ts-ignore
const amitieMinus3 = document.getElementById('amitie-minus3')
/** @type {HTMLButtonElement} */// @ts-ignore
const sendToGithub = document.getElementById('send-to-github')
/** @type {HTMLLinkElement} */// @ts-ignore
const sendToGithubLink = document.getElementById('send-to-github-link')

questions.innerHTML = renderQuestionList()

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
    toggleAmitieInfo(false)
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
    toggleAmitieInfo(true)
  } else {
    toggleAmitieInfo(false)
  }
}

/** @type {HTMLInputElement} */// @ts-ignore
const amitieFile = document.getElementById('amitie-file')
/** @type {HTMLDivElement} */// @ts-ignore
const amitieFileName = document.getElementById('amitie-file-name')
/** @type {HTMLDivElement} */// @ts-ignore
const amitiUploadField = document.getElementById('amitie-upload-field')
/** @type {HTMLDivElement} */// @ts-ignore
const amitieUploadResults = document.getElementById('amitie-upload-results')
/** @type {HTMLSpanElement} */// @ts-ignore
const amitieFileFromClipboard = document.getElementById('amitie-file-from-clipboard')
/** @type {HTMLDivElement} */// @ts-ignore
const recognizingTextLog = document.getElementById('recognizing-text-log')

amitiUploadField.onclick = () => {
  amitieFile.click()
}

amitiUploadField.ondragover = (/** @type {DragEvent} */ event) => {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer.items.length) {
    amitiUploadField.classList.add('dragenter')
  }
}

amitiUploadField.ondragleave = (/** @type {Event} */ event) => {
  event.preventDefault()
  event.stopPropagation()
  amitiUploadField.classList.remove('dragenter')
}

amitiUploadField.ondrop = (/** @type {DragEvent} */ event) => {
  event.preventDefault()
  event.stopPropagation()
  amitiUploadField.classList.remove('dragenter')

  const { files } = event.dataTransfer

  if (files.length) {
    doAsync(() => prepareAmitieImage(files[0]))
  } else {
    window.alert('Не удалось найти файл изображения!')
  }
}

document.addEventListener('paste', (/** @type {ClipboardEvent} */event) => {
  /** @type {HTMLDivElement} */// @ts-ignore
  const input = event.target

  if (input.tagName !== 'INPUT') {
    event.preventDefault()
    event.stopPropagation()

    const { files } = event.clipboardData

    if (files.length) {
      doAsync(() => prepareAmitieImage(files[0]))
    } else {
      window.alert('Не удалось найти файл изображения!')
    }
  }
})

amitieFileFromClipboard.onclick = (/** @type {MouseEvent} */event) => {
  event.preventDefault()
  event.stopPropagation()

  navigator.clipboard.read().then(clipboardItems => {
    if (clipboardItems.length) {
      const [clipboardItem] = clipboardItems

      if (clipboardItem.types.length && clipboardItem.types[0].startsWith('image')) {
        clipboardItem.getType(clipboardItem.types[0]).then(data => {
          const file = new window.File([data], 'image.png', { type: clipboardItem.types[0] })

          doAsync(() => prepareAmitieImage(file))
        })
      } else {
        window.alert('Не удалось найти файл изображения!')
      }
    } else {
      window.alert('Не удалось найти файл изображения!')
    }
  })
}

// @ts-ignore
navigator.permissions.query({ name: 'clipboard-read' }).then(permission => {
  if (permission.state === 'denied') {
    amitieFileFromClipboard.classList.remove('aslink')
    amitieFileFromClipboard.onclick = null
  }
})

timeSelect.onchange = () => updateGithubLink()

/** @param {boolean} status  */
function toggleAmitieInfo(status) {
  /** @type {HTMLDivElement} */// @ts-ignore
  const amitieInfo = document.getElementById('amitie-info')

  if (status) {
    if (!amitieFile.files?.length) {
      timeSelect.value = ('0' + new Date().getHours()).slice(-2)
    }
    updateGithubLink()
    amitieInfo.classList.remove('hide')
  } else {
    amitieInfo.classList.add('hide')
  }
}

amitieFile.addEventListener('change', handleAmitieFile)

function handleAmitieFile() {
  if (amitieFile.files?.length) {
    doAsync(() => prepareAmitieImage(amitieFile.files[0]))
  } else {
    amitieFileName.textContent = ''
    recognizingTextLog.textContent = ''
    amitieUploadResults.classList.add('hide')
    timeFileField.classList.add('hide')
    amitieContext.clearRect(0, 0, amitieCanvas.width, amitieCanvas.height)
  }
}

let results = { name: '', plusBlocks: [], minusBlocks: [] }

/** @param {File} file */
async function prepareAmitieImage(file) {
  const lightColorBorder = 116
  const colorIntensityLimit = 24
  const animationTime = 100
  const image = new window.Image()

  results = { name: '', plusBlocks: [], minusBlocks: [] }
  updateGithubLink()
  recognizingTextLog.textContent = ''
  amitieFileName.textContent = `Файл: ${file.name}`
  amitieUploadResults.classList.remove('hide')
  amitieUploadResults.classList.add('hide')
  amitieResults.classList.add('hide')


  sendToGithub.classList.add('hide')
  image.src = URL.createObjectURL(file)

  await new Promise((resolve) => { image.onload = resolve })

  const lDate = new Date(file.lastModified)

  timeSelect.value = ('0' + lDate.getHours()).slice(-2)
  timeFile.textContent = lDate.toLocaleString()
  timeFileField.classList.remove('hide')

  await nextAnimationFrame()
  amitieCanvas.width = image.width
  amitieCanvas.height = image.height
  amitieContext.drawImage(image, 0, 0)
  amitieUploadResults.classList.remove('hide')
  await nextTick()

  const canvas = document.createElement('canvas')
  /** @type {CanvasRenderingContext2D} */// @ts-ignore
  const context = canvas.getContext('2d')
  const leftShift = image.width / 9 ^ 0
  const rightShift = image.width - leftShift
  let dataBlocks = []
  let currentBlock = 0
  let cBlockR = 0
  let cBlockG = 0
  let cBlockB = 0
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
      if (match) {
        cBlockR = r
        cBlockG = g
        cBlockB = b
        break
      }
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
      const h = currentBlockEnd - currentBlock

      dataBlocks.push({ y: currentBlock, newY: 0, h, totalH: 0, r: cBlockR, g: cBlockG, b: cBlockB })

      await nextAnimationFrame()
      amitieContext.lineWidth = 0.5
      amitieContext.strokeStyle = '#f0fe'
      amitieContext.strokeRect(0, currentBlock, image.width, h)
      amitieContext.fillStyle = '#f0f1'
      amitieContext.fillRect(0, currentBlock, image.width, h)
      await nextTick(animationTime)

      currentBlock = 0
      currentBlockEnd = 0
      spaceHeight = 0
    }
  }

  await nextAnimationFrame()
  amitieContext.drawImage(image, 0, 0)
  await nextTick()

  let firstBaffIndex = 0
  let lastBaffIndex = 0
  let hasRedBlock = false

  for (let index = 1; index < dataBlocks.length - 1; index++) {
    const prevBlock = dataBlocks[index - 1]
    const dataBlock = dataBlocks[index]
    const nextBlock = dataBlocks[index + 1]
    const prevSpace = dataBlock.y - prevBlock.y - prevBlock.h
    const nextSpace = nextBlock.y - dataBlock.y - dataBlock.h
    const requiredH = Math.min(
      Math.max(prevBlock.h, dataBlock.h),
      Math.max(dataBlock.h, nextBlock.h)
    ) * 2


    if (requiredH < prevSpace) {
      firstBaffIndex = index
    }
    if (firstBaffIndex) {
      if (requiredH < nextSpace) {
        lastBaffIndex = index
      }
      if (!hasRedBlock) {
        hasRedBlock = dataBlock.r > (dataBlock.b + dataBlock.g) / 2 + colorIntensityLimit / 2
      }
      await nextAnimationFrame()
      amitieContext.lineWidth = 0.5
      amitieContext.strokeStyle = '#f0fe'
      amitieContext.strokeRect(0, dataBlock.y, image.width, dataBlock.h)
      amitieContext.fillStyle = '#f0f1'
      amitieContext.fillRect(0, dataBlock.y, image.width, dataBlock.h)
      await nextTick(animationTime)
    } else {
      await nextAnimationFrame()
      amitieContext.lineWidth = 0.5
      amitieContext.strokeStyle = '#fffe'
      amitieContext.strokeRect(0, dataBlock.y, image.width, dataBlock.h)
      amitieContext.fillStyle = '#fff1'
      amitieContext.fillRect(0, dataBlock.y, image.width, dataBlock.h)
      await nextTick(animationTime)
    }

    if (firstBaffIndex && lastBaffIndex) {
      if (lastBaffIndex - firstBaffIndex > 0) {
        if (hasRedBlock) {
          break
        } else {
          firstBaffIndex = lastBaffIndex = 0
          await nextAnimationFrame()
          amitieContext.drawImage(image, 0, 0)
          await nextTick()
        }
      } else {
        firstBaffIndex = lastBaffIndex = 0
        await nextAnimationFrame()
        amitieContext.drawImage(image, 0, 0)
        await nextTick()
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
        isGreenButton = g > (r + b) / 2 + colorIntensityLimit / 2
        if (isGreenButton) break
      }
      iDataIndex += 4
    }

    for (let index = firstBaffIndex - 1; index > 0; index--) {
      const dataBlock = dataBlocks[index]
      const imgData = context.getImageData(leftShift, dataBlock.y + dataBlock.h / 2, rightShift, 1).data
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

          if (colored) {
            nameBlock = dataBlock
            break
          }
        }

        if (nameBlock) {
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

    if (isGreenButton) {
      firstBaffIndex++
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
      ...(nameBlock ? [nameBlock] : []),
      ...plusBlocks,
      ...minusBlocks
    ]
  }

  if (dataBlocks.length) {
    dataBlocks[0].totalH = dataBlocks[0].h
    for (let index = 0; index < dataBlocks.length; index++) {
      const dataBlock = dataBlocks[index]

      dataBlock.y -= 6
      dataBlock.h += 12

      dataBlock.newY = index > 0 ? dataBlocks[index - 1].totalH : 0
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

  if (dataBlocks.length) {
    let currentStep = 0
    const logRecognizingText = (msg) => {
      const percent = ((currentStep + msg.progress) / dataBlocks.length * 10000 ^ 0) / 100

      if (msg.status === 'recognizing text') {
        recognizingTextLog.textContent = `${msg.status} ~ ${percent}%`
        if (msg.progress === 1) {
          currentStep++
        }
      } else {
        recognizingTextLog.textContent = msg.status
      }
    }
    const scheduler = Tesseract.createScheduler()
    const worker1 = Tesseract.createWorker({ corePath: tesseractCore, logger: logRecognizingText })
    const worker2 = Tesseract.createWorker({ corePath: tesseractCore, logger: logRecognizingText })

    await Promise.all([worker1.load(), worker2.load()])
    await Promise.all([worker1.loadLanguage('eng+rus+ukr'), worker2.loadLanguage('eng+rus+ukr')])
    await Promise.all([worker1.initialize('eng+rus+ukr'), worker2.initialize('eng+rus+ukr')])
    scheduler.addWorker(worker1)
    scheduler.addWorker(worker2)

    let resultsTmp = await Promise.all(dataBlocks.map(dataBlock => {
      const rCanvas = document.createElement('canvas')
      /** @type {CanvasRenderingContext2D} */// @ts-ignore
      const rContext = rCanvas.getContext('2d')

      rCanvas.width = canvas.width
      rCanvas.height = dataBlock.h
      rContext.drawImage(canvas,
        0, dataBlock.y, canvas.width, dataBlock.h,
        0, 0, canvas.width, dataBlock.h
      )

      return scheduler.addJob('recognize', rCanvas)
        .then((/** @type {import('tesseract.js').RecognizeResult} */result) => (result.data.text || '').trim())
    }))

    recognizingTextLog.textContent = ''
    resultsTmp = resultsTmp.reduce((prev, cur) => {
      if (cur) {
        if (prev.length > 0) {
          if ((/^[А-ЯA-Z]/).test(cur)) {
            prev.push(cur)
          } else {
            prev[prev.length - 1] += ` ${cur}`
          }
        } else {
          prev.push(cur)
        }
      }

      return prev
    }, [])

    results.name = resultsTmp.shift()
    if (resultsTmp.length % 2 === 0) {
      results.plusBlocks = resultsTmp.slice(0, resultsTmp.length / 2)
      results.minusBlocks = resultsTmp.slice(resultsTmp.length / 2, resultsTmp.length)
    }

    if (!(results.name &&
      results.plusBlocks.length > 0 &&
      results.plusBlocks.length === results.minusBlocks.length)) {
      results = { name: '', plusBlocks: [], minusBlocks: [] }
      recognizingTextLog.textContent = results.name + '\n' + resultsTmp.join('\n')
      recognizingTextLog.textContent += '\n// Не удалось распознать осколок!'
    }
    amitieName.value = results.name
    amitiePlus1.value = results.plusBlocks[0] || ''
    amitiePlus2.value = results.plusBlocks[1] || ''
    amitiePlus3.value = results.plusBlocks[2] || ''
    amitieMinus1.value = results.minusBlocks[0] || ''
    amitieMinus2.value = results.minusBlocks[1] || ''
    amitieMinus3.value = results.minusBlocks[2] || ''
    // @ts-ignore
    document.querySelector(`#quality-field div[data-quality="${results.plusBlocks.length || 1}"]`).click()
    amitieResults.classList.remove('hide')

    updateGithubLink()

    await scheduler.terminate()
  }
}

qualityField.onclick = event => {
  /** @type {HTMLDivElement} */// @ts-ignore
  const item = event.target

  if (item.classList.contains('text-toggle-item')) {
    const quality = Number(item.dataset.quality)

    amitiePlus3.classList.remove('hide')
    amitieMinus3.classList.remove('hide')
    amitiePlus2.classList.remove('hide')
    amitieMinus2.classList.remove('hide')
    if (quality < 3) {
      amitiePlus3.classList.add('hide')
      amitieMinus3.classList.add('hide')
    }
    if (quality < 2) {
      amitiePlus2.classList.add('hide')
      amitieMinus2.classList.add('hide')
    }

    updateGithubLink()
  }
}

function updateGithubLink() {
  const answer = getSelectedAnswer()
  const available = results.name && answer.a

  if (!available) {
    sendToGithubLink.href = '#'

    return false
  }

  const a = encodeURIComponent('&')
  const p = encodeURIComponent('%')
  const h = encodeURIComponent('#')
  const n = encodeURIComponent('\n')
  const title = results.plusBlocks[0].replace('%', p).replace('&', a)
  const plusBlocks = results.plusBlocks.reduce((prev, cur) => {
    return prev + `- **${cur.replace('%', p).replace('&', a)}**${n}`
  }, '')
  const minusBlocks = results.minusBlocks.reduce((prev, cur) => {
    return prev + `- _${cur.replace('%', p).replace('&', a)}_${n}`
  }, '')
  const time = new Date(new Date().setHours(Number(timeSelect.value)))
  const { timeUTC, timeMSK } = getTimeLabels(time)
  const labels = `q.${answer.qLabel}-${answer.aLabel} / ${answer.sq} - ${answer.sa},${timeUTC},${timeMSK}`
  const milestone = getAmitieMilestone(time)


  sendToGithub.classList.remove('hide')
  sendToGithubLink.href = 'https://github.com/orna-memory-hunting/storage/issues/new?' +
    `title=${title}` +
    `&labels=${labels}` +
    `&milestone=${milestone}` +
    `&body=${h} ${results.name.replace('&', a)}${n}` +
    `${h + h + h} Плюсы${n}${plusBlocks}` +
    `${h + h + h} Минусы${n}${minusBlocks}`
}
