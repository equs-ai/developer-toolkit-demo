/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ISSUER_DEMO_BE_URL: string
  readonly VITE_TENANT_SLUG: string
  readonly VITE_KC_AUTHORITY: string
  readonly VITE_KC_CLIENT_ID: string
  readonly VITE_EMBED_UI_REGION?: 'us' | 'eu'
  readonly VITE_EMBED_UI_SSI_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const APP_VERSION: string
