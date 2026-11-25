import type { ReactNode } from 'react'

type LayoutProps = {
  connectorName: string
  isConnected: boolean
  /** Who the connector is connected as, when the sign-in gave a name */
  connectedAs?: string
  onDisconnect: () => void
  children: ReactNode
}

export function Layout({ connectorName, isConnected, connectedAs, onDisconnect, children }: LayoutProps) {
  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="topbar-title">Agent payments</h1>
          <p className="topbar-subtitle">An AI assistant shops; it buys only what you approve in your wallet.</p>
        </div>
        {isConnected && (
          <div className="topbar-session">
            <span>
              {connectorName}: {connectedAs ?? 'connected'}
            </span>
            <button type="button" className="button button-secondary button-small" onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        )}
      </header>
      <main className="columns">{children}</main>
    </div>
  )
}
