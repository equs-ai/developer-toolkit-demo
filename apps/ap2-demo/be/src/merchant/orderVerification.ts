import { createHash } from 'node:crypto'
import { decodeJwt, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { verifyChain } from './signatureChain.js'

type Json = Record<string, unknown>

/** The claims of a checkout this shop signed that the checks below read. Amounts are in minor units. */
interface CheckoutClaims {
  merchant: { id: string }
  amount: number
  currency: string
}

export interface VerifiedOrder {
  flow: 'open' | 'closed'
  checkoutHash: string
  checks: string[]
}

const isObj = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value)

const num = (value: unknown): number | undefined => (typeof value === 'number' ? value : undefined)

export const checkoutHash = (checkoutJwt: string): string => createHash('sha256').update(checkoutJwt).digest('base64url')

const findMandates = (disclosures: unknown[]): Json[] => {
  const found: Json[] = []
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk)
    if (!isObj(value)) return
    if (typeof value.vct === 'string' && value.vct.startsWith('mandate.')) found.push(value)
    Object.values(value).forEach(walk)
  }

  walk(disclosures)

  return found
}

/**
 * What a merchant checks before it ships: the signature chain (card issuer → holder → agent), its own
 * checkout signature, the payment bound to that checkout's hash, payee and amount, and for an open
 * mandate the limits the user approved. Demo depth, as a real shop would check it.
 */
export async function verifyOrderArtifact(
  artifact: string,
  merchantIssuer: string,
  merchantKeys: JWTVerifyGetKey,
  trustedIssuers: readonly string[]
): Promise<VerifiedOrder> {
  const fail = (why: string): never => {
    throw new Error(why)
  }
  const chain = await verifyChain(artifact, trustedIssuers)
  // Closed flow: the holder signs the closed mandates (1 hop). Open flow: the holder signs the open
  // mandates, the agent the closed ones with the delegated key (2 hops). Mandates come only from there.
  if (chain.hops.length > 2) fail('more hops than an AP2 payment has')
  const flow = chain.hops.length === 2 ? 'open' : 'closed'
  const closed = findMandates(chain.hops[chain.hops.length - 1] ?? [])
  const open = flow === 'open' ? findMandates(chain.hops[0] ?? []) : []
  const checks: string[] = []
  const byVct = (mandates: Json[], vct: string) => mandates.filter((mandate) => mandate.vct === vct)
  const [closedCheckout, ...moreCheckouts] = byVct(closed, 'mandate.checkout.1')
  const [closedPayment, ...morePayments] = byVct(closed, 'mandate.payment.1')

  if (!closedCheckout || !closedPayment || moreCheckouts.length || morePayments.length) {
    throw new Error('expected one closed checkout and one closed payment mandate in the last hop')
  }
  checks.push('closed checkout + payment present')
  checks.push(...chain.checks)

  const jwt = typeof closedCheckout.checkout_jwt === 'string' ? closedCheckout.checkout_jwt : ''
  const issuer = decodeJwt(jwt).iss ?? fail('checkout_jwt has no issuer')

  if (issuer !== merchantIssuer) fail('checkout_jwt is not a checkout of this merchant')

  const { payload } = await jwtVerify(jwt, merchantKeys, {
    issuer,
    typ: 'checkout+jwt',
    algorithms: ['ES256'],
  }).catch((error: unknown) => fail(`checkout_jwt rejected: ${error instanceof Error ? error.message : String(error)}`))
  const checkout = payload as unknown as CheckoutClaims
  checks.push('checkout signed by this merchant, not expired')

  const hash = checkoutHash(jwt)

  if (closedCheckout.checkout_hash !== hash || closedPayment.transaction_id !== hash) {
    fail('checkout_hash / transaction_id do not match the checkout')
  }
  checks.push('payment bound to the checkout hash')

  const payee = isObj(closedPayment.payee) ? closedPayment.payee : {}

  if (payee.id !== checkout.merchant.id) fail('payee is not the checkout merchant')

  const paid = isObj(closedPayment.payment_amount) ? closedPayment.payment_amount : {}
  const value = num(paid.amount) ?? fail('no payment amount')

  if (value !== checkout.amount || paid.currency !== checkout.currency) {
    fail(`paid ${value} ${String(paid.currency)}, checkout says ${checkout.amount} ${checkout.currency}`)
  }
  checks.push('pays exactly the checkout amount')

  const credentialType = typeof chain.card.vct === 'string' ? chain.card.vct : fail('the presented credential has no vct')
  const instrument = isObj(closedPayment.payment_instrument) ? closedPayment.payment_instrument : {}

  if (instrument.type !== 'presented_credential' || instrument.id !== credentialType) {
    fail('payment instrument is not the presented credential')
  }
  checks.push(`paid with the presented credential of type ${credentialType}`)

  const now = Math.floor(Date.now() / 1000)

  for (const mandate of [closedCheckout, closedPayment]) {
    const exp = num(mandate.exp) ?? fail(`mandate ${String(mandate.vct)} has no exp`)

    if (exp < now) fail(`mandate ${String(mandate.vct)} expired`)
  }
  for (const mandate of open) {
    const exp = num(mandate.exp)

    if (exp !== undefined && exp < now) fail(`mandate ${String(mandate.vct)} expired`)
  }

  const [openCheckout] = byVct(open, 'mandate.checkout.open.1')
  const [openPayment] = byVct(open, 'mandate.payment.open.1')

  if (flow === 'open') {
    if (!openCheckout || !openPayment) fail('open flow without the open mandates in the first hop')
    const constraints = (mandate: Json | undefined): Json[] =>
      Array.isArray(mandate?.constraints) ? mandate.constraints.filter(isObj) : []
    const allows = (constraint: Json | undefined) =>
      Array.isArray(constraint?.allowed) && constraint.allowed.some((entry) => isObj(entry) && entry.id === checkout.merchant.id)
    const range = constraints(openPayment).find(({ type }) => type === 'payment.amount_range')

    if (!range || range.currency !== checkout.currency) fail('currency differs from the approved one')
    if (value > (num(range?.max) ?? -1) || value < (num(range?.min) ?? 0)) {
      fail('amount outside the approved range')
    }
    if (!allows(constraints(openPayment).find(({ type }) => type === 'payment.allowed_payees'))) {
      fail('merchant not in the approved payees')
    }
    if (!allows(constraints(openCheckout).find(({ type }) => type === 'checkout.allowed_merchants'))) {
      fail('merchant not in the approved merchants')
    }
    checks.push('within the limits the user approved (open mandate)')
  } else {
    checks.push('the user signed this exact payment (closed mandate)')
  }

  return {
    flow,
    checkoutHash: hash,
    checks,
  }
}
