import { fastify } from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyCaching from '@fastify/caching'
import { resolve } from 'path'
import { readFile } from 'fs/promises'

const buildNumber = new Date().toISOString()
const app = fastify({ logger: { level: process.env.DEBUG_MODE === 'true' ? 'debug' : 'error' } })
  .register(fastifyCaching)
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
  .get('/add-amitie.html', async (req, reply) => {
    const index = (await readFile('./docs/add-amitie.html', 'utf-8'))
      .replace(/---\n---\n/, '')
      .replace(/Memory Hunting - Orna/, 'Memory Hunting - Orna (DEV)')

    reply.type('text/html')

    return index
  })
  .get('/version.js', async (req, reply) => {
    const version = (await readFile('./docs/version.js', 'utf-8'))
      .replace(/---\n---\n/, '')
      .replace(/{{ site.github.build_revision }}/, buildNumber)

    reply.type('application/javascript')

    return version
  })
  .get('/version.json', async (req, reply) => {
    const version = (await readFile('./docs/version.json', 'utf-8'))
      .replace(/---\n---\n/, '')
      .replace(/{{ site.github.build_revision }}/, buildNumber)

    reply.type('application/json')

    return version
  })
  .get('/orna-memory-hunting.webmanifest', async (req, reply) => {
    const manifest = (await readFile('./docs/orna-memory-hunting.webmanifest', 'utf-8'))
      .replace(/Memory Hunting/g, 'Memory Hunting (DEV)')

    reply.type('application/manifest+json')

    return manifest
  })

app.ready(async () => {
  try {
    const port = parseInt(process.env.PORT || '8080')

    await app.listen({ port, host: '0.0.0.0' })
    console.log('listening on http://localhost:' + port)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
})
