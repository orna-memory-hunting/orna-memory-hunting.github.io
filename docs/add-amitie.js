import { doAsync, nextTick, nextAnimationFrame } from './lib/utils.js'
import { renderQuestionList, getSelectedAnswer } from './lib/questions.js'
import { ghAPI, loadMilestoneId, parseIssue, getAmitieMilestone, getTimeLabels } from './lib/github.js'

/** @type {{Tesseract:import('tesseract.js')}} */
const { Tesseract } = window
const tesseractCore = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@3.0.2/tesseract-core.wasm.js'
const tesseractWorker = 'https://cdn.jsdelivr.net/npm/tesseract.js@3.0.3/dist/worker.min.js'
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

  document.querySelectorAll('.question-content').forEach((/** @type {HTMLDivElement} */ element) => {
    element.classList.remove('active')
    element.classList.remove('hide')
  })
  if (!isClose) {
    qContent.classList.add('active')
    document.querySelectorAll('.question-content').forEach((/** @type {HTMLDivElement} */ element) => {
      if (element !== qContent) element.classList.add('hide')
    })
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
/** @type {HTMLDivElement} */// @ts-ignore
const amitieCanvasError = document.getElementById('amitie-canvas-error')
/** @type {HTMLDivElement} */// @ts-ignore
const recognizingText = document.getElementById('recognizing-text')
/** @type {HTMLSpanElement} */// @ts-ignore
const amitieFileFromClipboard = document.getElementById('amitie-file-from-clipboard')

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
    amitieUploadResults.classList.add('hide')
    amitieCanvasError.classList.add('hide')
    recognizingText.classList.add('hide')
    timeFileField.classList.add('hide')
    amitieContext.clearRect(0, 0, amitieCanvas.width, amitieCanvas.height)
  }
}

/** @type {HTMLDivElement} */// @ts-ignore
const recognizingTextError = document.getElementById('recognizing-text-error')
/** @type {HTMLDivElement} */// @ts-ignore
const recognizingTextLog = document.getElementById('recognizing-text-log')
/** @type {HTMLInputElement} */// @ts-ignore
const amitieName = document.getElementById('amitie-name')
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
let dataBlocks = []
let originAmitieCanvas = document.createElement('canvas')

/** @param {File} file */
async function prepareAmitieImage(file) {
  const lightColorBorder = 116
  const colorIntensityLimit = 24
  const animationTime = 100
  const image = new window.Image()

  dataBlocks = []
  originAmitieCanvas = document.createElement('canvas')
  amitieName.value = ''
  amitiePlus1.value = ''
  amitiePlus2.value = ''
  amitiePlus3.value = ''
  amitieMinus1.value = ''
  amitieMinus2.value = ''
  amitieMinus3.value = ''
  document.querySelectorAll('#additional-labels .active').forEach(item => {
    item.classList.remove('active')
  })
  // @ts-ignore
  document.querySelector('#double-field div[data-double="0"]').click()

  updateGithubLink()

  amitieFileName.textContent = `Файл: ${file.name}`
  amitieUploadResults.classList.add('hide')
  amitieCanvasError.classList.add('hide')
  recognizingText.classList.add('hide')
  amitieResults.classList.add('hide')
  recognizingTextError.classList.add('hide')
  recognizingTextLog.classList.add('hide')

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

  /** @type {CanvasRenderingContext2D} */// @ts-ignore
  const originAmitieContext = originAmitieCanvas.getContext('2d')
  const leftShift = image.width / 9 ^ 0
  const rightShift = image.width - leftShift
  let currentBlock = 0
  let cBlockR = 0
  let cBlockG = 0
  let cBlockB = 0
  let currentBlockEnd = 0
  let spaceHeight = 0
  let nameBlock = null
  const plusBlocks = []
  const minusBlocks = []

  originAmitieCanvas.width = image.width
  originAmitieCanvas.height = image.height
  originAmitieContext.drawImage(image, 0, 0)

  for (let index = 0; index < image.height; index++) {
    const imgData = originAmitieContext.getImageData(leftShift, index, rightShift, 1).data
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
    const imgData = originAmitieContext.getImageData(leftShift, lastBlock.y + lastBlock.h / 2, rightShift, 1).data
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
      const imgData = originAmitieContext.getImageData(leftShift, dataBlock.y + dataBlock.h / 2, rightShift, 1).data
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
      const imgData = originAmitieContext.getImageData(leftShift, dataBlock.y + dataBlock.h / 2, rightShift, 1).data
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
    amitieCanvas.width = originAmitieCanvas.width
    amitieCanvas.height = dataBlocks[dataBlocks.length - 1].totalH
    for (const dataBlock of dataBlocks) {
      amitieContext.drawImage(originAmitieCanvas,
        0, dataBlock.y, originAmitieCanvas.width, dataBlock.h,
        0, dataBlock.newY, originAmitieCanvas.width, dataBlock.h
      )
    }
    await nextTick(animationTime)
  }

  if (nameBlock && plusBlocks.length && minusBlocks.length) {
    recognizingText.classList.remove('hide')
  } else {
    amitieCanvasError.classList.remove('hide')
  }

  amitieResults.classList.remove('hide')
}

