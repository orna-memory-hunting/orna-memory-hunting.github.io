import { doAsync, safeExecute, registerServiceWorker } from '../lib/utils.js'
import { initComponents } from '../lib/components.js'
import { initMainMenu } from '../lib/main-menu.js'

safeExecute(async () => {
  if (window.location.hostname !== 'localhost') {
    doAsync(registerServiceWorker)
  }

  initComponents()
  initMainMenu()

  if ([11, 0, 1].includes(new Date().getMonth())) {
    const { addSnow } = await import('../lib/snow.js')

    addSnow()
  }
})
