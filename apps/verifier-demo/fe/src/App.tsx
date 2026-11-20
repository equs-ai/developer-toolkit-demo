import { useEmbeddedUi } from './integration/useEmbeddedUi'
import { verifyKyc } from './integration/verifyKyc'
import { Layout } from './ui/Layout'
import { VerifyPanel } from './ui/VerifyPanel'

export function App() {
  console.info(`Demo App version: ${APP_VERSION}`)
  
  useEmbeddedUi()

  return (
    <Layout>
      <VerifyPanel onPresentKyc={verifyKyc} />
    </Layout>
  )
}
