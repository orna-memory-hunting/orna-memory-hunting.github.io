import { showError, safeExecute, doAsync, nextTick, nextAnimationFrame } from '../lib/utils.js'
import { renderQuestionList, getSelectedAnswer } from '../lib/questions.js'
import { getIssuesList, getMilestoneNumber, getMilestoneTitle, getTimeLabels } from '../lib/github.js'
import { renderAmitieRow } from '../lib/amitie.js'

safeExecute(async () => {
  const { default: Tesseract } = await import('https://cdn.jsdelivr.net/npm/tesseract.js@4.0.0/dist/tesseract.esm.min.js')
  const tesseractCore = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@4.0.0/tesseract-core-simd.wasm.js'
  const tesseractWorker = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.0.0/dist/worker.min.js'
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
    updateParams()
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
    updateParams()
  }


  /** @type {HTMLDivElement} */// @ts-ignore
  const amitiUploadField = document.getElementById('amitie-upload-field')
  /** @type {HTMLDivElement} */// @ts-ignore
  const amitieUploadResults = document.getElementById('amitie-upload-results')
  /** @type {HTMLDivElement} */// @ts-ignore
  const amitieCanvasError = document.getElementById('amitie-canvas-error')
  /** @type {HTMLDivElement} */// @ts-ignore
  const recognizingText = document.getElementById('recognizing-text')
  /** @type {HTMLDivElement} */// @ts-ignore
  const mapUploadField = document.getElementById('map-upload-field')
  /** @type {HTMLDivElement} */// @ts-ignore
  const mapUploadResults = document.getElementById('map-upload-results')
  /** @type {HTMLCanvasElement} */// @ts-ignore
  const mapCanvas = document.getElementById('map-canvas')
  /** @type {CanvasRenderingContext2D} */// @ts-ignore
  const mapContext = mapCanvas.getContext('2d')
  const mapData = {}

  amitiUploadField.addEventListener('selected-file', (/** @type {CustomEvent} */ event) => {
    if (event.detail.file) {
      doAsync(() => prepareAmitieImage(event.detail.file, true))
    } else {
      amitieUploadResults.classList.add('hide')
      amitieCanvasError.classList.add('hide')
      recognizingText.classList.add('hide')
      timeFileField.classList.add('hide')
      amitieContext.clearRect(0, 0, amitieCanvas.width, amitieCanvas.height)
    }
  })

  mapUploadField.addEventListener('selected-file', (/** @type {CustomEvent} */ event) => {
    if (event.detail.file) {
      safeExecute(async () => {
        const image = new window.Image()

        image.src = URL.createObjectURL(event.detail.file)
        await new Promise((resolve) => { image.onload = resolve })
        mapCanvas.width = image.width
        mapCanvas.height = image.height
        mapData.image = image
        mapData.spawn = { x: image.width / 2 ^ 0, y: image.height / 2 ^ 0 }
        drawMapLabels()
        mapUploadResults.classList.remove('hide')
      })
    } else {
      mapData.image = null
      mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height)
      mapUploadResults.classList.add('hide')
    }
  })

  mapCanvas.onclick = event => {
    /** @type {HTMLDivElement} */// @ts-ignore
    const elm = document.querySelector('.map-label-tab.active')
    /** @type {HTMLDivElement} */// @ts-ignore
    const nextElm = document.querySelector('.map-label-tab.active+.map-label-tab')
    const { label } = elm.dataset
    const point = {
      x: (event.pageX - mapCanvas.offsetLeft) * (mapCanvas.width / mapCanvas.clientWidth),
      y: (event.pageY - mapCanvas.offsetTop) * (mapCanvas.height / mapCanvas.clientHeight)
    }

    switch (label) {
      case 'spawn':
      case 'compass':
      case 'witch':
        mapData[label] = point
        break
    }

    if (nextElm && !(nextElm.dataset.label in mapData)) {
      nextElm.click()
    }

    drawMapLabels()
  }

  function drawMapLabels() {
    const radius = Math.min(mapCanvas.width, mapCanvas.height) * 0.05
    const fontSize = Math.min(mapCanvas.width, mapCanvas.height) * 0.07

    mapContext.drawImage(mapData.image, 0, 0)

    if (mapData.spawn) {
      mapContext.beginPath()
      mapContext.lineWidth = 1
      mapContext.font = `${fontSize}px 'Roboto', sans-serif`
      mapContext.fillStyle = '#30de00'
      mapContext.strokeStyle = '#333'
      mapContext.fillText('spawn', mapData.spawn.x + radius / 3, mapData.spawn.y - radius / 3)
      mapContext.strokeText('spawn', mapData.spawn.x + radius / 3, mapData.spawn.y - radius / 3)
      mapContext.ellipse(mapData.spawn.x, mapData.spawn.y, radius / 4, radius / 4, 0, 0, 2 * Math.PI)
      mapContext.fill()
      mapContext.stroke()
      mapContext.closePath()
    }
    if (mapData.compass) {
      mapContext.beginPath()
      mapContext.lineWidth = 1
      mapContext.font = `${fontSize}px 'Roboto', sans-serif`
      mapContext.fillStyle = '#4fc3f7'
      mapContext.strokeStyle = '#333'
      mapContext.fillText('N', mapData.compass.x - fontSize / 3 ^ 0, mapData.compass.y + fontSize / 3 ^ 0)
      mapContext.strokeText('N', mapData.compass.x - fontSize / 3 ^ 0, mapData.compass.y + fontSize / 3 ^ 0)
      mapContext.fill()
      mapContext.stroke()
      mapContext.closePath()
    }
    if (mapData.witch) {
      mapContext.beginPath()
      mapContext.lineWidth = Math.max(radius * 0.2, 1)
      mapContext.strokeStyle = '#f0fe'
      mapContext.ellipse(mapData.witch.x, mapData.witch.y, radius, radius, 0, 0, 2 * Math.PI)
      mapContext.stroke()
      mapContext.closePath()
    }
  }

  timeSelect.onchange = () => { updateParams(); updateGithubLink() }

  /** @param {boolean} status  */
  function toggleAmitieInfo(status) {
    /** @type {HTMLDivElement} */// @ts-ignore
    const amitieInfo = document.getElementById('amitie-info')

    if (status) {
      if (!timeSelect.getAttribute('first-load-ready')) {
        timeSelect.value = ('0' + new Date().getHours()).slice(-2)
        timeSelect.setAttribute('first-load-ready', 'true')
      }
      amitieInfo.classList.remove('hide')
      updateGithubLink()
    } else {
      amitieInfo.classList.add('hide')
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

  /**
   * @param {File} file
   * @param {boolean} timeByFile
   */
  async function prepareAmitieImage(file, timeByFile = false) {
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
    document.querySelector('#clone-field div[data-clone="0"]').click()

    updateGithubLink()

    amitieUploadResults.classList.add('hide')
    amitieCanvasError.classList.add('hide')
    recognizingText.classList.add('hide')
    amitieResults.classList.add('hide')
    recognizingTextError.classList.add('hide')
    recognizingTextLog.classList.add('hide')

    image.src = URL.createObjectURL(file)

    await new Promise((resolve) => { image.onload = resolve })

    if (timeByFile) {
      const lDate = new Date(file.lastModified)

      timeSelect.value = ('0' + lDate.getHours()).slice(-2)
      timeFile.textContent = lDate.toLocaleString()
      timeFileField.classList.remove('hide')
    } else {
      timeFile.textContent = ''
      timeFileField.classList.add('hide')
    }

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
      ) * 1.9


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
        hasRedBlock = false
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
          hasRedBlock = false
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

      let firstLineBlueOrRed = null
      let existBlueLine = false

      for (let index = firstBaffIndex; index < lastBaffIndex + 1; index++) {
        const dataBlock = dataBlocks[index]
        const imgData = originAmitieContext.getImageData(leftShift, dataBlock.y + dataBlock.h / 2, rightShift, 1).data
        let iDataIndex = 0
        let isBlue = false
        let isRed = false

        while (iDataIndex < imgData.length) {
          // imgData -> RGBA * len
          const r = imgData[iDataIndex]
          const g = imgData[iDataIndex + 1]
          const b = imgData[iDataIndex + 2]
          const match = r > lightColorBorder || g > lightColorBorder || b > lightColorBorder

          if (match) {
            isRed = r > (b + g) / 2 + colorIntensityLimit
            isBlue = b > (r + g) / 2 + colorIntensityLimit
            if (firstLineBlueOrRed === null) {
              firstLineBlueOrRed = isRed || isBlue
            }
            if (!existBlueLine && isBlue) {
              existBlueLine = true
            }
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
      if (existBlueLine && firstLineBlueOrRed === false) {
        plusBlocks.shift()
      }

      dataBlocks = [
        ...(nameBlock ? [nameBlock] : []),
        ...plusBlocks,
        ...minusBlocks
      ]
    }

    if (dataBlocks.length) {
      for (let index = 0; index < dataBlocks.length; index++) {
        const dataBlock = dataBlocks[index]
        const space = Math.max(6, dataBlock.h / 2 ^ 0)

        dataBlock.y -= space
        dataBlock.h += space * 2

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
  const recognizingLang = document.getElementById('recognizing-lang')
  /** @type {HTMLDivElement} */// @ts-ignore
  const recognizingTextButton = document.getElementById('recognizing-text-button')

  recognizingTextButton.onclick = () => doAsync(startRecognizingText)

  async function startRecognizingText() {
    recognizingTextLog.textContent = 'Загрузка Tesseract.js...'
    recognizingLang.classList.add('hide')
    recognizingTextButton.classList.add('hide')
    amitieResults.classList.add('hide')
    recognizingTextError.classList.add('hide')
    recognizingTextLog.classList.remove('hide')
    amitiUploadField.classList.add('disable')

    if (dataBlocks.length) {
      const params = new URLSearchParams(window.location.hash.replace('#', ''))
      const defaults = params.has('tesseractdefaults')
      let currentStep = 0
      const logger = msg => {
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
      const errorHandler = err => showError(err)
      const workerOption = defaults
        ? { logger, errorHandler }
        : { corePath: tesseractCore, workerPath: tesseractWorker, logger, errorHandler }
      const worker = await Tesseract.createWorker(workerOption)
      const langs = Array.from(document.querySelectorAll('.recognizing-lang .active'))
        .reduce((langs, /** @type {HTMLDivElement} */lang) => {
          langs.push(lang.dataset.lang)

          return langs
        }, []).join('+') || 'eng+rus+ukr'

      await worker.loadLanguage(langs)
      await worker.initialize(langs)

      let resultsTmp = []

      for (const dataBlock of dataBlocks) {
        const rCanvas = document.createElement('canvas')
        /** @type {CanvasRenderingContext2D} */// @ts-ignore
        const rContext = rCanvas.getContext('2d')

        rCanvas.width = originAmitieCanvas.width
        rCanvas.height = dataBlock.h
        rContext.drawImage(originAmitieCanvas,
          0, dataBlock.y, originAmitieCanvas.width, dataBlock.h,
          0, 0, originAmitieCanvas.width, dataBlock.h
        )
        resultsTmp.push(await worker.recognize(rCanvas)
          .then((/** @type {import('tesseract.js').RecognizeResult} */result) => (result.data.text || '').trim()))
      }

      await worker.terminate()

      resultsTmp = resultsTmp.reduce((prev, cur) => {
        if (cur) {
          if (prev.length > 0) {
            if ((/^[А-ЯA-Z]+$/).test(cur)) {
              cur = cur.toLowerCase()
            }
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

      amitiUploadField.classList.remove('disable')
    }

    recognizingTextButton.classList.remove('hide')
    recognizingLang.classList.remove('hide')
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
  const cloneField = document.getElementById('clone-field')

  cloneField.onclick = event => {
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
    safeExecute(() => {
      const answer = getSelectedAnswer()

      if (!answer) return

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
      const { timeUTC, timeMSK } = getTimeLabels(time.getUTCHours())
      const addLabels = Array.from(document.querySelectorAll('#additional-labels .active'))
        .reduce((labels, /** @type {HTMLDivElement} */label) => `${labels},${label.dataset.label}`, '')
      /** @type {HTMLDivElement} */// @ts-ignore
      const cloneElm = document.querySelector('#clone-field .active')
      const clone = cloneElm ? Number(cloneElm.dataset.clone) : 0
      const cloneLabel = clone ? `,clone #${clone}` : ''
      const labels = `${answer.label},${timeUTC},${timeMSK}${qualityLabel}${addLabels}${cloneLabel}`
      const milestone = getMilestoneTitle(time)
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

      doAsync(checkCloneAmitieList)
    })
  }

  /** @type {HTMLDivElement} */// @ts-ignore
  const cloneAmitieList = document.getElementById('clone-amitie-list')
  /** @type {HTMLDivElement} */// @ts-ignore
  const cloneAmitieResult = document.getElementById('clone-amitie-result')
  let lastCloneProps = ''

  async function checkCloneAmitieList() {
    const answer = getSelectedAnswer()
    const time = new Date(new Date().setHours(Number(timeSelect.value)))
    const { timeUTC } = getTimeLabels(time.getUTCHours())
    const milestone = await getMilestoneNumber(time).catch(err => {
      return err.message === 'milestone not found' ? false : err
    })
    const cloneProps = `${milestone}/${timeUTC}/${answer.label}`

    if (milestone === false) {
      cloneAmitieList.classList.add('hide')
      cloneAmitieResult.classList.remove('hide')
      cloneAmitieResult.innerHTML = 'На этой неделе разведку не проводим'

      return
    }
    if (lastCloneProps === cloneProps) {
      return
    }
    lastCloneProps = cloneProps
    cloneAmitieResult.innerHTML = 'Загрузка...'
    cloneAmitieList.classList.add('hide')

    const issues = await getIssuesList({ milestone, labels: [answer.label, timeUTC] })
    let html = ''
    let maxClone = 0

    if (issues.length > 0) {
      for (const issue of issues) {
        html += renderAmitieRow(issue)

        if (issue.labels.length) {
          for (const label of issue.labels) {
            if (label.name.startsWith('clone #')) {
              const clone = parseInt(label.name.replace('clone #', ''))

              if (!isNaN(clone)) maxClone = Math.max(maxClone, clone)
              if (maxClone > 5) maxClone = 5
            }
          }
        }
      }
      cloneAmitieList.innerHTML = html
      cloneAmitieResult.classList.add('hide')
      cloneAmitieList.classList.remove('hide')
    } else {
      cloneAmitieList.classList.add('hide')
      cloneAmitieResult.classList.remove('hide')
      cloneAmitieResult.innerHTML = 'Нет'
    }

    if (!maxClone) {
      // @ts-ignore
      document.querySelector('#clone-field div[data-clone="0"]').click()
    } else if (maxClone < 5) {
      // @ts-ignore
      document.querySelector(`#clone-field div[data-clone="${maxClone + 1}"]`).click()
    } else {
      // @ts-ignore
      document.querySelector('#clone-field div[data-clone="1"]').click()
    }

    cloneAmitieList.innerHTML = html
  }

  const params = new URLSearchParams(window.location.hash.replace('#', ''))
  const pQ = parseInt(params.get('q'))
  const pA = parseInt(params.get('a'))
  const pT = parseInt(params.get('t'))
  let canUpdateParams = false

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
  if (!isNaN(pT)) {
    timeSelect.value = ('0' + new Date(new Date().setUTCHours(pT)).getHours()).slice(-2)
    timeSelect.setAttribute('first-load-ready', 'true')
  }
  canUpdateParams = true

  function updateParams() {
    if (canUpdateParams) {
      /** @type {HTMLDivElement} */// @ts-ignore
      const question = document.querySelector('.question-content.active')
      const q = question ? parseInt(question.dataset.qid) : NaN
      /** @type {HTMLDivElement} */// @ts-ignore
      const answer = document.querySelector('.question-content.active .answer.active')
      const a = answer ? parseInt(answer.dataset.aid) : NaN
      const t = parseInt(timeSelect.value)

      if (isNaN(q)) {
        params.delete('q')
      } else {
        params.set('q', q + '')
      }
      if (isNaN(a)) {
        params.delete('a')
      } else {
        params.set('a', a + '')
      }
      if (isNaN(t)) {
        params.delete('t')
      } else {
        params.set('t', new Date(new Date().setHours(t)).getUTCHours() + '')
      }

      window.history.replaceState(null, '', `${window.location.pathname}#${params.toString()}`)
    }
  }
})
