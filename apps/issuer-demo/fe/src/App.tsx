import { config } from './app/config'
import { useSession } from './app/auth'
import { backendApi } from './app/backendApi'
import { useEmbeddedUi } from './integration/useEmbeddedUi'
import { issueKycVc } from './integration/issueKycVc'
import { Layout } from './ui/Layout'
import { Dashboard } from './ui/Dashboard'

export function App() {
  console.info(`Demo App version: ${APP_VERSION}`)

  useEmbeddedUi()

  const { user, login, logout } = useSession()

  const handleIssueToWallet = () => issueKycVc(user && { id: user.id, email: user.email })

  const createAutoOffer = async () => {
    return (await backendApi.createAutoOffer()).uriId
  }

  const handleCheckStatus = (offerId: string) => backendApi.getOffer(offerId).then(({ state }) => state)

  return (
    <Layout signedIn={!!user} userEmail={user?.email} onLogin={login} onLogout={logout}>
      <Dashboard
        signedIn={!!user}
        userName={user?.name}
        tenantSlug={config.tenantSlug}
        onIssueToAnyWallet={handleIssueToWallet}
        onAutoIssue={user ? createAutoOffer : undefined}
        onCheckStatus={handleCheckStatus}
      />
    </Layout>
  )
}
