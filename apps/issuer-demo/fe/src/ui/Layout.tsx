import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import backlightCorner from './assets/icons/backlight-corner.svg'
import backlightBody from './assets/icons/backlight-body.svg'

type LayoutProps = {
  children: ReactNode
  userEmail?: string
  onLogout: () => void
}

export function Layout({ children, userEmail, onLogout }: LayoutProps) {
  return (
    <div className="app">
      <div className="backlight backlight--bottom-left" aria-hidden="true">
        <img src={backlightCorner} alt="" />
      </div>
      <div className="backlight backlight--top-right" aria-hidden="true">
        <img src={backlightCorner} alt="" />
      </div>

      <Sidebar />

      <div className="main">
        <TopBar userEmail={userEmail} onLogout={onLogout} />
        <div className="body-panel">
          <div className="backlight backlight--body" aria-hidden="true">
            <img src={backlightBody} alt="" />
          </div>
          <div className="body-panel__content">{children}</div>
        </div>
      </div>
    </div>
  )
}
