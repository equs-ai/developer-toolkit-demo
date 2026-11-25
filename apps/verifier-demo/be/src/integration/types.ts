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

export type IssuerTrustStatus = 'trusted' | 'untrusted' | 'not_evaluated'

export interface IssuerTrust {
  credentialId: string
  index: number
  status: IssuerTrustStatus
  source?: { type: 'verifier' | 'trust_list'; trustListId?: string }
  anchorSki?: string
  role?: string
  reason?: string
  category?: string
}

export interface VerifyPresentationResponse {
  verifiedClaims: Record<string, unknown>
  presentations?: Record<string, unknown[]>
  issuerTrust: IssuerTrust[]
}

export interface Paginated<T> {
  items: T[]
  pagination: { page: number; limit: number }
}

export interface Logo {
  uri: string
  altText?: string
}

export interface VerifierSummary {
  id: string
  name: string
  logo: Logo | null
}

export interface VpSchemaListItem {
  id: string
  name: string
  verifiers: VerifierSummary[]
}
