import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { AppError } from '../errors.js'
import { findProduct, searchProducts, SHOP } from '../merchant/catalog.js'
import { completeCheckoutSession, createCheckoutSession } from '../merchant/checkoutSessions.js'
import { SIGNING_ALG, signingKey } from '../merchant/signingKey.js'

/**
 * Sneaker Depot, the stand-in shop: its UCP profile and checkout, and its own catalog. No sign-in —
 * the shop does not know who the bank's customer is, only that the bank signed a payment.
 */
export const merchantRouter = Router()

const UCP_VERSION = '2026-01-11'

merchantRouter.get('/merchant/.well-known/ucp', async (_req, res) => {
  const { jwk } = await signingKey()
  const endpoint = `${config.shopPublicUrl}/merchant`

  res.json({
    merchant: SHOP,
    ucp: {
      version: UCP_VERSION,
      services: { 'dev.ucp.shopping': { version: UCP_VERSION, rest: { endpoint } } },
      capabilities: [
        { name: 'dev.ucp.shopping.checkout', version: UCP_VERSION },
        { name: 'dev.ucp.shopping.ap2_mandate', version: UCP_VERSION, extends: 'dev.ucp.shopping.checkout' },
      ],
    },
    signing_keys: [{ ...jwk, alg: SIGNING_ALG }],
    // What a generic agent needs to shop here: UCP starts at checkout, and has no catalog of its own
    how_to_buy: {
      catalog: `GET ${endpoint}/catalog?q=<words>&maxPrice=<minor units>; prices are in minor units, q and maxPrice are optional`,
      checkout: {
        request: `POST ${endpoint}/checkout-sessions`,
        body: {
          line_items: [{ item: { id: '<product id>' }, quantity: 1 }],
          buyer: { full_name: '<recipient>' },
          fulfillment: { address: '<delivery address>' },
        },
        returns: 'ap2.merchant_authorization: the signed checkout, the checkout_jwt to give the bank',
      },
      complete: {
        request: `POST ${endpoint}/checkout-sessions/<id>/complete`,
        body: { ap2: { checkout_mandate: '<the signed payment artifact from the bank>' } },
      },
    },
  })
})

const catalogQuery = z.object({
  q: z.string().min(1).max(200).optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
})

merchantRouter.get('/merchant/catalog', (req, res) => {
  const { q, maxPrice } = catalogQuery.parse(req.query)

  res.json({ products: searchProducts(q, maxPrice) })
})

const createBody = z.object({
  line_items: z.array(z.object({ item: z.object({ id: z.string().min(1) }), quantity: z.literal(1) })).length(1),
  buyer: z.object({ full_name: z.string().min(1).max(200) }),
  fulfillment: z.object({ address: z.string().min(1).max(500) }),
})

merchantRouter.post('/merchant/checkout-sessions', async (req, res) => {
  const {
    line_items: [line],
    buyer,
    fulfillment,
  } = createBody.parse(req.body)
  const product = line && findProduct(line.item.id)

  if (!product) {
    throw new AppError('not_found', 'No such product', 404)
  }

  res.status(201).json(await createCheckoutSession(product, { fullName: buyer.full_name, address: fulfillment.address }))
})

const completeBody = z.object({
  ap2: z.object({ checkout_mandate: z.string().min(1) }),
})

merchantRouter.post('/merchant/checkout-sessions/:id/complete', async (req, res) => {
  const { ap2 } = completeBody.parse(req.body)

  res.json(await completeCheckoutSession(req.params.id, ap2.checkout_mandate))
})
