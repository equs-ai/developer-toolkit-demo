import { config } from './config'
import type { CreateRequestResponse, Flow, VerifyRequest, VerifyResponse } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }

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
  createRequest: (flow: Flow) => request<CreateRequestResponse>('/requests', { method: 'POST', body: JSON.stringify({ flow }) }),

  verify: (body: VerifyRequest) => request<VerifyResponse>('/verify', { method: 'POST', body: JSON.stringify(body) }),
}
