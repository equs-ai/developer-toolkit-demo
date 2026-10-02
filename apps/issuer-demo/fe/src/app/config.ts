export const config = {
  beBaseUrl: import.meta.env.VITE_ISSUER_DEMO_BE_URL,
  tenantSlug: import.meta.env.VITE_TENANT_SLUG,
  kcAuthority: import.meta.env.VITE_KC_AUTHORITY,
  kcClientId: import.meta.env.VITE_KC_CLIENT_ID,
  embedUiSsiOrigin: import.meta.env.VITE_EMBED_UI_SSI_ORIGIN,
} as const
