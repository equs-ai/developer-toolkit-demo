import { getAccessToken } from '../integration/bankSignIn'
import { config } from './config'
import {
  BackendError,
  type CheckoutSession,
  type CreateCheckoutSession,
  type PaymentRequested,
  type PaymentStatus,
  type Product,
} from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getAccessToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (init?.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${config.beBaseUrl.replace(/\/$/, '')}${path}`, { ...init, headers })

  if (!response.ok) {
    throw await describeFailure(response)
  }

  return (await response.json()) as T
}

async function describeFailure(response: Response): Promise<BackendError> {
  const body: unknown = await response.json().catch(() => null)

  if (body !== null && typeof body === 'object' && 'error' in body && 'message' in body) {
    return new BackendError(String(body.error), String(body.message))
  }

  return new BackendError('http_error', `${response.status} ${response.statusText}`)
}

/** Sneaker Depot, the stand-in shop: its own catalog, then UCP checkout. */
export const shopApi = {
  searchCatalog: (params: { q: string; maxPrice: number }) =>
    request<{ products: Product[] }>(`/merchant/catalog?${new URLSearchParams({ q: params.q, maxPrice: String(params.maxPrice) })}`).then(
      ({ products }) => products
    ),

  createCheckoutSession: (body: CreateCheckoutSession) =>
    request<CheckoutSession>('/merchant/checkout-sessions', { method: 'POST', body: JSON.stringify(body) }),

  completeCheckoutSession: (id: string, body: { ap2: { checkout_mandate: string } }) =>
    request<CheckoutSession>(`/merchant/checkout-sessions/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

/** The Tenant's AP2 connector, called through this demo's backend as the signed-in user. */
export const bankApi = {
  requestPayment: (checkoutJwt: string) =>
    request<PaymentRequested>('/payments', { method: 'POST', body: JSON.stringify({ checkoutJwt }) }),

  checkPayment: (paymentId: string) => request<PaymentStatus>(`/payments/${encodeURIComponent(paymentId)}`),
}
