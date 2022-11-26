import { doAsync, safeExecute, registerServiceWorker } from '../lib/utils.js'
import { initComponents } from '../lib/components.js'
import { initMainMenu } from '../lib/main-menu.js'

safeExecute(() => {
  if (window.location.hostname !== 'localhost') {
    doAsync(registerServiceWorker)
  }

  initComponents()
  initMainMenu()
})
