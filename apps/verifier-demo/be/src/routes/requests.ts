import { Router } from 'express'
import { z } from 'zod'
import { resolveFlow } from '../integration/controlApi.js'
import { FLOWS } from '../integration/flows.js'
import { createPresentationRequest, verifyPresentation } from '../integration/integrationApi.js'

export const requestsRouter = Router()

const flow = z.enum(FLOWS).default('kyc')

const requestBody = z.object({ flow })

requestsRouter.post('/requests', async (req, res) => {
  const body = requestBody.parse(req.body ?? {})
  const schema = await resolveFlow(body.flow)

  const requests = await createPresentationRequest(schema)

  res.json(requests)
})

const verifyBody = z.object({
  authResponse: z.object({
    vpToken: z.record(z.unknown()).optional(),
    jwe: z.string().optional(),
    type: z.number().int(),
    transactionDataResponse: z.record(z.unknown()).optional(),
  }),
  txId: z.string().min(1),
  origin: z.string().url().optional(),
  flow,
})

requestsRouter.post('/verify', async (req, res) => {
  const { flow: requested, ...body } = verifyBody.parse(req.body)
  const { verifierId } = await resolveFlow(requested)

  // The disclosed claims are personal data: a real verifier acts on them here, server-side, and
  // tells the browser only the outcome.
  await verifyPresentation(verifierId, body)

  res.json({ verified: true })
})
