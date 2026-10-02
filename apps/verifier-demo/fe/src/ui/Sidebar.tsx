import logoIcon from './assets/icons/logo.svg'
import dashboardIcon from './assets/icons/nav-dashboard.svg'
import applicationsIcon from './assets/icons/nav-applications.svg'
import userProfilesIcon from './assets/icons/nav-user-profiles.svg'
import documentsIcon from './assets/icons/nav-documents.svg'
import settingsIcon from './assets/icons/nav-settings.svg'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: dashboardIcon, active: false },
  { label: 'Applications', icon: applicationsIcon, active: false },
  { label: 'User profiles', icon: userProfilesIcon, active: false },
  { label: 'Documents', icon: documentsIcon, active: true },
  { label: 'Settings', icon: settingsIcon, active: false },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img className="sidebar__logo-icon" src={logoIcon} alt="" width={36} height={36} />
        <span className="sidebar__brand">Mortgage HUB</span>
      </div>
      <nav className="sidebar__nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <span
            key={item.label}
            className={item.active ? 'sidebar__nav-item sidebar__nav-item--active' : 'sidebar__nav-item'}
            aria-current={item.active ? 'page' : undefined}
          >
            <img className="icon" src={item.icon} alt="" width={24} height={24} />
            {item.label}
          </span>
        ))}
      </nav>
    </aside>
  )
}
