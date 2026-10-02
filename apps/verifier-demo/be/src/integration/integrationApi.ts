import { config } from '../config.js'
import { dtkFetch } from '../client/httpClient.js'
import type {
  CreatePresentationRequest,
  CreatePresentationRequestResponse,
  VerifyPresentationRequest,
  VerifyPresentationResponse,
} from './types.js'

export async function createPresentationRequest(schema: {
  vpSchemaId: string
  verifierId: string
}): Promise<CreatePresentationRequestResponse> {
  const body: CreatePresentationRequest = {
    vpSchemaId: schema.vpSchemaId,
    modes: ['mobile'],
    encrypted: true,
    verifierWebUrl: config.verifierWebUrl,
  }

  return dtkFetch<CreatePresentationRequestResponse>(config.integrationApiUrl, `/${schema.verifierId}/oid4vp/requests/multi`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function verifyPresentation(verifierId: string, req: VerifyPresentationRequest): Promise<VerifyPresentationResponse> {
  return dtkFetch<VerifyPresentationResponse>(config.integrationApiUrl, `/${verifierId}/oid4vp/verify`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
