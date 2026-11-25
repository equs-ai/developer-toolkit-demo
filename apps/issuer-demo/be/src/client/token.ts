import { config } from '../config.js'
import { DtkError } from '../errors.js'

const EXPIRY_MARGIN_SECONDS = 30

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ClientCredentials {
  tokenUrl: string
  clientId: string
  clientSecret: string
  onFailure: (status: number) => Error
}

export function clientCredentialsToken({ tokenUrl, clientId, clientSecret, onFailure }: ClientCredentials): () => Promise<string> {
  let cached: { token: string; expiresAt: number } | null = null
  let inFlight: Promise<string> | null = null

  async function requestToken(): Promise<string> {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!response.ok) {
      throw onFailure(response.status)
    }

    const body = (await response.json()) as TokenResponse

    if (body.token_type !== 'Bearer') {
      throw new Error(`Unexpected token type from ${tokenUrl}: ${body.token_type}`)
    }

    cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in - EXPIRY_MARGIN_SECONDS) * 1000 }

    return body.access_token
  }

  return async () => {
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token
    }

    inFlight ??= requestToken().finally(() => {
      inFlight = null
    })

    return inFlight
  }
}

export const getAccessToken = clientCredentialsToken({
  ...config.auth,
  onFailure: (status) => new DtkError(status, 'POST', config.auth.tokenUrl, '<token endpoint error body withheld>'),
})
