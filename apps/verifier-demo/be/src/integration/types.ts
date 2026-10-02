export type PresentationMode = 'web' | 'mobile' | 'dcApi'

export interface CreatePresentationRequest {
  vpSchemaId: string
  modes: PresentationMode[]
  encrypted: boolean
  verifierWebUrl: string
}

export interface PresentationRequestVariant {
  requestUri: string
  txId: string
}

export interface CreatePresentationRequestResponse {
  web: PresentationRequestVariant | null
  mobile: PresentationRequestVariant | null
  dc: PresentationRequestVariant | null
}

export interface AuthResponse {
  vpToken?: Record<string, unknown>
  jwe?: string
  type: number
  transactionDataResponse?: Record<string, unknown>
}

export interface VerifyPresentationRequest {
  authResponse: AuthResponse
  txId: string
  origin?: string
}

export interface VerifyPresentationResponse {
  verifiedClaims: Record<string, unknown>
  presentations?: Record<string, unknown[]>
}

export interface Paginated<T> {
  items: T[]
  pagination: { page: number; limit: number }
}

export interface VpSchemaListItem {
  id: string
  name: string
  verifiers: string[]
}
