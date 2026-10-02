import { issueVC, type UserInfo } from '@equs-ai/dtk-embedded-ui'
import { backendApi } from '../app/backendApi'

export function issueToAnyWallet(userInfo: UserInfo): Promise<string> {
  const offer = backendApi.createOffer()

  issueVC({
    getCredentialOfferUri: async () => {
      const { uriId, byReference } = await offer
      return { refUri: byReference, uriId }
    },
    userInfo,
    internalWallet: { platform: ['mobile'], name: 'EQUS Wallet' },
    externalWallet: { supported: true, name: 'Other Wallet' },
    contactInfoOptions: { allowContactInput: false, prefillContactInfo: false },
    deliverTxCode: backendApi.deliverTxCode,
    // Also available, unused here: manualTxCode (emailed-code path for every wallet) and
    // webWalletMode (new tab vs. iframe, for web wallets).
  })

  return offer.then(({ uriId }) => uriId)
}
