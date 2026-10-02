import { Router } from 'express'
import { z } from 'zod'
import { resolveKycVpSchema } from '../integration/controlApi.js'
import { createPresentationRequest, verifyPresentation } from '../integration/integrationApi.js'

export const requestsRouter = Router()

requestsRouter.post('/requests', async (_req, res) => {
  const schema = await resolveKycVpSchema()

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
})

requestsRouter.post('/verify', async (req, res) => {
  const body = verifyBody.parse(req.body)
  const { verifierId } = await resolveKycVpSchema()

  const { verifiedClaims } = await verifyPresentation(verifierId, body)

  res.json({ verifiedClaims })
})
