export type DataType = 'Text' | 'Decimal' | 'Integer' | 'Boolean' | 'DateTime' | 'Date' | 'Time' | 'Array' | 'Display'

export interface ClaimDefs {
  path: string[]
  name: string
  dataType?: DataType
  mandatory?: boolean
}

export interface Logo {
  uri: string
  altText?: string
}

export interface IssuerSummary {
  id: string
  name: string
  logo: Logo | null
}

export interface VcSchemaSummary {
  id: string
  name: string
  versionId: string
}

export interface VcSchemaListItem {
  id: string
  vcSchemaVersionId: string
  version: number
  name: string
  description: string | null
  issuers: IssuerSummary[]
  claimDefs: ClaimDefs[]
  format: string
}

export interface Paginated<T> {
  items: T[]
  pagination: { page: number; limit: number }
}

export type Claims = Record<string, unknown>

export type NotificationMode = 'email' | 'push'

export interface AutoIssuance {
  email: string
  notificationModes?: NotificationMode[]
}

export type OfferFlow = 'pre_authorized_code' | 'authorization_code'

export interface CreatePreAuthOfferRequest {
  vcSchemaVersionId: string
  claims: Claims
  issuerId: string
  userId: string
  autoIssuance?: AutoIssuance
}

export interface CreateAuthCodeOfferRequest {
  vcSchemaVersionId: string
  issuerId: string
  flow: 'authorization_code'
}

export type CreateOfferRequest = CreatePreAuthOfferRequest | CreateAuthCodeOfferRequest

export interface CreateOfferResponse {
  params: Record<string, unknown>
  byValue: string
  byReference: string
  // Absent for an authorization code offer
  txCode?: string
  uriId: string
  flow: OfferFlow
}

export interface PullDelivery {
  method: 'pull'
  userId: string
}

export interface EmailDelivery {
  method: 'email'
  email: string
}

export type Delivery = PullDelivery | EmailDelivery

export interface DeliverTxCodeRequest {
  delivery: Delivery
}

export interface DeliverTxCodeResponse {
  txCodeFetchUrl: string | null
  txCodeResendUrl: string | null
  txCodeResendCooldown: number
}

export type IssuanceState = 'pending' | 'issued' | 'accepted' | 'declined' | 'neglected' | 'revoked' | 'failed' | 'compromised'

export interface IssuedOffer {
  uriId: string
  userId: string | null
  flow: OfferFlow
  status: IssuanceState
  credLifetime: number | null
  assurance: string
  offerDate: string
  updatedDate: string
  credDefId: string
  credentialIssuer: string
  issuer: IssuerSummary
  vcSchema: VcSchemaSummary
  statusList: { uri: string; idx: number } | null
  byReference: string
}
