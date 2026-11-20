import { useCallback, useEffect, useRef, useState } from 'react'
import { config } from '../app/config'
import type { Flow } from '../app/types'
import androidIcon from './assets/icons/android.svg'
import appleIcon from './assets/icons/apple.svg'
import closeIcon from './assets/icons/close-large.svg'
import infoCircleIcon from './assets/icons/info-circle.svg'

type Option = {
  flow: Flow
  label: string
  tooltip: string
  steps: React.ReactNode
}

const EUDI_ANDROID_APP = 'https://github.com/eu-digital-identity-wallet/eudi-app-android-wallet-ui'
const EUDI_IOS_APP = 'https://github.com/eu-digital-identity-wallet/eudi-app-ios-wallet-ui'

function IssuerDemo() {
  if (!config.issuerDemoUrl) {
    return <strong>Acme Bank</strong>
  }

  return (
    <a className="howto__link howto__link--inline" href={config.issuerDemoUrl} target="_blank" rel="noreferrer">
      Acme Bank
    </a>
  )
}

function AppLinks({ android, ios }: { android: string; ios: string }) {
  return (
    <span className="howto__links">
      <a className="howto__link" href={android} target="_blank" rel="noreferrer">
        <span className="howto__link-icon">
          <img src={androidIcon} alt="" width={20} height={12} />
        </span>
        Android
      </a>
      <a className="howto__link" href={ios} target="_blank" rel="noreferrer">
        <span className="howto__link-icon">
          <img src={appleIcon} alt="" width={24} height={24} />
        </span>
        iOS
      </a>
    </span>
  )
}

const OPTIONS: Option[] = [
  {
    flow: 'kyc',
    label: 'KYC VC from EQUS Wallet',
    tooltip: 'KYC Identity as an SD-JWT VC (dc+sd-jwt)',
    steps: (
      <ol className="howto__list">
        <li>
          Install the <strong>EQUS Wallet</strong>.
          <AppLinks android={config.walletAndroidUrl} ios={config.walletIosUrl} />
        </li>
        <li>
          Open the <IssuerDemo /> issuer demo and sign in.
        </li>
        <li>
          Issue yourself a <strong>KYC credential</strong> - scan the QR code with your EQUS wallet, or have it pushed straight to the
          wallet.
        </li>
        <li>
          Press <strong>Continue</strong> below and scan the QR code with that wallet.
        </li>
        <li>
          Approve the request. This demo asks only for <strong>Full name</strong>, <strong>Date of birth</strong> and{' '}
          <strong>Verification date</strong>; everything else in the credential stays in the wallet.
        </li>
      </ol>
    ),
  },
  {
    flow: 'pid',
    label: 'PID VC from EUDI Wallet',
    tooltip: 'PID as an SD-JWT VC (dc+sd-jwt) or an mdoc (mso_mdoc)',
    steps: (
      <ol className="howto__list">
        <li>
          Install the <strong>EUDI Wallet reference app</strong> - the non-production one. A production wallet trusts a different set of
          certificates and will not work with this demo.
          <AppLinks android={EUDI_ANDROID_APP} ios={EUDI_IOS_APP} />
        </li>
        <li>
          Issue yourself a <strong>PID</strong> in the wallet, from the reference PID issuer, in either format (SD-JWT or mdoc). In the
          wallet, click on <strong>“Add document”</strong> and then <strong>“From list”</strong>. Select the PID from the list and proceed
          with the instructions.
        </li>
        <li>
          Press <strong>Continue</strong> below and scan the QR code with that wallet.
        </li>
        <li>
          Approve the request. This demo asks only for <strong>Given name</strong> and <strong>Family name</strong>; everything else in the
          PID stays in the wallet.
        </li>
      </ol>
    ),
  },
]

type PresentPickerProps = {
  loading: boolean
  onChoose: (flow: Flow) => void
  onClose: () => void
}

export function PresentPicker({ loading, onChoose, onClose }: PresentPickerProps) {
  const [selected, setSelected] = useState<Flow>('kyc')
  const panelRef = useRef<HTMLDivElement>(null)

  const dismiss = useCallback(() => {
    if (!loading) onClose()
  }, [loading, onClose])

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dismiss])

  const confirm = useCallback(() => {
    onChoose(selected)
  }, [onChoose, selected])

  const option = OPTIONS.find(({ flow }) => flow === selected)

  return (
    <div className="picker" onClick={dismiss}>
      <div
        className="picker__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        tabIndex={-1}
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="picker__close" type="button" onClick={dismiss} disabled={loading} aria-label="Close">
          <img src={closeIcon} alt="" width={24} height={24} />
        </button>

        <div className="picker__header">
          <h2 className="picker__title" id="picker-title">
            Present KYC VC from the Wallet
          </h2>
          <p className="picker__subtitle">Pick a wallet to continue</p>
        </div>

        <div className="picker__options" role="radiogroup" aria-labelledby="picker-title">
          {OPTIONS.map(({ flow, label, tooltip }) => (
            <label className={flow === selected ? 'option option--selected' : 'option'} key={flow}>
              <input
                className="option__radio"
                type="radio"
                name="present-flow"
                value={flow}
                checked={flow === selected}
                onChange={() => setSelected(flow)}
              />
              <span className="option__label">{label}</span>
              <span className="option__info" tabIndex={0} role="note" aria-label={tooltip}>
                <img src={infoCircleIcon} alt="" width={24} height={24} />
                <span className="option__tooltip">{tooltip}</span>
              </span>
            </label>
          ))}
        </div>

        <section className="howto">
          <h3 className="howto__title">How to set up wallet for this?</h3>
          <div className="howto__body">{option?.steps}</div>
        </section>

        <div className="picker__actions">
          <button className="btn btn--neutral" type="button" onClick={dismiss} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn--primary" type="button" onClick={confirm} disabled={loading} aria-busy={loading}>
            {loading ? <span className="spinner" role="status" aria-label="Loading" /> : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
