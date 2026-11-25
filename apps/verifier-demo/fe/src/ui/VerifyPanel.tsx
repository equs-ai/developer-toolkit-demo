import { useCallback, useState } from 'react'
import type { Flow, PresentCallbacks } from '../app/types'
import { PresentPicker } from './PresentPicker'
import fileUploadIcon from './assets/icons/file-upload.svg'
import infoIcon from './assets/icons/info.svg'
import walletIcon from './assets/icons/wallet.svg'

type VerifyStatus = 'idle' | 'pending' | 'success' | 'rejected' | 'error'

type Notice = {
  tone: 'info' | 'success' | 'error'
  text: string
  dismissLabel: string
}

const flowLabels: Record<Flow, string> = {
  kyc: 'KYC credential',
  pid: 'PID',
}

const noticeFor = (status: Exclude<VerifyStatus, 'idle'>, flow: Flow): Notice => {
  const label = flowLabels[flow]

  switch (status) {
    case 'pending':
      return { tone: 'info', text: `Waiting for the ${label} to be presented from the wallet…`, dismissLabel: 'Reset' }
    case 'success':
      return {
        tone: 'success',
        text: `${label} verified. Thank you, Mortgage HUB has received the details you shared.`,
        dismissLabel: 'Start over',
      }
    case 'rejected':
      return { tone: 'error', text: 'The request was declined in the wallet. Nothing was shared.', dismissLabel: 'Start over' }
    case 'error':
      return { tone: 'error', text: 'Verification failed. See the browser console for details.', dismissLabel: 'Start over' }
  }
}

type VerifyPanelProps = {
  onPresent: (flow: Flow, callbacks: PresentCallbacks) => void
}

export function VerifyPanel({ onPresent }: VerifyPanelProps) {
  const [status, setStatus] = useState<VerifyStatus>('idle')
  const [flow, setFlow] = useState<Flow>('kyc')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [embedLoading, setEmbedLoading] = useState(false)

  const closePicker = useCallback(() => {
    setEmbedLoading(false)
    setPickerOpen(false)
  }, [])

  // Calls the handler in the same tick as the click: it may open a popup, and a browser only
  // permits that while it is still handling the user gesture.
  const handlePresent = useCallback(
    (next: Flow) => {
      setFlow(next)
      setStatus('pending')
      setEmbedLoading(true)

      onPresent(next, {
        onLoading: (loading) => {
          if (!loading) closePicker()
        },
        onVerified: () => {
          setStatus('success')
        },
        onRejected: () => {
          closePicker()
          setStatus('rejected')
        },
        onError: (error) => {
          console.error('Verification failed', error)
          closePicker()
          setStatus('error')
        },
      })
    },
    [onPresent, closePicker]
  )

  const handleDismiss = useCallback(() => setStatus('idle'), [])

  const busy = status === 'pending'
  const notice = status === 'idle' ? null : noticeFor(status, flow)

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

        <button className="card card--present" type="button" onClick={() => setPickerOpen(true)} disabled={busy} aria-busy={busy}>
          <span className="card__icon">
            <img className="icon" src={walletIcon} alt="" width={24} height={24} />
          </span>
          <span className="card__text">
            <span className="card__title">Present KYC VC from the Wallet</span>
            <span className="card__description">Share your verified credentials from your digital wallet</span>
          </span>
        </button>
      </div>

      {pickerOpen && <PresentPicker loading={embedLoading} onChoose={handlePresent} onClose={closePicker} />}
    </main>
  )
}
