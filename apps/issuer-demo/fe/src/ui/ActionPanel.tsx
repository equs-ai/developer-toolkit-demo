import { useCallback, useId, useState } from 'react'
import type { IssuanceState } from '../app/types'
import infoIcon from './assets/icons/info.svg'

const ISSUE_TO_ANY_WALLET = {
  label: 'Issue KYC VC to any Wallet',
  clarification: 'Explicit issuance to any Wallet (supported 3rd party Wallet or EQUS Mobile Wallet) by scanning QR code.',
}

const AUTO_ISSUE = {
  label: 'Auto-issue KYC VC to EQUS Wallet',
  clarification:
    "Implicit issuance to EQUS Mobile Wallet only (offer and notifications will be sent to the Wallet). Can be triggered either as a user action like in this demo, or as a result of Tenant's internal business logic without user interaction.",
}

type ActionProps = {
  label: string
  clarification: string
  onClick: () => void
  disabled: boolean
}

function Action({ label, clarification, onClick, disabled }: ActionProps) {
  const tooltipId = useId()

  return (
    <div className="kyc-action">
      <button className="button button--brand" type="button" onClick={onClick} disabled={disabled} aria-busy={disabled}>
        {label}
      </button>
      <span className="kyc-action__info">
        <button className="kyc-action__info-trigger" type="button" aria-label={`About “${label}”`} aria-describedby={tooltipId}>
          <img className="icon" src={infoIcon} alt="" width={24} height={24} />
        </button>
        <span className="kyc-action__tooltip" id={tooltipId} role="tooltip">
          {clarification}
        </span>
      </span>
    </div>
  )
}

type FlowStatus = {
  tone: 'pending' | 'success' | 'error'
  text: string
}

type ActiveFlow = { status: 'active'; offerId: string; checking: boolean; state?: IssuanceState; error?: string }

type Flow = { status: 'idle' } | { status: 'starting' } | ActiveFlow | { status: 'failed'; text: string }

const WAITING: FlowStatus = { tone: 'pending', text: 'Waiting for you to accept the credential in your wallet…' }

const NOTES: Record<IssuanceState, FlowStatus> = {
  pending: { tone: 'pending', text: 'Not accepted yet. Finish it in the wallet, then check again.' },
  issued: { tone: 'success', text: 'The credential was issued to the wallet.' },
  accepted: { tone: 'success', text: 'The credential was accepted. It is in the wallet now.' },
  declined: { tone: 'error', text: 'The offer was declined in the wallet.' },
  neglected: { tone: 'error', text: 'The offer expired without being accepted.' },
  revoked: { tone: 'error', text: 'The credential was revoked.' },
  failed: { tone: 'error', text: 'Issuance failed.' },
  compromised: { tone: 'error', text: 'The credential was marked compromised.' },
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

const describe = (flow: Flow): FlowStatus | undefined => {
  switch (flow.status) {
    case 'starting':
      return { tone: 'pending', text: 'Creating the credential offer…' }
    case 'active':
      return flow.error ? { tone: 'error', text: flow.error } : flow.state ? NOTES[flow.state] : WAITING
    case 'failed':
      return { tone: 'error', text: flow.text }
    default:
      return undefined
  }
}

type ActionPanelProps = {
  onIssueToAnyWallet: () => Promise<string>
  onAutoIssue: () => Promise<string>
  onCheckStatus: (offerId: string) => Promise<IssuanceState>
  tenantSlug?: string
}

export function ActionPanel({ onIssueToAnyWallet, onAutoIssue, onCheckStatus, tenantSlug }: ActionPanelProps) {
  const [flow, setFlow] = useState<Flow>({ status: 'idle' })

  // Calls the handler in the same tick as the click: it may open a popup, and a browser only
  // permits that while it is still handling the user gesture.
  const begin = useCallback((createOffer: () => Promise<string>) => {
    setFlow({ status: 'starting' })

    createOffer().then(
      (offerId) => setFlow({ status: 'active', offerId, checking: false }),
      (error: unknown) => setFlow({ status: 'failed', text: message(error) })
    )
  }, [])

  const handleCheckStatus = useCallback(() => {
    if (flow.status !== 'active') return

    const { offerId } = flow

    const apply = (patch: Partial<ActiveFlow>) =>
      setFlow((current) =>
        current.status === 'active' && current.offerId === offerId ? { ...current, checking: false, ...patch } : current
      )

    setFlow((current) => (current.status === 'active' ? { ...current, checking: true, error: undefined } : current))

    onCheckStatus(offerId).then(
      (state) => apply({ state }),
      (error: unknown) => apply({ error: `Could not read the offer state. ${message(error)}` })
    )
  }, [flow, onCheckStatus])

  const handleDismiss = useCallback(() => setFlow({ status: 'idle' }), [])

  const settled = flow.status === 'active' && flow.state !== undefined && flow.state !== 'pending'
  const busy = flow.status === 'starting' || (flow.status === 'active' && !settled)
  const status = describe(flow)

  return (
    <section className="panel kyc-panel">
      <h2 className="panel__title">Re-usable KYC</h2>
      <div className="kyc-panel__actions">
        <Action {...ISSUE_TO_ANY_WALLET} onClick={() => begin(onIssueToAnyWallet)} disabled={busy} />
        <Action {...AUTO_ISSUE} onClick={() => begin(onAutoIssue)} disabled={busy} />
      </div>

      {tenantSlug && (
        <div className="kyc-tip">
          <img className="icon" src={infoIcon} alt="" width={24} height={24} />
          <p className="kyc-tip__text">
            Log in to the Mobile Wallet with the same credentials as here, under tenant <strong>{tenantSlug}</strong>.
          </p>
        </div>
      )}

      {status && (
        <div className={`kyc-status kyc-status--${status.tone}`} role="status" aria-live="polite">
          <span className="kyc-status__dot" aria-hidden="true" />
          <p className="kyc-status__text">{status.text}</p>
          {flow.status === 'active' && (
            <button
              className="kyc-status__action"
              type="button"
              onClick={handleCheckStatus}
              disabled={flow.checking}
              aria-busy={flow.checking}
            >
              {flow.checking ? 'Checking…' : 'Check status'}
            </button>
          )}
          <button className="kyc-status__action" type="button" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      )}
    </section>
  )
}
