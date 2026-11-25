/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERIFIER_DEMO_BE_URL: string
  readonly VITE_TENANT_SLUG: string
  readonly VITE_EMBED_UI_REGION?: 'us' | 'eu'
  readonly VITE_EMBED_UI_SSI_ORIGIN?: string
  readonly VITE_ISSUER_DEMO_URL?: string
  readonly VITE_WALLET_IOS_URL?: string
  readonly VITE_WALLET_ANDROID_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const APP_VERSION: string
