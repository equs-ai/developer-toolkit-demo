import { config } from '../config.js'
import { AppError } from '../errors.js'
import { dtkFetch } from '../client/httpClient.js'
import { FLOW_SCHEMA_NAMES, type Flow } from './flows.js'
import type { Paginated, VpSchemaListItem } from './types.js'

export async function resolveFlow(flow: Flow): Promise<{ vpSchemaId: string; verifierId: string }> {
  const name = FLOW_SCHEMA_NAMES[flow]

  const page = await dtkFetch<Paginated<VpSchemaListItem>>(
    config.controlApiUrl,
    `/vp-schemas?name=${encodeURIComponent(name)}`,
  )

  const schema = page.items.find((item) => item.name === name)

  if (!schema) {
    throw new AppError('vp_schema_not_found', `No VP Schema named "${name}" in this tenant — see docs/schemas.md`, 500)
  }

  const verifierId = schema.verifiers[0]?.id

  if (!verifierId) {
    throw new AppError('no_verifier_attached', `VP Schema "${name}" has no Verifier attached to it`, 500)
  }

  return { vpSchemaId: schema.id, verifierId }
}
