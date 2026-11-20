import { Router } from 'express'
import { z } from 'zod'
import { requireUserToken, userToken } from '../auth/userToken.js'
import { checkPayment, requestPayment } from '../integration/ap2Payments.js'

/** What the agent does at the bank, as the signed-in user. */
export const paymentsRouter = Router()

paymentsRouter.use('/payments', requireUserToken)

const paymentBody = z.object({
  checkoutJwt: z.string().min(1).max(16_000),
})

paymentsRouter.post('/payments', async (req, res) => {
  const { checkoutJwt } = paymentBody.parse(req.body)

  res.json(await requestPayment(userToken(res), checkoutJwt))
})

const statusQuery = z.object({
  wait: z.coerce.number().int().min(0).max(25).default(20),
})

paymentsRouter.get('/payments/:id', async (req, res) => {
  const paymentId = z.string().uuid().parse(req.params.id)
  const { wait } = statusQuery.parse(req.query)

  res.json(await checkPayment(userToken(res), paymentId, wait))
})
