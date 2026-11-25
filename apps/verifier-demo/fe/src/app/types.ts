import type { AuthResponse, PresentVcData } from '@equs-ai/dtk-embedded-ui'

/** Mirrors the backend's own list — see `be/src/integration/flows.ts`. */
export type Flow = 'kyc' | 'pid'

export type CreateRequestResponse = PresentVcData

export interface VerifyRequest {
  authResponse: NonNullable<AuthResponse>
  txId: string
  origin?: string
  flow: Flow
}

export interface VerifyResponse {
  verified: true
}

/** Result callbacks for `presentCredential()`, passed straight through to `presentVCs()`. */
export type PresentCallbacks = {
  onVerified: () => void
  onRejected: () => void
  onError: (error: unknown) => void
  /** Embed UI loading state: `false` once its iframe has loaded. */
  onLoading?: (loading: boolean) => void
}
