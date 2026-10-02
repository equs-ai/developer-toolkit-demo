import { DtkError } from '../errors.js'
import { getAccessToken } from './token.js'

export async function dtkFetch<T>(baseUrl: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const method = init.method ?? 'GET'

  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new DtkError(response.status, method, url, safeJson(body))
  }

  return (await response.json()) as T
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}
