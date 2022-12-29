import { escapeHTML } from '../lib/utils.js'

/**
 * @param {import('../lib/github').Issue} amitie
 * @returns {string}
 */
function renderAmitieRow(amitie) {
  let html = '<div class="amitie-row"><a class="amitie-title amitie-blue text-button" ' +
    `target="_self" href="${amitie.url}">${escapeHTML(amitie.title)}</a>` +
    '<div class="amitie-actions"><div class="amitie-labels">'

  for (const label of amitie.labels) {
    html += '<div class="amitie-label"' +
      ` style="color:#${label.color};border-color:#${label.color};"` +
      ` title="${escapeHTML(label.description)}">${escapeHTML(label.name)}</div>`
  }

  html += '</div><div class="amitie-buttons">' +
    `<span class="text-button copy-button" title="${window.location.origin}${amitie.url}">🔗</span>` +
    `<span class="text-button copy-button" title="${amitie.miniСard}">📋</span>` +
    '</div></div></div>'

  return html
}

/**
 * @typedef MapData
 * @property {number} width
 * @property {number} height
 * @property {number} radius
 * @property {number} fontSize
 * @property {{x:number,y:number}} [spawn]
 * @property {{x:number,y:number}} [compass]
 * @property {{x:number,y:number}} [witch]
 * @property {Set<{x:number,y:number}>} [other_witches]
 */
/**
 * @param {HTMLCanvasElement} mapCanvas
 * @param {MapData|NormalizedMapData} mapData
 * @param {HTMLImageElement} [mapDataImage]
 */
function drawWitchMapLabels(mapCanvas, mapData, mapDataImage) {
  const mapContext = mapCanvas.getContext('2d')

  mapCanvas.width = mapData.width
  mapCanvas.height = mapData.height
  if (mapDataImage) {
    mapContext.drawImage(mapDataImage, 0, 0)
  } else {
    mapContext.fillStyle = '#f5f1e8'
    mapContext.clearRect(0, 0, mapData.width, mapData.height)
  }

  if (mapData.other_witches) {
    for (const witch of mapData.other_witches) {
      mapContext.beginPath()
      mapContext.lineWidth = Math.max(mapData.radius * 0.2, 1)
      mapContext.strokeStyle = '#ff7043'
      mapContext.ellipse(witch.x, witch.y, mapData.radius, mapData.radius, 0, 0, 2 * Math.PI)
      mapContext.moveTo(witch.x - mapData.radius * Math.cos(45), witch.y - mapData.radius * Math.sin(45))
      mapContext.lineTo(witch.x + mapData.radius * Math.cos(45), witch.y + mapData.radius * Math.sin(45))
      mapContext.stroke()
      mapContext.closePath()
    }
  }
  if (mapData.spawn) {
    mapContext.beginPath()
    mapContext.lineWidth = 1
    mapContext.font = `${mapData.fontSize}px 'Roboto', sans-serif`
    mapContext.fillStyle = '#30de00'
    mapContext.strokeStyle = '#333'
    mapContext.fillText('spawn', mapData.spawn.x + mapData.radius / 3, mapData.spawn.y - mapData.radius / 3)
    mapContext.strokeText('spawn', mapData.spawn.x + mapData.radius / 3, mapData.spawn.y - mapData.radius / 3)
    mapContext.ellipse(mapData.spawn.x, mapData.spawn.y, mapData.radius / 4, mapData.radius / 4, 0, 0, 2 * Math.PI)
    mapContext.fill()
    mapContext.stroke()
    mapContext.closePath()
  }
  if (mapData.compass) {
    mapContext.beginPath()
    mapContext.lineWidth = 1
    mapContext.font = `${mapData.fontSize}px 'Roboto', sans-serif`
    mapContext.fillStyle = '#4fc3f7'
    mapContext.strokeStyle = '#333'
    mapContext.fillText('N', mapData.compass.x - mapData.fontSize / 3 ^ 0, mapData.compass.y + mapData.fontSize / 3 ^ 0)
    mapContext.strokeText('N', mapData.compass.x - mapData.fontSize / 3 ^ 0, mapData.compass.y + mapData.fontSize / 3 ^ 0)
    mapContext.fill()
    mapContext.stroke()
    mapContext.closePath()
  }
  if (mapData.witch) {
    mapContext.beginPath()
    mapContext.lineWidth = Math.max(mapData.radius * 0.2, 1)
    mapContext.strokeStyle = '#30de00'
    mapContext.ellipse(mapData.witch.x, mapData.witch.y, mapData.radius, mapData.radius, 0, 0, 2 * Math.PI)
    mapContext.stroke()
    mapContext.closePath()
  }
}

/**
 * @typedef NormalizedMapData
 * @property {number} width
 * @property {number} height
 * @property {number} radius
 * @property {number} fontSize
 * @property {{x:number,y:number}} [spawn]
 * @property {{x:number,y:number}} [compass]
 * @property {{x:number,y:number}} [witch]
 * @property {Array<{x:number,y:number}>} [other_witches]
 */
/**
 * @param {MapData} mapData
 * @returns {NormalizedMapData}
 */
function normalizeMapData(mapData) {
  /** @type {NormalizedMapData} */
  const nMapData = { width: 0, height: 0, radius: mapData.radius, fontSize: mapData.fontSize }
  let [nX, nY] = [mapData.width, mapData.height]

  for (const [key, value] of Object.entries(mapData)) {
    if (typeof value === 'object') {
      if (value instanceof Set) {
        nMapData[key] = []
        for (const point of value) {
          nX = Math.min(nX, point.x - nMapData.radius * 2)
          nY = Math.min(nY, point.y - nMapData.radius * 2)
          nMapData.width = Math.max(nMapData.width, point.x + nMapData.radius * 2)
          nMapData.height = Math.max(nMapData.height, point.y + nMapData.radius * 2)
          nMapData[key].push({ ...point })
        }
      } else {
        nX = Math.min(nX, value.x - nMapData.radius * 2)
        nY = Math.min(nY, value.y - nMapData.radius * 2)
        nMapData.width = Math.max(nMapData.width, value.x + nMapData.radius * 2)
        nMapData.height = Math.max(nMapData.height, value.y + nMapData.radius * 2)
        nMapData[key] = { ...value }
      }
    }
  }

  nMapData.width -= nX
  nMapData.height -= nY
  for (const value of Object.values(nMapData)) {
    if (typeof value === 'object') {
      if (value instanceof Array) {
        for (const point of value) {
          point.x -= nX
          point.y -= nY
        }
      } else {
        value.x -= nX
        value.y -= nY
      }
    }
  }

  return nMapData
}

export {
  renderAmitieRow,
  drawWitchMapLabels,
  normalizeMapData
}
