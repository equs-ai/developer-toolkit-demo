import { config } from './app/config'
import { useSession } from './app/auth'
import { backendApi } from './app/backendApi'
import { useEmbeddedUi } from './integration/useEmbeddedUi'
import { issueToAnyWallet } from './integration/issueToAnyWallet'
import { Layout } from './ui/Layout'
import { Dashboard } from './ui/Dashboard'

export function App() {
  console.info(`Demo App version: ${APP_VERSION}`)

  useEmbeddedUi()

  const { user, logout } = useSession()

  return (
    <Layout userEmail={user.email} onLogout={logout}>
      <Dashboard
        userName={user.name}
        tenantSlug={config.tenantSlug}
        onIssueToAnyWallet={() => issueToAnyWallet({ id: user.id, email: user.email })}
        onAutoIssue={() => backendApi.createAutoOffer().then(({ uriId }) => uriId)}
        onCheckStatus={(offerId) => backendApi.getOffer(offerId).then(({ state }) => state)}
      />
    </Layout>
  )
}
