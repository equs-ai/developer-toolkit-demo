import logoIcon from './assets/icons/logo.svg'

type SplashScreenProps = {
  message: string
  error?: string
  onRetry?: () => void
}

export function SplashScreen({ message, error, onRetry }: SplashScreenProps) {
  return (
    <div className="splash">
      <div className="splash__panel" role="status" aria-live="polite">
        <img className="splash__logo" src={logoIcon} alt="" width={36} height={36} />
        <p className="splash__message">{message}</p>
        {error && <p className="splash__error">{error}</p>}
        {onRetry && (
          <button className="button button--brand" type="button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
