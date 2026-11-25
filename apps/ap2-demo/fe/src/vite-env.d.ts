/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AP2_DEMO_BE_URL: string
  readonly VITE_TENANT_SLUG: string
  readonly VITE_CONNECTOR_NAME: string
  readonly VITE_KC_AUTHORITY: string
  readonly VITE_KC_CLIENT_ID: string
  readonly VITE_AP2_CONNECTOR_URL: string
  readonly VITE_SHOP_UCP_URL: string
  readonly VITE_CREDENTIAL_ISSUER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const APP_VERSION: string
