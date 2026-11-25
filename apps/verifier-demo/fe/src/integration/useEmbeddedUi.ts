import { useEffect } from 'react'
import { cleanUpEmbeddedUi, initEmbeddedUi } from '@equs-ai/dtk-embedded-ui'
import { config } from '../app/config'

export function useEmbeddedUi() {
  useEffect(() => {
    initEmbeddedUi({
      tenant: config.tenantSlug,
      region: config.region,
      embedUiSsiOrigin: config.embedUiSsiOrigin,
    })

    return cleanUpEmbeddedUi
  }, [])
}
