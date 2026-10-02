import type { AuthResponse, PresentVcData } from '@equs-ai/dtk-embedded-ui'

export type CreateRequestResponse = PresentVcData

export interface VerifyRequest {
  authResponse: NonNullable<AuthResponse>
  txId: string
  origin?: string
}

export interface VerifyResponse {
  verifiedClaims: Record<string, unknown>
}

/** Result callbacks for `verifyKyc()`, passed straight through to `presentVCs()`. */
export type VerifyKycCallbacks = {
  onVerified: (verifiedClaims: Record<string, unknown>) => void
  onRejected: () => void
  onError: (error: unknown) => void
}
