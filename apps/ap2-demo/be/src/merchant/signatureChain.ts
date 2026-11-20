import { createHash, ECDH } from 'node:crypto'
import { compactVerify, decodeProtectedHeader, importJWK, type JWK } from 'jose'

const ES256 = 'ES256'

type Json = Record<string, unknown>

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const isJwk = (v: unknown): v is JWK => isObj(v) && typeof v.kty === 'string'
const sha = (s: string) => createHash('sha256').update(s).digest('base64url')
const payloadOf = (jwt: string): Json => JSON.parse(Buffer.from(jwt.split('.')[1] ?? '', 'base64url').toString('utf8'))
const isJwt = (s: string) => s.split('.').length === 3

function didWebUrl(did: string): string {
  const [host = '', ...path] = did.slice('did:web:'.length).split(':').map(decodeURIComponent)
  // A domain (port percent-encoded) and plain path segments only: nothing may change the URL's
  // authority (`@`, `/`, `?`, `#`) or climb out of the path (`..`)
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host) || path.some((segment) => !/^[\w.~-]+$/.test(segment) || /^\.+$/.test(segment))) {
    throw new Error('malformed did:web')
  }
  const scheme = /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https'
  return `${scheme}://${host}/${path.length ? path.join('/') : '.well-known'}/did.json`
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58(s: string): Buffer {
  let n = 0n
  for (const c of s) {
    const v = B58.indexOf(c)
    if (v < 0) throw new Error('bad base58')
    n = n * 58n + BigInt(v)
  }
  const hex = n.toString(16)
  const body = Buffer.from(hex.length % 2 ? `0${hex}` : hex, 'hex')
  const zeros = s.length - s.replace(/^1+/, '').length
  return Buffer.concat([Buffer.alloc(zeros), body])
}

function multibaseP256(mb: string): JWK {
  if (!mb.startsWith('z')) throw new Error('unsupported multibase')
  const bytes = base58(mb.slice(1))
  if (bytes[0] !== 0x80 || bytes[1] !== 0x24) throw new Error('not a P-256 multikey')
  const point = ECDH.convertKey(bytes.subarray(2), 'prime256v1', undefined, undefined, 'uncompressed') as Buffer
  return {
    kty: 'EC',
    crv: 'P-256',
    x: point.subarray(1, 33).toString('base64url'),
    y: point.subarray(33, 65).toString('base64url'),
  }
}

const DID_FETCH_TIMEOUT_MS = 5000
const DID_DOC_MAX_BYTES = 64 * 1024
const DID_CACHE_MAX = 50
const didCache = new Map<string, Json>()

