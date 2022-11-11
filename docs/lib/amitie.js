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

export {
  renderAmitieRow
}
