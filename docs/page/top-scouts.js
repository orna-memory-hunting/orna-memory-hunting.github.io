import { safeExecute } from '../lib/utils.js'
import { getMilestone, getMilestoneTitle, getTopScouts } from '../lib/github.js'

/** @type {HTMLDivElement} */// @ts-ignore
const title = document.getElementById('top-scouts-title')
/** @type {HTMLDivElement} */// @ts-ignore
const topScoutsTable = document.getElementById('top-scouts-table')
let milestone = null


safeExecute(async () => {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))

  milestone = parseInt(params.get('milestone'))
  milestone = isNaN(milestone) ? null : milestone

  await loadTopScouts()
})


async function loadTopScouts() {
  title.textContent = `${milestone ? (await getMilestone(milestone)).data.title : getMilestoneTitle()}`
  topScoutsTable.innerHTML = '<div class="top-scouts-table-middle">Загрузка...</div>'

  const topScouts = await getTopScouts({ milestone, state: milestone ? 'all' : 'open' }).catch(err => {
    return err.message === 'milestone not found' ? false : err
  })

  if (topScouts === false) {
    topScoutsTable.innerHTML = '<div class="top-scouts-table-middle">На этой неделе разведку не проводим</div>'

    return
  }

  let html = ''

  for (let index = 0; index < topScouts.length; index++) {
    const topScout = topScouts[index]

    html += `<div class="top-scouts-table-img" style="background-image:url('${topScout.avatar}');"></div>` +
      `<div>#${index + 1} ${topScout.login}</div>` +
      `<div class="top-scouts-table-r">${topScout.count}</div>` +
      '<div class="top-scouts-table-sep"></div>'
  }

  if (!html) {
    topScoutsTable.innerHTML = '<div class="top-scouts-table-middle">Нет данных</div>'
  } else {
    topScoutsTable.innerHTML = html
  }
}
