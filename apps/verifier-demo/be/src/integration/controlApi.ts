import { config } from '../config.js'
import { AppError } from '../errors.js'
import { dtkFetch } from '../client/httpClient.js'
import type { Paginated, VpSchemaListItem } from './types.js'

const KYC_VP_SCHEMA_NAME = 'KYC VP'

export async function resolveKycVpSchema(): Promise<{ vpSchemaId: string; verifierId: string }> {
  const page = await dtkFetch<Paginated<VpSchemaListItem>>(config.controlApiUrl, '/vp-schemas')

  const schema = page.items.find((item) => item.name === KYC_VP_SCHEMA_NAME)

  if (!schema) {
    throw new AppError('vp_schema_not_found', `No VP Schema named "${KYC_VP_SCHEMA_NAME}" in this tenant — see docs/schemas.md`, 500)
  }

  const verifierId = schema.verifiers[0]

  if (!verifierId) {
    throw new AppError('no_verifier_attached', `VP Schema "${KYC_VP_SCHEMA_NAME}" has no Verifier attached to it`, 500)
  }

  return { vpSchemaId: schema.id, verifierId }
}
