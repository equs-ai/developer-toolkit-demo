export const config = {
  beBaseUrl: import.meta.env.VITE_VERIFIER_DEMO_BE_URL,
  tenantSlug: import.meta.env.VITE_TENANT_SLUG,
  embedUiSsiOrigin: import.meta.env.VITE_EMBED_UI_SSI_ORIGIN,
} as const
