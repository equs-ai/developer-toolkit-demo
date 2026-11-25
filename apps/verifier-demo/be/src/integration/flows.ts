/**
 * The two presentations this demo can ask for.
 *
 * `kyc` runs against the did:web Verifier and the credential the issuer demo issues.
 *
 * `pid` runs against the x509 Verifier, because an EU Digital Identity Wallet will not answer a
 * Verifier it cannot identify by certificate. Its schema accepts the PID as either an SD-JWT VC or
 * an mdoc, through a credential set. See docs/eudi-wallet.md and docs/schemas.md.
 */
export type Flow = 'kyc' | 'pid'

export const FLOWS = ['kyc', 'pid'] as const

export const FLOW_SCHEMA_NAMES: Record<Flow, string> = {
  kyc: 'KYC Basic VP',
  pid: 'PID VP',
}
