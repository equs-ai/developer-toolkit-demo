import { config } from '../config.js'
import { dtkFetch } from '../client/httpClient.js'
import type { Claims, CreateOfferRequest, CreateOfferResponse, Delivery, DeliverTxCodeResponse } from './types.js'

interface OfferInput {
  vcSchemaVersionId: string
  issuerId: string
  userId: string
  claims: Claims
}

export async function createOffer(input: OfferInput): Promise<CreateOfferResponse> {
  const body: CreateOfferRequest = {
    vcSchemaVersionId: input.vcSchemaVersionId,
    issuerId: input.issuerId,
    userId: input.userId,
    claims: input.claims,
  }

  return dtkFetch<CreateOfferResponse>(config.integrationApiUrl, '/oid4vci/offers', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function createAutoIssuanceOffer(input: OfferInput & { email: string }): Promise<CreateOfferResponse> {
  const body: CreateOfferRequest = {
    vcSchemaVersionId: input.vcSchemaVersionId,
    issuerId: input.issuerId,
    userId: input.userId,
    claims: input.claims,
    autoIssuance: { email: input.email, notificationModes: ['email', 'push'] },
  }

  return dtkFetch<CreateOfferResponse>(config.integrationApiUrl, '/oid4vci/offers', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function setTxCodeDelivery(uriId: string, delivery: Delivery): Promise<DeliverTxCodeResponse> {
  return dtkFetch<DeliverTxCodeResponse>(config.integrationApiUrl, `/oid4vci/offers/${uriId}/delivery`, {
    method: 'POST',
    body: JSON.stringify({ delivery }),
  })
}
