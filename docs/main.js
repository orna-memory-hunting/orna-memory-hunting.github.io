import { doAsync, registerServiceWorker } from './lib/utils.js'

if (window.location.hostname !== 'localhost') {
  doAsync(registerServiceWorker)
}
