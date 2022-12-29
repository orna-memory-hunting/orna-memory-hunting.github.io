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
 * @property {{x:number,y:number}} [spawn]
 * @property {{x:number,y:number}} [compass]
 * @property {{x:number,y:number}} [witch]
 * @property {Set<{x:number,y:number}>} [other_witches]
 */
/**
 * @param {HTMLCanvasElement} mapCanvas
 * @param {MapData} mapData
 * @param {HTMLImageElement} [mapDataImage]
 */
function drawWitchMapLabels(mapCanvas, mapData, mapDataImage) {
  const mapContext = mapCanvas.getContext('2d')
  const radius = Math.min(mapData.width, mapData.height) * 0.05
  const fontSize = Math.min(mapData.width, mapData.height) * 0.07

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
      mapContext.lineWidth = Math.max(radius * 0.2, 1)
      mapContext.strokeStyle = '#ff7043'
      mapContext.ellipse(witch.x, witch.y, radius, radius, 0, 0, 2 * Math.PI)
      mapContext.moveTo(witch.x - radius * Math.cos(45), witch.y - radius * Math.sin(45))
      mapContext.lineTo(witch.x + radius * Math.cos(45), witch.y + radius * Math.sin(45))
      mapContext.stroke()
      mapContext.closePath()
    }
  }
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
    mapContext.strokeStyle = '#30de00'
    mapContext.ellipse(mapData.witch.x, mapData.witch.y, radius, radius, 0, 0, 2 * Math.PI)
    mapContext.stroke()
    mapContext.closePath()
  }
}

export {
  renderAmitieRow,
  drawWitchMapLabels
}
