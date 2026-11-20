import { config } from '../config.js'
import { AppError } from '../errors.js'
import { callTool } from './mcpClient.js'

/**
 * One purchase through the AP2 connector (a closed mandate): the agent hands over the shop's
 * signed checkout, the user approves it in their wallet on the approval page, and the connector returns a
 * signed checkout mandate for the shop.
 *
 * The tools answer in text, written for an AI assistant. The demo shows that text as is and reads
 * the few values it needs out of it, matching whole sentences so that a change in wording fails
 * loudly instead of passing the wrong value on.
 */

export interface PaymentRequested {
  paymentId: string
  /** The connector's approval page; only the signed-in user can open it */
  approvalUrl: string
  text: string
}

export type PaymentState = 'approved' | 'waiting' | 'declined' | 'expired' | 'failed'

export interface PaymentStatus {
  state: PaymentState
  /** The checkout mandate the bank signed, once approved: what the shop checks before it ships */
  checkoutMandate?: string
  text: string
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const REQUESTED = new RegExp(`^Payment (${UUID}):`)
const APPROVAL_URL = new RegExp(`approve it here: (https?://\\S+/approve/${UUID})$`, 'm')
const APPROVED = new RegExp(`^Payment ${UUID} \\(.*\\) is approved\\. Signed payment artifact for the merchant:\\n(\\S+)$`)
const JWS = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export async function requestPayment(token: string, checkoutJwt: string): Promise<PaymentRequested> {
  const { text, isError } = await callTool(config.ap2McpUrl, token, 'request_payment', { checkout_jwt: checkoutJwt })

  const paymentId = REQUESTED.exec(text)?.[1]
  const approvalUrl = APPROVAL_URL.exec(text)?.[1]

  if (isError || !paymentId || !approvalUrl) {
    throw new AppError('payment_not_requested', text || 'The AP2 connector did not accept the request', 422)
  }

  return { paymentId, approvalUrl, text }
}

/** Waits up to `waitSeconds` on the connector's side for the user's answer. */
export async function checkPayment(token: string, paymentId: string, waitSeconds: number): Promise<PaymentStatus> {
  const { text, isError } = await callTool(config.ap2McpUrl, token, 'check_payment', { payment_id: paymentId, wait_seconds: waitSeconds })

  if (isError) {
    return { state: / is no longer available\. /.test(text) ? 'expired' : 'failed', text }
  }

  const approved = APPROVED.exec(text)

  if (approved) {
    const checkoutMandate = approved[1]

    if (!checkoutMandate || !JWS.test(checkoutMandate.split('~')[0] ?? '')) {
      throw new AppError('unexpected_answer', 'The approval arrived without a signed mandate', 502)
    }

    return { state: 'approved', checkoutMandate, text }
  }

  if (/^The user declined payment /.test(text)) return { state: 'declined', text }
  if (/ still waits for the user's approval /.test(text)) return { state: 'waiting', text }

  throw new AppError('unexpected_answer', `The AP2 connector's answer was not understood: ${text}`, 502)
}
