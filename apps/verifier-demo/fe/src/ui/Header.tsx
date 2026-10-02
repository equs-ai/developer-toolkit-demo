import searchIcon from './assets/icons/search.svg'
import notificationsIcon from './assets/icons/notifications.svg'
import avatarIcon from './assets/icons/avatar.svg'

export function Header() {
  return (
    <header className="header">
      <div className="header__search">
        <img className="icon" src={searchIcon} alt="" width={24} height={24} />
        <input className="header__search-input" type="search" placeholder="Search documents..." aria-label="Search documents" readOnly />
      </div>
      <div className="header__actions">
        <button className="header__icon-button" type="button" aria-label="Notifications">
          <img className="icon" src={notificationsIcon} alt="" width={24} height={24} />
        </button>
        <button className="header__avatar" type="button" aria-label="Account">
          <img className="icon" src={avatarIcon} alt="" width={24} height={24} />
          <span className="header__avatar-badge" />
        </button>
      </div>
    </header>
  )
}
