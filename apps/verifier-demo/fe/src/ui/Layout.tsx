import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="body-panel">
          <Header />
          {children}
        </div>
      </div>
    </div>
  )
}
