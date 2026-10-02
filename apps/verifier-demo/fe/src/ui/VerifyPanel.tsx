import { useCallback, useState } from 'react'
import type { VerifyKycCallbacks } from '../app/types'
import fileUploadIcon from './assets/icons/file-upload.svg'
import infoIcon from './assets/icons/info.svg'
import walletIcon from './assets/icons/wallet.svg'

type VerifyStatus = 'idle' | 'pending' | 'success' | 'rejected' | 'error'

type Notice = {
  tone: 'info' | 'success' | 'error'
  text: string
  dismissLabel: string
}

const notices: Record<Exclude<VerifyStatus, 'idle'>, Notice> = {
  pending: {
    tone: 'info',
    text: 'Waiting for the credential to be presented from the wallet…',
    dismissLabel: 'Reset',
  },
  success: {
    tone: 'success',
    text: 'KYC credential verified. The disclosed claims are in the browser console.',
    dismissLabel: 'Start over',
  },
  rejected: {
    tone: 'error',
    text: 'The request was declined in the wallet. Nothing was shared.',
    dismissLabel: 'Start over',
  },
  error: {
    tone: 'error',
    text: 'Verification failed. See the browser console for details.',
    dismissLabel: 'Start over',
  },
}

type VerifyPanelProps = {
  onPresentKyc: (callbacks: VerifyKycCallbacks) => void
}

export function VerifyPanel({ onPresentKyc }: VerifyPanelProps) {
  const [status, setStatus] = useState<VerifyStatus>('idle')

  // Calls the handler in the same tick as the click: it may open a popup, and a browser only
  // permits that while it is still handling the user gesture.
  const handlePresentKyc = useCallback(() => {
    setStatus('pending')

    onPresentKyc({
      onVerified: (verifiedClaims) => {
        console.log('Verified claims', verifiedClaims)
        setStatus('success')
      },
      onRejected: () => setStatus('rejected'),
      onError: (error) => {
        console.error('KYC verification failed', error)
        setStatus('error')
      },
    })
  }, [onPresentKyc])

  const handleDismiss = useCallback(() => setStatus('idle'), [])

  const busy = status === 'pending'
  const notice = status === 'idle' ? null : notices[status]

  return (
    <main className="content">
      <div className={notice && notice.tone !== 'info' ? `banner banner--${notice.tone}` : 'banner'} aria-live="polite">
        <img className="icon" src={infoIcon} alt="" width={24} height={24} />
        {notice === null ? (
          <p className="banner__text">
            This is a demo app. Click “<strong>Present KYC VC from the Wallet”</strong> to trigger the flow
          </p>
        ) : (
          <>
            <p className="banner__text">{notice.text}</p>
            <button className="banner__action" type="button" onClick={handleDismiss}>
              {notice.dismissLabel}
            </button>
          </>
        )}
      </div>

      <h1 className="content__title">Documents</h1>

      <div className="cards">
        <div className="card card--upload">
          <span className="card__icon">
            <img className="icon" src={fileUploadIcon} alt="" width={24} height={24} />
          </span>
          <span className="card__text">
            <span className="card__title">Upload Documents</span>
            <span className="card__description">Upload your verification documents directly</span>
          </span>
        </div>

        <button className="card card--present" type="button" onClick={handlePresentKyc} disabled={busy} aria-busy={busy}>
          <span className="card__icon">
            <img className="icon" src={walletIcon} alt="" width={24} height={24} />
          </span>
          <span className="card__text">
            <span className="card__title">Present KYC VC from the Wallet</span>
            <span className="card__description">Share your verified credentials from your digital wallet</span>
          </span>
        </button>
      </div>
    </main>
  )
}