async function readDidDocument(res: Response): Promise<Json> {
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of res.body ?? []) {
    size += chunk.length
    if (size > DID_DOC_MAX_BYTES) throw new Error('DID document too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Json
}

async function resolveDid(did: string): Promise<Json> {
  const cached = didCache.get(did)
  if (cached) return cached

  const res = await fetch(didWebUrl(did), { redirect: 'error', signal: AbortSignal.timeout(DID_FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`did:web resolution failed (${res.status})`)
  const doc = await readDidDocument(res)
  if (didCache.size >= DID_CACHE_MAX) didCache.clear()
  didCache.set(did, doc)

  return doc
}

// The DID comes from the artifact, before anything in it is verified: only a listed issuer is ever fetched
async function issuerKey(kid: string, trustedIssuers: readonly string[]): Promise<JWK> {
  const did = kid.split('#')[0] ?? ''
  if (!trustedIssuers.includes(did)) throw new Error('the presented credential is not from a trusted issuer')
  const doc = await resolveDid(did)
  const methods = Array.isArray(doc.verificationMethod) ? doc.verificationMethod.filter(isObj) : []
  const fragment = kid.split('#')[1]
  const vm = methods.find((m) => m.id === kid || String(m.id).endsWith(`#${fragment}`))
  if (vm && isJwk(vm.publicKeyJwk)) return vm.publicKeyJwk
  if (vm && typeof vm.publicKeyMultibase === 'string') return multibaseP256(vm.publicKeyMultibase)
  throw new Error(`key ${kid} not in the issuer's DID document`)
}

// Every key in the chain is P-256; the header's alg is never trusted
async function verifyWith(jwt: string, jwk: JWK, what: string): Promise<void> {
  const key = await importJWK({ ...jwk, alg: ES256 }, ES256)
  await compactVerify(jwt, key, { algorithms: [ES256] }).catch(() => {
    throw new Error(`${what}: bad signature`)
  })
}

function delegatedKey(disclosures: unknown[]): JWK | undefined {
  let found: JWK | undefined
  const walk = (v: unknown): void => {
    if (found) return
    if (Array.isArray(v)) return v.forEach(walk)
    if (!isObj(v)) return
    if (isObj(v.cnf) && isJwk(v.cnf.jwk)) {
      found = v.cnf.jwk
      return
    }
    Object.values(v).forEach(walk)
  }
  walk(disclosures)
  return found
}

const decode = (disclosure: string): unknown => JSON.parse(Buffer.from(disclosure, 'base64url').toString('utf8'))

const sameDigests = (disclosed: string[], digests: unknown[]): boolean => {
  const got = disclosed.map(sha).sort()
  const want = digests.map(String).sort()
  return got.length === want.length && got.every((digest, i) => digest === want[i])
}

/** What the chain proved: the card, its disclosures, and per hop the disclosures that hop signed. */
export type VerifiedChain = {
  checks: string[]
  card: Json
  cardDisclosures: unknown[]
  hops: unknown[][]
}

/**
 * Splits `issuer~disclosures~~kb1~disclosures~~kb2~disclosures~` strictly: every segment must be
 * consumed by the issuer JWT, a card disclosure, a hop or a hop's disclosure. An empty segment is
 * allowed only where the wallet puts one: closing a disclosure group before the next hop, and at the
 * end. Anything else is an unsigned add-on and fails the chain.
 */
export async function verifyChain(artifact: string, trustedIssuers: readonly string[]): Promise<VerifiedChain> {
  const checks: string[] = []
  const raw = artifact.split('~')
  if (raw.length > 1 && raw[raw.length - 1] === '') raw.pop()
  const misplaced = raw.some((part, k) => !part && (k === 0 || !raw[k - 1] || !isJwt(raw[k + 1] ?? '')))
  if (misplaced) throw new Error('artifact has an empty segment inside the chain')
  const parts = raw.filter(Boolean)

  const issuerJwt = parts[0] ?? ''
  if (!isJwt(issuerJwt)) throw new Error('artifact does not start with an issuer JWT')

  const kid = decodeProtectedHeader(issuerJwt).kid
  if (!kid) throw new Error('issuer JWT has no kid')
  await verifyWith(issuerJwt, await issuerKey(kid, trustedIssuers), 'issuer JWT')
  const card = payloadOf(issuerJwt)
  if (card.iss !== kid.split('#')[0]) throw new Error('card iss is not the DID that signed it')
  const now = Math.floor(Date.now() / 1000)
  if (typeof card.exp === 'number' && card.exp < now) throw new Error('card expired')
  if (typeof card.nbf === 'number' && card.nbf > now) throw new Error('card not yet valid')
  // Digests below are SHA-256; RFC 9901 §4.1.1: absent _sd_alg means sha-256
  if (card._sd_alg !== undefined && card._sd_alg !== 'sha-256') {
    throw new Error('unsupported _sd_alg')
  }
  checks.push(`card signed by issuer ${String(card.iss).slice(0, 48)}…`)

  let i = 1
  const cardParts: string[] = []
  for (; i < parts.length && !isJwt(parts[i] ?? ''); i++) cardParts.push(parts[i] ?? '')
  const sd = Array.isArray(card._sd) ? card._sd.map(String) : []
  if (!cardParts.every((part) => sd.includes(sha(part))) || new Set(cardParts).size !== cardParts.length) {
    throw new Error('card disclosure not covered by the issuer signature')
  }
  checks.push("card disclosures match the issuer's digests")

  let key = isObj(card.cnf) && isJwk(card.cnf.jwk) ? card.cnf.jwk : undefined
  let previousJwt = issuerJwt
  const hops: unknown[][] = []
  while (i < parts.length) {
    const kb = parts[i++] ?? ''
    const hop = hops.length + 1
    const signer = hop === 1 ? 'holder (card key)' : 'agent (key the user delegated to)'
    if (!key) throw new Error(`hop ${hop}: no key to verify with`)
    await verifyWith(kb, key, `hop ${hop}`)
    const body = payloadOf(kb)
    if (typeof body.exp === 'number' && body.exp < now) throw new Error(`hop ${hop}: expired`)
    if (body.issuer_jwt_hash !== sha(previousJwt)) {
      throw new Error(`hop ${hop}: not bound to the previous hop`)
    }
    const digests = (Array.isArray(body.delegate_payload) ? body.delegate_payload : []).filter(isObj).map((d) => d['...'])
    const disclosed: string[] = []
    for (; i < parts.length && !isJwt(parts[i] ?? ''); i++) disclosed.push(parts[i] ?? '')
    if (!sameDigests(disclosed, digests)) {
      throw new Error(`hop ${hop}: mandates do not match what was signed`)
    }
    checks.push(`hop ${hop} signed by the ${signer}, bound to hop ${hop - 1}, covers its ${disclosed.length} mandates`)
    const decoded = disclosed.map(decode)
    hops.push(decoded)
    key = delegatedKey(decoded) ?? key
    previousJwt = kb
  }
  if (!hops.length) throw new Error('no key-binding hop: the holder did not sign anything')

  return { checks, card, cardDisclosures: cardParts.map(decode), hops }
}
