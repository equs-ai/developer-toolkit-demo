import { randomUUID } from 'node:crypto'
import { createLocalJWKSet, SignJWT } from 'jose'
import { config } from '../config.js'
import { AppError } from '../errors.js'
import { SHOP, type Product } from './catalog.js'
import { checkoutHash, verifyOrderArtifact } from './orderVerification.js'
import { SIGNING_ALG, signingKey } from './signingKey.js'

/**
 * Sneaker Depot's UCP checkout (`dev.ucp.shopping.checkout` with the `dev.ucp.shopping.ap2_mandate`
 * extension), kept in memory: the demo has no database.
 *
 * `ap2.merchant_authorization` is the shop's signature over the checkout, which the agent hands to
 * the bank to ask for a payment. The bank's AP2 connector reads it as a compact JWT carrying the
 * checkout's terms.
 * TODO: UCP signs the checkout body as a detached JWS (JCS-canonicalized); move to that form.
 */

const TTL_SECONDS = 15 * 60
const MAX_SESSIONS = 1000

export interface Buyer {
  fullName: string
  address: string
}

export interface CheckoutSession {
  id: string
  status: 'ready_for_complete' | 'completing' | 'completed'
  currency: string
  line_items: { id: string; item: { id: string; title: string; price: number }; quantity: number }[]
  totals: { type: 'total'; amount: number }[]
  buyer: { full_name: string }
  fulfillment: { address: string }
  ap2: { merchant_authorization: string }
  /** The checks the shop ran on the mandate before it accepted the order */
  order?: { id: string; checks: string[] }
}

const sessions = new Map<string, CheckoutSession>()

export async function createCheckoutSession(product: Product, buyer: Buyer): Promise<CheckoutSession> {
  const id = randomUUID()
  const { privateKey, jwk } = await signingKey()

  const merchantAuthorization = await new SignJWT({
    id,
    merchant: SHOP,
    item: { id: product.id, title: product.title },
    amount: product.price,
    currency: product.currency,
    delivery: { recipient: buyer.fullName, address: buyer.address },
  })
    .setProtectedHeader({ alg: SIGNING_ALG, kid: jwk.kid, typ: 'checkout+jwt' })
    .setIssuer(SHOP.id)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(privateKey)

  const session: CheckoutSession = {
    id,
    status: 'ready_for_complete',
    currency: product.currency,
    line_items: [{ id: randomUUID(), item: { id: product.id, title: product.title, price: product.price }, quantity: 1 }],
    totals: [{ type: 'total', amount: product.price }],
    buyer: { full_name: buyer.fullName },
    fulfillment: { address: buyer.address },
    ap2: { merchant_authorization: merchantAuthorization },
  }

  // Anyone can open a checkout, so the oldest goes first; a Map iterates in insertion order
  if (sessions.size >= MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value ?? '')
  }

  sessions.set(id, session)

  return session
}

/**
 * Completes a checkout with the mandate the bank signed, after the checks a shop makes before it
 * ships: the signature chain from the bank's card to the user, and that the mandate pays exactly this
 * checkout. Fails with the reason, and a checkout is paid once.
 */
export async function completeCheckoutSession(id: string, checkoutMandate: string): Promise<CheckoutSession> {
  const session = sessions.get(id)

  if (!session) {
    throw new AppError('not_found', 'No such checkout', 404)
  }

  if (session.status !== 'ready_for_complete') {
    throw new AppError('checkout_not_completed', 'This checkout is already paid', 422)
  }

  // Taken before the first await: a second request for this checkout stops at the check above
  session.status = 'completing'

  try {
    const { jwk } = await signingKey()
    const verified = await verifyOrderArtifact(checkoutMandate, SHOP.id, createLocalJWKSet({ keys: [jwk] }), config.trustedIssuers).catch(
      (error: unknown) => {
        throw new AppError(
          'checkout_not_completed',
          `The shop refused the mandate: ${error instanceof Error ? error.message : String(error)}`,
          422
        )
      }
    )

    if (verified.checkoutHash !== checkoutHash(session.ap2.merchant_authorization)) {
      throw new AppError('checkout_not_completed', 'The shop refused the mandate: it pays a different checkout', 422)
    }

    session.status = 'completed'
    session.order = { id: randomUUID().slice(0, 8).toUpperCase(), checks: verified.checks }

    return session
  } catch (error) {
    session.status = 'ready_for_complete'
    throw error
  }
}
