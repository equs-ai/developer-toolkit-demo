import { config } from '../config.js'
import { DtkError } from '../errors.js'

const EXPIRY_MARGIN_SECONDS = 30

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

let cached: { token: string; expiresAt: number } | null = null
let inFlight: Promise<string> | null = null

async function requestToken(): Promise<string> {
  const response = await fetch(config.auth.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.auth.clientId,
      client_secret: config.auth.clientSecret,
    }),
  })

  if (!response.ok) {
    throw new DtkError(response.status, 'POST', config.auth.tokenUrl, '<token endpoint error body withheld>')
  }

  const body = (await response.json()) as TokenResponse

  if (body.token_type !== 'Bearer') {
    throw new Error(`Unexpected token type from DTK: ${body.token_type}`)
  }

  cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in - EXPIRY_MARGIN_SECONDS) * 1000 }

  return body.access_token
}

export async function getAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token
  }

  inFlight ??= requestToken().finally(() => {
    inFlight = null
  })

  return inFlight
}
