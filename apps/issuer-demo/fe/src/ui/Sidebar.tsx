import logoIcon from './assets/icons/logo.svg'
import dashboardIcon from './assets/icons/nav-dashboard.svg'
import transactionsIcon from './assets/icons/nav-transactions.svg'
import analyticsIcon from './assets/icons/nav-analytics.svg'
import historyIcon from './assets/icons/nav-history.svg'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: dashboardIcon, active: true },
  { label: 'Transactions', icon: transactionsIcon, active: false },
  { label: 'Analytics', icon: analyticsIcon, active: false },
  { label: 'History', icon: historyIcon, active: false },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img className="sidebar__logo-icon" src={logoIcon} alt="" width={36} height={36} />
        <span className="sidebar__brand">Acme Bank</span>
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
