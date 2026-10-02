import { Router } from 'express'
import { z } from 'zod'
import { currentUser, requireUser } from '../auth/endUserToken.js'
import { getIssuedOffer, resolveKycVcSchema } from '../integration/controlApi.js'
import { createAutoIssuanceOffer, createOffer, setTxCodeDelivery } from '../integration/integrationApi.js'
import { buildKycClaims } from '../claims-source/kyc.js'

export const offersRouter = Router()

offersRouter.use(requireUser)

offersRouter.post('/offers', async (_req, res) => {
  const user = currentUser(res)
  const { vcSchemaVersionId, issuerId } = await resolveKycVcSchema()

  const offer = await createOffer({
    vcSchemaVersionId,
    issuerId,
    userId: user.sub,
    claims: buildKycClaims(user.email),
  })

  res.json({ uriId: offer.uriId, byReference: offer.byReference })
})

offersRouter.post('/offers/auto', async (_req, res) => {
  const user = currentUser(res)
  const { vcSchemaVersionId, issuerId } = await resolveKycVcSchema()

  const offer = await createAutoIssuanceOffer({
    vcSchemaVersionId,
    issuerId,
    userId: user.sub,
    email: user.email,
    claims: buildKycClaims(user.email),
  })

  res.json({ uriId: offer.uriId })
})

const deliveryBody = z.discriminatedUnion('method', [
  z.object({ method: z.literal('pull'), userId: z.string().uuid() }),
  z.object({ method: z.literal('email'), email: z.string().email() }),
])

offersRouter.post('/offers/:id/delivery', async (req, res) => {
  const delivery = deliveryBody.parse(req.body)

  const result = await setTxCodeDelivery(req.params.id, delivery)

  res.json(result)
})

offersRouter.get('/offers/:id', async (req, res) => {
  const offer = await getIssuedOffer(req.params.id)

  res.json({ id: offer.uriId, state: offer.state, createdAt: offer.offerDate })
})
