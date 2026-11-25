import { randomUUID } from 'node:crypto'
import { exportJWK, generateKeyPair, type JWK } from 'jose'

/** The shop's signing key, generated at startup and published in its UCP profile. */

export const SIGNING_ALG = 'ES256'

const key = generateKeyPair(SIGNING_ALG, { extractable: true }).then(async ({ privateKey, publicKey }) => ({
  privateKey,
  jwk: { ...(await exportJWK(publicKey)), kid: randomUUID(), alg: SIGNING_ALG, use: 'sig' } satisfies JWK,
}))

export const signingKey = () => key
