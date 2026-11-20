import { presentVCs } from '@equs-ai/dtk-embedded-ui'
import { backendApi } from '../app/backendApi'
import { config } from '../app/config'
import type { VerifyKycCallbacks } from '../app/types'

export function verifyKyc({ onVerified, onRejected, onError }: VerifyKycCallbacks): void {
  presentVCs({
    getReqUriAndTxId: () => backendApi.createRequest(),
    walletPlatform: ['mobile'],
    onReject: onRejected,
    onError,
    onSuccess: ({ authResponse, txId }) => {
      if (!authResponse) {
        onError(new Error('The wallet returned an empty authorization response'))
        return
      }

      backendApi
        .verify({ authResponse, txId, origin: config.embedUiSsiOrigin })
        .then(({ verifiedClaims }) => onVerified(verifiedClaims))
        .catch(onError)
    },
    // Also available, unused here: onLoading (iframe loading state), 
    // dcApiEnabled/dcApiSignedRequestEnabled (Digital Credentials API), 
    // hidePresentationOverview (skips the initial overview step), 
    // vpPurposeText (custom consent text), and skipPreAuth (for web wallet).
  })
}