/** @type {HTMLDivElement} */// @ts-ignore
const recognizingTextButton = document.getElementById('recognizing-text-button')

recognizingTextButton.onclick = () => doAsync(startRecognizingText)

async function startRecognizingText() {
  recognizingTextLog.textContent = 'Загрузка Tesseract.js...'
  recognizingTextButton.classList.add('hide')
  amitieResults.classList.add('hide')
  recognizingTextError.classList.add('hide')
  recognizingTextLog.classList.remove('hide')

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
    const workerOption = { corePath: tesseractCore, workerPath: tesseractWorker, logger: logRecognizingText }
    const worker1 = Tesseract.createWorker(workerOption)
    const worker2 = Tesseract.createWorker(workerOption)
    const langs = Array.from(document.querySelectorAll('.recognizing-lang .active'))
      .reduce((langs, /** @type {HTMLDivElement} */lang) => {
        langs.push(lang.dataset.lang)

        return langs
      }, []).join('+') || 'eng+rus+ukr'

    await Promise.all([worker1.load(), worker2.load()])
    await Promise.all([worker1.loadLanguage(langs), worker2.loadLanguage(langs)])
    await Promise.all([worker1.initialize(langs), worker2.initialize(langs)])
    scheduler.addWorker(worker1)
    scheduler.addWorker(worker2)

    let resultsTmp = await Promise.all(dataBlocks.map(dataBlock => {
      const rCanvas = document.createElement('canvas')
      /** @type {CanvasRenderingContext2D} */// @ts-ignore
      const rContext = rCanvas.getContext('2d')

      rCanvas.width = originAmitieCanvas.width
      rCanvas.height = dataBlock.h
      rContext.drawImage(originAmitieCanvas,
        0, dataBlock.y, originAmitieCanvas.width, dataBlock.h,
        0, 0, originAmitieCanvas.width, dataBlock.h
      )

      return scheduler.addJob('recognize', rCanvas)
        .then((/** @type {import('tesseract.js').RecognizeResult} */result) => (result.data.text || '').trim())
    }))

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

    const results = { name: '', plusBlocks: [], minusBlocks: [], success: false }

    results.name = resultsTmp.shift()
    if (resultsTmp.length % 2 === 0) {
      results.plusBlocks = resultsTmp.slice(0, resultsTmp.length / 2)
      results.minusBlocks = resultsTmp.slice(resultsTmp.length / 2, resultsTmp.length)
    }

    results.success = results.name &&
      results.plusBlocks.length > 0 &&
      results.plusBlocks.length === results.minusBlocks.length

    if (results.success) {
      recognizingTextLog.textContent = ''
      recognizingTextLog.classList.add('hide')
    } else {
      resultsTmp.unshift(results.name)
      recognizingTextLog.textContent = resultsTmp.join('\n').trim()
      recognizingTextError.classList.remove('hide')
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

    updateGithubLink()

    await scheduler.terminate()
  }

  recognizingTextButton.classList.remove('hide')
  amitieResults.classList.remove('hide')
}

/** @type {HTMLDivElement} */// @ts-ignore
const qualityField = document.getElementById('quality-field')

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

/** @type {HTMLDivElement} */// @ts-ignore
const additionalLabels = document.getElementById('additional-labels')

additionalLabels.onclick = event => {
  /** @type {HTMLDivElement} */// @ts-ignore
  const item = event.target

  if (item.classList.contains('text-multi-toggle-item')) {
    updateGithubLink()
  }
}


/** @type {HTMLDivElement} */// @ts-ignore
const doubleField = document.getElementById('double-field')

doubleField.onclick = event => {
  /** @type {HTMLDivElement} */// @ts-ignore
  const item = event.target

  if (item.classList.contains('text-toggle-item')) {
    updateGithubLink()
  }
}

amitieName.onchange = updateGithubLink
amitiePlus1.onchange = updateGithubLink
amitiePlus2.onchange = updateGithubLink
amitiePlus3.onchange = updateGithubLink
amitieMinus1.onchange = updateGithubLink
amitieMinus2.onchange = updateGithubLink
amitieMinus3.onchange = updateGithubLink

/** @type {HTMLLinkElement} */// @ts-ignore
const sendToGithubLink = document.getElementById('send-to-github-link')

