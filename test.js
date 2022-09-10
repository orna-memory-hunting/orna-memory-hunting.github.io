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

    reply.type('text/html')

    return index
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
