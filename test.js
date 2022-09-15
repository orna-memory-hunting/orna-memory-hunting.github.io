import { fastify } from 'fastify'
import fastifyStatic from '@fastify/static'
import { resolve } from 'path'
import { readFile } from 'fs/promises'

const app = fastify({ logger: { level: process.env.DEBUG_MODE === 'true' ? 'debug' : 'error' } })

app
  .register(fastifyStatic, {
    root: resolve('docs'),
    prefix: '/'
  })
  .get('/', async (req, reply) => {
    const index = (await readFile('./docs/index.html', 'utf-8'))
      .replace(/---\n---\n/, '')
      .replace(/Memory Hunting - Orna/, 'Memory Hunting - Orna (DEV)')

    reply.type('text/html')

    return index
  })
  .get('/orna-memory-hunting.webmanifest', async (req, reply) => {
    const manifest = (await readFile('./docs/orna-memory-hunting.webmanifest', 'utf-8'))
      .replace(/Memory Hunting/g, 'Memory Hunting (DEV)')

    reply.type('application/manifest+json')

    return manifest
  })
  .ready(async () => {
    try {
      const port = parseInt(process.env.PORT || '8080')

      await app.listen({ port, host: '0.0.0.0' })
      console.log('listening on http://localhost:' + port)
    } catch (err) {
      app.log.error(err)
      process.exit(1)
    }
  })
