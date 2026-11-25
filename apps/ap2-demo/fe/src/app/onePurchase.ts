import { bankApi, shopApi } from './backendApi'
import type { Scenario } from './scriptedChat'
import { BackendError, type PaymentStatus } from './types'

/**
 * One purchase, approved once: the agent finds the shoes, the shop signs a UCP checkout, the AP2
 * connector asks the user to approve exactly that checkout in their wallet, and the shop completes the
 * checkout with the approved mandate. See docs/ap2-flow.md.
 */

const SHOP = 'Sneaker Depot'
const QUERY = 'red sneakers'
const BUDGET = 13000
const CURRENCY = 'USD'
const DELIVERY_ADDRESS = '1 Demo Street, Springfield'

const money = (minor: number, currency: string) => `${currency} ${(minor / 100).toFixed(2)}`

export const ONE_PURCHASE_PROMPT = `Find ${QUERY} under ${BUDGET / 100} ${CURRENCY} at ${SHOP} and buy the cheapest pair. Ask me to approve the purchase.`

export interface PurchaseContext {
  connectorName: string
  isBankConnected: boolean
  /** Who the order ships to */
  recipient: string
  /** Leaves the page to sign in; the chat starts over, already sent, on return */
  connectBank: () => void
  /** The user's message is already in the chat: they sent it before connecting the connector */
  resumed: boolean
}

export const onePurchase =
  (context: PurchaseContext): Scenario =>
  async (chat) => {
    const connector = context.connectorName
    const shopServer = `${SHOP} · UCP`
    const connectorServer = `${connector} · AP2 connector`

    if (context.resumed) {
      chat.user(ONE_PURCHASE_PROMPT)
    } else {
      await chat.reply([{ id: 'send', label: 'Send', say: ONE_PURCHASE_PROMPT }])
    }

    if (!context.isBankConnected) {
      await chat.say(
        `I can find the shoes, but to buy them I need the ${connector} connector. Connect it: you sign in once, and each purchase still waits for your approval in your wallet.`
      )
      await chat.reply([{ id: 'connect', label: `Connect ${connector}` }])
      context.connectBank()
      return
    }

    const catalogQuery = { q: QUERY, maxPrice: BUDGET }
    const products = await chat.tool(
      { server: SHOP, name: 'GET /catalog', input: catalogQuery },
      () => shopApi.searchCatalog(catalogQuery),
      (found) => found.map((product) => `${product.title}, ${money(product.price, product.currency)}`).join('\n') || 'Nothing found'
    )

    const cheapest = products[0]

    if (!cheapest) {
      await chat.say(`${SHOP} has no ${QUERY} under ${money(BUDGET, CURRENCY)}.`)
      return
    }

    const price = money(cheapest.price, cheapest.currency)

    await chat.say(
      `${SHOP} has ${products.length} pairs of ${QUERY} under ${money(BUDGET, CURRENCY)}. The cheapest is ${cheapest.title} for ${price}. Shall I buy it?`
    )
    await chat.reply([{ id: 'buy', label: 'Yes, buy it', say: 'Yes, buy it.' }])

    const checkoutRequest = {
      line_items: [{ item: { id: cheapest.id }, quantity: 1 as const }],
      buyer: { full_name: context.recipient },
      fulfillment: { address: DELIVERY_ADDRESS },
    }
    const checkout = await chat.tool(
      { server: shopServer, name: 'POST /checkout-sessions', input: checkoutRequest },
      () => shopApi.createCheckoutSession(checkoutRequest),
      (session) => `Checkout ${session.id}, ${session.status}. Signed by ${SHOP}: ${session.ap2.merchant_authorization}`
    )

    const checkoutJwt = checkout.ap2.merchant_authorization
    const payment = await chat.tool(
      { server: connectorServer, name: 'request_payment', input: { checkout_jwt: checkoutJwt } },
      () => withConnectorSignIn(connector, () => bankApi.requestPayment(checkoutJwt)),
      (requested) => requested.text
    )

    await chat.say(
      `I need your approval before I buy anything. Open the approval page, sign in and approve ${price} to ${SHOP} in your wallet, then tell me.`
    )

    let status: PaymentStatus

    for (;;) {
      await chat.reply([
        { id: 'open', label: 'Open the approval page', href: payment.approvalUrl },
        { id: 'approved', label: "I've approved it", say: 'Done, I approved it in my wallet.' },
      ])

      status = await chat.tool(
        { server: connectorServer, name: 'check_payment', input: { payment_id: payment.paymentId } },
        () => withConnectorSignIn(connector, () => bankApi.checkPayment(payment.paymentId)),
        (current) => current.text
      )

      if (status.state !== 'waiting') break

      await chat.say('Your approval has not arrived yet. Approve the purchase on the approval page, then tell me again.')
    }

    const checkoutMandate = status.checkoutMandate

    if (status.state !== 'approved' || !checkoutMandate) {
      await chat.say(
        status.state === 'declined'
          ? 'You declined the purchase, so I did not buy anything.'
          : `The purchase was not approved (${status.state}), so I did not buy anything. Ask me to try again.`
      )
      return
    }

    const completeRequest = { ap2: { checkout_mandate: checkoutMandate } }
    const completed = await chat.tool(
      { server: shopServer, name: `POST /checkout-sessions/${checkout.id}/complete`, input: completeRequest },
      () => shopApi.completeCheckoutSession(checkout.id, completeRequest),
      (session) =>
        `Checkout ${session.id}, ${session.status}. Order ${session.order?.id ?? '—'}\nShop's checks:\n${(session.order?.checks ?? []).map((check) => `- ${check}`).join('\n')}`
    )

    await chat.say(
      `Done. ${SHOP} accepted your approval: order ${completed.order?.id ?? ''}, ${cheapest.title}, ${price}. The approval covered this checkout only.`
    )
  }

/** A connector call that tells the user to connect again when their sign-in is no longer accepted. */
async function withConnectorSignIn<T>(connectorName: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (err) {
    if (err instanceof BackendError && err.code === 'unauthorized') {
      throw new Error(`${connectorName} did not accept your sign-in. Disconnect and connect again.`)
    }

    throw err
  }
}
