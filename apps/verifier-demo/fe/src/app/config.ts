const DEFAULT_WALLET_IOS_URL = 'https://testflight.apple.com/join/uHJjbwue'
const DEFAULT_WALLET_ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.equs.wallet'

export const config = {
  beBaseUrl: import.meta.env.VITE_VERIFIER_DEMO_BE_URL,
  tenantSlug: import.meta.env.VITE_TENANT_SLUG,
  region: import.meta.env.VITE_EMBED_UI_REGION,
  embedUiSsiOrigin: import.meta.env.VITE_EMBED_UI_SSI_ORIGIN,
  issuerDemoUrl: import.meta.env.VITE_ISSUER_DEMO_URL,
  walletIosUrl: import.meta.env.VITE_WALLET_IOS_URL || DEFAULT_WALLET_IOS_URL,
  walletAndroidUrl: import.meta.env.VITE_WALLET_ANDROID_URL || DEFAULT_WALLET_ANDROID_URL,
} as const
