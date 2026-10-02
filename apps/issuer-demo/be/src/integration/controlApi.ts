import { config } from '../config.js'
import { AppError } from '../errors.js'
import { dtkFetch } from '../client/httpClient.js'
import type { IssuedOffer, Paginated, VcSchemaListItem } from './types.js'

const KYC_VC_SCHEMA_NAME = 'KYC VC'

export async function resolveKycVcSchema(): Promise<{ vcSchemaVersionId: string; issuerId: string }> {
  const page = await dtkFetch<Paginated<VcSchemaListItem>>(config.controlApiUrl, '/vc-schemas')

  const schema = page.items.find((item) => item.name === KYC_VC_SCHEMA_NAME)

  if (!schema) {
    throw new AppError('vc_schema_not_found', `No VC Schema named "${KYC_VC_SCHEMA_NAME}" in this tenant — see docs/schemas.md`, 500)
  }

  const issuerId = schema.issuers[0]

  if (!issuerId) {
    throw new AppError('no_issuer_attached', `VC Schema "${KYC_VC_SCHEMA_NAME}" has no Issuer attached to it`, 500)
  }

  return { vcSchemaVersionId: schema.vcSchemaVersionId, issuerId }
}

export async function getIssuedOffer(uriId: string): Promise<IssuedOffer> {
  return dtkFetch<IssuedOffer>(config.controlApiUrl, `/issuance/offers/${uriId}`)
}
