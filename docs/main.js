import { doAsync, registerServiceWorker } from './lib/utils.js'
import { initComponents } from './lib/components.js'

if (window.location.hostname !== 'localhost') {
  doAsync(registerServiceWorker)
}

initComponents()
