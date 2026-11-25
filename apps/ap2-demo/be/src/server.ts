import { pathToFileURL } from 'node:url'
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { errorHandler } from './errors.js'
import { merchantRouter } from './routes/merchant.js'
import { paymentsRouter } from './routes/payments.js'
import { APP_VERSION } from './version.js'

export function createApp() {
  const app = express()

  // TODO: this is a public-facing service and the shop's routes are anonymous: think through rate
  // limiting, bot banning and the like before it goes live, here or at the ingress.

  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/version', (_req, res) => {
    res.json({ version: APP_VERSION })
  })

  app.use(merchantRouter)
  app.use(paymentsRouter)

  app.use(errorHandler)

  return app
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(config.port, () => {
    console.log(`AP2 demo backend listening on http://localhost:${config.port}`)
  })
}