function updateGithubLink() {
  const answer = getSelectedAnswer()
  const answerLabel = `q.${answer.qLabel}-${answer.aLabel} / ${answer.sq} - ${answer.sa}`
  /** @type {HTMLDivElement} */// @ts-ignore
  const qualityElm = document.querySelector('#quality-field .active')
  const quality = Number(qualityElm.dataset.quality)
  const qualityLabel = { 2: ',x2 epic', 3: ',x3 ornate' }[quality] || ''
  const plusBlocks = [amitiePlus1.value, amitiePlus2.value, amitiePlus3.value]
    .slice(0, quality).reduce((prev, cur) => {
      return `${prev}- **${cur || '?'}**\n`
    }, '')
  const minusBlocks = [amitieMinus1.value, amitieMinus2.value, amitieMinus3.value]
    .slice(0, quality).reduce((prev, cur) => {
      return `${prev}- _${cur || '?'}_\n`
    }, '')
  const time = new Date(new Date().setHours(Number(timeSelect.value)))
  const { timeUTC, timeMSK } = getTimeLabels(time)
  const addLabels = Array.from(document.querySelectorAll('#additional-labels .active'))
    .reduce((labels, /** @type {HTMLDivElement} */label) => `${labels},${label.dataset.label}`, '')
  /** @type {HTMLDivElement} */// @ts-ignore
  const doubleElm = document.querySelector('#double-field .active')
  const double = doubleElm ? Number(doubleElm.dataset.double) : 0
  const doubleLabel = double ? `,double #${double}` : ''
  const labels = `${answerLabel},${timeUTC},${timeMSK}${qualityLabel}${addLabels}${doubleLabel}`
  const milestone = getAmitieMilestone(time)
  const hiddenInfo = `\n\n<!-- &labels=${labels} -->` +
    `\n<!-- &milestone=${milestone} -->`

  sendToGithubLink.href = 'https://github.com/orna-memory-hunting/storage/issues/new?' +
    `title=${encodeURIComponent(amitiePlus1.value)}` +
    `&labels=${encodeURIComponent(labels)}` +
    `&milestone=${milestone}` +
    `&body=${encodeURIComponent(`# ${amitieName.value}\n`)}` +
    encodeURIComponent(`### Плюсы\n${plusBlocks}`) +
    encodeURIComponent(`### Минусы\n${minusBlocks}`) +
    encodeURIComponent(hiddenInfo)

  doAsync(checkDoubleAmitieList)
}

/** @type {HTMLDivElement} */// @ts-ignore
const doubleAmitieList = document.getElementById('double-amitie-list')
/** @type {HTMLDivElement} */// @ts-ignore
const doubleAmitieResult = document.getElementById('double-amitie-result')
let apiURLlastDouble = ''

async function checkDoubleAmitieList() {
  const answer = getSelectedAnswer()
  const answerLabel = `q.${answer.qLabel}-${answer.aLabel} / ${answer.sq} - ${answer.sa}`
  const time = new Date(new Date().setHours(Number(timeSelect.value)))
  const { timeUTC, timeMSK } = getTimeLabels(time)
  const labels = `&labels=${answerLabel},${timeUTC},${timeMSK}`
  const milestoneId = await loadMilestoneId(time)
  const milestone = `&milestone=${milestoneId}`
  const apiURL = `${ghAPI}/issues?state=open${labels}${milestone}`

  if (apiURLlastDouble === apiURL) {
    return
  }
  apiURLlastDouble = apiURL
  doubleAmitieResult.innerHTML = 'Загрузка...'

  /** @type {Array} */
  const issues = milestoneId ? await (await fetch(apiURL)).json() : []
  let html = ''
  let maxDouble = 0

  if (issues.length > 0) {
    for (const issueRaw of issues) {
      const issue = parseIssue(issueRaw)

      html += `<div class="double-amitie"><a class="amitie-button blue text-button" target="_blank" href="${issue.url}">${issue.title}</a>`
      if (issue.labels.length) {
        html += '<div class="amitie-labels">'
        for (const label of issue.labels) {
          html += '<div class="amitie-label"' +
            ` style="color:#${label.color};border-color:#${label.color};#` +
            ` title="${label.description}">${label.name}</div>`
          if (label.name.startsWith('double #')) {
            const double = parseInt(label.name.replace('double #', ''))

            if (!isNaN(double)) maxDouble = Math.max(maxDouble, double)
            if (maxDouble > 5) maxDouble = 5
          }
        }
        html += '</div>'
      }
      html += '</div>'
    }
    doubleAmitieList.innerHTML = html
    doubleAmitieResult.classList.add('hide')
    doubleAmitieList.classList.remove('hide')
  } else {
    doubleAmitieList.classList.add('hide')
    doubleAmitieResult.classList.remove('hide')
    doubleAmitieResult.innerHTML = 'Нет'
  }

  if (!maxDouble) {
    // @ts-ignore
    document.querySelector('#double-field div[data-double="0"]').click()
  } else if (maxDouble < 5) {
    // @ts-ignore
    document.querySelector(`#double-field div[data-double="${maxDouble + 1}"]`).click()
  } else {
    // @ts-ignore
    document.querySelector('#double-field div[data-double="1"]').click()
  }

  doubleAmitieList.innerHTML = html
}

const params = new URLSearchParams(window.location.hash.replace('#', ''))
const pQ = parseInt(params.get('q'))
const pA = parseInt(params.get('a'))

if (!isNaN(pQ)) {
  /** @type {HTMLDivElement} */// @ts-ignore
  const question = document.querySelector(`.question-content[data-qid="${pQ}"]`)

  if (question) {
    /** @type {HTMLDivElement} */// @ts-ignore
    const questionElm = question.querySelector('.question')

    questionElm.click()
    if (!isNaN(pA)) {
      /** @type {HTMLDivElement} */// @ts-ignore
      const answer = question.querySelector(`.answer[data-aid="${pA}"]`)

      if (answer) answer.click()
    }
  }
}
