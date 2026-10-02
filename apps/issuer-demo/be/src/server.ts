import { pathToFileURL } from 'node:url'
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { errorHandler } from './errors.js'
import { offersRouter } from './routes/offers.js'
import { APP_VERSION } from './version.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/version', (_req, res) => {
    res.json({ version: APP_VERSION })
  })

  app.use(offersRouter)

  app.use(errorHandler)

  return app
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(config.port, () => {
    console.log(`Issuer demo backend listening on http://localhost:${config.port}`)
  })
}
