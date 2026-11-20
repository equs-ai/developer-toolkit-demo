import { Router, type Request } from 'express'
import { z } from 'zod'
import { currentUser, requireUser } from '../auth/endUserToken.js'
import { getIssuedOffer, resolveKycVcSchema } from '../integration/controlApi.js'
import { createAuthCodeOffer, createAutoIssuanceOffer, createOffer, setTxCodeDelivery } from '../integration/integrationApi.js'
import type { Delivery } from '../integration/types.js'
import { buildKycClaims } from '../claims-source/kyc.js'
import { AppError } from '../errors.js'

export const offersRouter = Router()

offersRouter.post('/offers', requireUser, async (_req, res) => {
  const user = currentUser(res)
  const { vcSchemaVersionId, issuerId } = await resolveKycVcSchema()

  const offer = await createOffer({
    vcSchemaVersionId,
    issuerId,
    userId: user.sub,
    claims: buildKycClaims(user.email, user.name),
  })

  res.json({ uriId: offer.uriId, byReference: offer.byReference })
})

offersRouter.post('/offers/auto', requireUser, async (_req, res) => {
  const user = currentUser(res)
  const { vcSchemaVersionId, issuerId } = await resolveKycVcSchema()

  const offer = await createAutoIssuanceOffer({
    vcSchemaVersionId,
    issuerId,
    userId: user.sub,
    email: user.email,
    claims: buildKycClaims(user.email, user.name),
  })

  res.json({ uriId: offer.uriId })
})

// Public, and bound to nobody: whoever signs in at the wallet receives their own claims, via the
// Attribute Provider. This is the signed-out path.
offersRouter.post('/offers/auth-code', async (_req, res) => {
  const { vcSchemaVersionId, issuerId } = await resolveKycVcSchema()

  const offer = await createAuthCodeOffer({ vcSchemaVersionId, issuerId })

  res.json({ uriId: offer.uriId, byReference: offer.byReference })
})

const deliveryBody = z.object({ method: z.enum(['pull', 'email']) })

offersRouter.post('/offers/:id/delivery', requireUser, async (req: Request<{ id: string }>, res) => {
  const user = currentUser(res)
  const { method } = deliveryBody.parse(req.body)

  const offer = await getIssuedOffer(req.params.id)

  if (offer.userId !== user.sub) {
    throw new AppError('not_found', 'The requested resource does not exist in DTK', 404)
  }

  const delivery: Delivery = method === 'pull' ? { method, userId: user.sub } : { method, email: user.email }

  const result = await setTxCodeDelivery(req.params.id, delivery)

  res.json(result)
})

// Public, so a signed-out visitor can check their offer too. The id is an unguessable uuid and only
// the state is returned.
offersRouter.get('/offers/:id', async (req, res) => {
  const offer = await getIssuedOffer(req.params.id)

  res.json({ id: offer.uriId, state: offer.status, createdAt: offer.offerDate })
})
