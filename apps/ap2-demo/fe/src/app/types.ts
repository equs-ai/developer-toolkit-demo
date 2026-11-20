export interface Product {
  id: string
  title: string
  price: number
  currency: string
}

/** The UCP checkout session as Sneaker Depot returns it, trimmed to what the demo reads */
export interface CheckoutSession {
  id: string
  status: 'ready_for_complete' | 'completed'
  currency: string
  totals: { type: 'total'; amount: number }[]
  ap2: { merchant_authorization: string }
  order?: { id: string; checks: string[] }
}

export interface CreateCheckoutSession {
  line_items: { item: { id: string }; quantity: 1 }[]
  buyer: { full_name: string }
  fulfillment: { address: string }
}

export interface PaymentRequested {
  paymentId: string
  approvalUrl: string
  text: string
}

export interface PaymentStatus {
  state: 'approved' | 'waiting' | 'declined' | 'expired' | 'failed'
  checkoutMandate?: string
  text: string
}

/** A failed backend call; `code` is the backend's error code */
export class BackendError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'BackendError'
  }
}
