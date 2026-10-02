import { BalanceCard } from './BalanceCard'
import { ActionPanel } from './ActionPanel'
import { SpendingAnalytics } from './SpendingAnalytics'
import { LastTransactions } from './LastTransactions'
import type { IssuanceState } from '../app/types'
import infoIcon from './assets/icons/info.svg'

type DashboardProps = {
  onIssueToAnyWallet: () => Promise<string>
  onAutoIssue: () => Promise<string>
  onCheckStatus: (offerId: string) => Promise<IssuanceState>
  userName?: string
  tenantSlug?: string
}

export function Dashboard({ onIssueToAnyWallet, onAutoIssue, onCheckStatus, userName, tenantSlug }: DashboardProps) {
  return (
    <main className="dashboard">
      <div className="body-panel__header">
        <h1 className="welcome">Welcome back, {userName ?? 'user'}</h1>
        <div className="notice">
          <img className="icon" src={infoIcon} alt="" width={24} height={24} />
          <p className="notice__text">
            This is a demo app. Click “<strong>Issue KYC VC to any Wallet”</strong> to trigger the flow
          </p>
        </div>
      </div>

      <div className="cards">
        <BalanceCard />
        <ActionPanel
          onIssueToAnyWallet={onIssueToAnyWallet}
          onAutoIssue={onAutoIssue}
          onCheckStatus={onCheckStatus}
          tenantSlug={tenantSlug}
        />
      </div>

      <div className="section">
        <SpendingAnalytics />
      </div>

      <div className="section section--last">
        <LastTransactions />
      </div>
    </main>
  )
}
