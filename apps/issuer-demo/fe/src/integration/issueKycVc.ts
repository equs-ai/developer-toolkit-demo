import {
  issueVC,
  type AuthorizationCodeIssueVcOptions,
  type IssueVcOptions,
  type PreAuthorizedCodeIssueVcOptions,
  type UserInfo,
} from '@equs-ai/dtk-embedded-ui'
import { backendApi } from '../app/backendApi'
import type { CreateOfferResponse } from '../app/types'

const WALLETS = {
  internalWallet: { platform: ['mobile'], name: 'EQUS Wallet' },
  externalWallet: { supported: true, name: 'Other Wallet' },
} satisfies Pick<IssueVcOptions, 'internalWallet' | 'externalWallet'>

// Signed in: a pre-authorized code offer for this user. Signed out: an authorization code offer, and
// the holder signs in with the bank from their wallet, so who they are is settled at issuance.
export function issueKycVc(user?: UserInfo): Promise<string> {
  const offer = user ? backendApi.createOffer() : backendApi.createAuthCodeOffer()

  issueVC(user ? preAuthorizedCodeOptions(offer, user) : authorizationCodeOptions(offer))

  return offer.then(({ uriId }) => uriId)
}

function preAuthorizedCodeOptions(offer: Promise<CreateOfferResponse>, user: UserInfo): PreAuthorizedCodeIssueVcOptions {
  return {
    getCredentialOfferUri: () => toOfferUri(offer),
    ...WALLETS,
    userInfo: user,
    contactInfoOptions: { allowContactInput: false, prefillContactInfo: false },
    deliverTxCode: backendApi.deliverTxCode,
    // Also available, unused here: webWalletMode (new tab vs. iframe, for web wallets).
  }
}

function authorizationCodeOptions(offer: Promise<CreateOfferResponse>): AuthorizationCodeIssueVcOptions {
  return { flow: 'authorization_code', getCredentialOfferUri: () => toOfferUri(offer), ...WALLETS }
}

async function toOfferUri(offer: Promise<CreateOfferResponse>) {
  const { uriId, byReference } = await offer
  return { refUri: byReference, uriId }
}
