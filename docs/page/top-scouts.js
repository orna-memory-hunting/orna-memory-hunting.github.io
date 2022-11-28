import { safeExecute } from '../lib/utils.js'
import { getMilestone, getMilestoneTitle } from '../lib/github.js'

/** @type {HTMLDivElement} */// @ts-ignore
const title = document.getElementById('top-scouts-title')
let milestone = null


safeExecute(async () => {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))

  milestone = parseInt(params.get('milestone'))
  milestone = isNaN(milestone) ? null : milestone

  await loadTopScouts()
})


async function loadTopScouts() {
  title.textContent = `${milestone ? (await getMilestone(milestone)).data.title : getMilestoneTitle()}`
}
