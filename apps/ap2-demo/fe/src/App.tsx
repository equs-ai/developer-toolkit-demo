import { config } from './app/config'
import { guidePrompts } from './app/prompts'
import { usePurchaseChat } from './app/usePurchaseChat'
import { useBankSession } from './integration/bankSignIn'
import { ChatPanel } from './ui/ChatPanel'
import { GuidePanel } from './ui/GuidePanel'
import { Layout } from './ui/Layout'

export function App() {
  console.info(`Demo App version: ${APP_VERSION}`)

  const bank = useBankSession()
  const chat = usePurchaseChat(bank)

  return (
    <Layout connectorName={config.connectorName} isConnected={bank.isConnected} connectedAs={bank.userName} onDisconnect={bank.disconnect}>
      <ChatPanel
        items={chat.items}
        replies={chat.replies}
        isRunning={chat.isRunning}
        signInError={bank.error}
        onStart={chat.start}
        onReply={chat.choose}
      />
      <GuidePanel
        connectorName={config.connectorName}
        connectorUrl={config.ap2ConnectorUrl}
        shopUcpUrl={config.shopUcpUrl}
        credentialIssuerUrl={config.credentialIssuerUrl || undefined}
        prompts={guidePrompts(config.connectorName, config.shopUcpUrl)}
      />
    </Layout>
  )
}
