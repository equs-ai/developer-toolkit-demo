import { AccountMenu } from './AccountMenu'
import notificationsIcon from './assets/icons/notifications.svg'

type TopBarProps = {
  signedIn: boolean
  userEmail?: string
  onLogin: () => void
  onLogout: () => void
}

export function TopBar({ signedIn, userEmail, onLogin, onLogout }: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="button button--icon" type="button" aria-label="Notifications">
        <img className="icon" src={notificationsIcon} alt="" width={24} height={24} />
      </button>
      {signedIn ? (
        <AccountMenu userEmail={userEmail} onLogout={onLogout} />
      ) : (
        <button className="button button--brand" type="button" onClick={onLogin}>
          Log in
        </button>
      )}
    </header>
  )
}
