import { presentVCs } from '@equs-ai/dtk-embedded-ui'
import { backendApi } from '../app/backendApi'
import { config } from '../app/config'
import type { Flow, PresentCallbacks } from '../app/types'

export function presentCredential(flow: Flow, { onVerified, onRejected, onError, onLoading }: PresentCallbacks): void {
  presentVCs({
    getReqUriAndTxId: () => backendApi.createRequest(flow),
    walletPlatform: ['mobile'],
    // Presentation Flow 1 where the DC API is available, Flow 2 otherwise. Needs 'dcApi' in the backend modes:
    // dcApiEnabled: true,
    onLoading,
    onReject: onRejected,
    onError,
    onSuccess: ({ authResponse, txId }) => {
      if (!authResponse) {
        onError(new Error('The wallet returned an empty authorization response'))
        return
      }

      backendApi
        .verify({ authResponse, txId, origin: config.embedUiSsiOrigin, flow })
        .then(() => onVerified())
        .catch(onError)
    },
    // Also available, unused here:
    // dcApiSignedRequestEnabled (Digital Credentials API),
    // hidePresentationOverview (skips the initial overview step),
    // vpPurposeText (custom consent text), and skipPreAuth (for web wallet).
  })
}
