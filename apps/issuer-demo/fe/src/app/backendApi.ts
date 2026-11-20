import type { DeliverTxCodeParams, DeliverTxCodeResponse } from '@equs-ai/dtk-embedded-ui'
import { getAccessToken } from './auth'
import { config } from './config'
import type { CreateAutoOfferResponse, CreateOfferResponse, OfferStatus } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${getAccessToken() ?? ''}`,
  }

  if (init?.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${config.beBaseUrl.replace(/\/$/, '')}${path}`, { ...init, headers })

  if (!response.ok) {
    throw new Error(await describeFailure(response))
  }

  return (await response.json()) as T
}

async function describeFailure(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null)

  if (body !== null && typeof body === 'object' && 'message' in body) {
    return `${response.status}: ${String(body.message)}`
  }

  return `${response.status} ${response.statusText}`
}

export const backendApi = {
  createOffer: () => request<CreateOfferResponse>('/offers', { method: 'POST' }),

  createAutoOffer: () => request<CreateAutoOfferResponse>('/offers/auto', { method: 'POST' }),

  deliverTxCode: async ({ offerId, ...delivery }: DeliverTxCodeParams): Promise<DeliverTxCodeResponse> => {
    return request<DeliverTxCodeResponse>(`/offers/${encodeURIComponent(offerId)}/delivery`, { method: 'POST', body: JSON.stringify(delivery) })
  },

  getOffer: (offerId: string) => request<OfferStatus>(`/offers/${encodeURIComponent(offerId)}`),
}
