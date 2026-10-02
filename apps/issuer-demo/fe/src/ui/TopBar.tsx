import { AccountMenu } from './AccountMenu'
import notificationsIcon from './assets/icons/notifications.svg'

type TopBarProps = {
  userEmail?: string
  onLogout: () => void
}

export function TopBar({ userEmail, onLogout }: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="button button--icon" type="button" aria-label="Notifications">
        <img className="icon" src={notificationsIcon} alt="" width={24} height={24} />
      </button>
      <AccountMenu userEmail={userEmail} onLogout={onLogout} />
    </header>
  )
}
