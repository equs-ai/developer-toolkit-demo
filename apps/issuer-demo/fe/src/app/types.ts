export interface CreateOfferResponse {
  uriId: string
  byReference: string
}

export interface CreateAutoOfferResponse {
  uriId: string
}

export type IssuanceState = 'pending' | 'issued' | 'accepted' | 'declined' | 'neglected' | 'revoked' | 'failed' | 'compromised'

export interface OfferStatus {
  id: string
  state: IssuanceState
  createdAt: string
}
