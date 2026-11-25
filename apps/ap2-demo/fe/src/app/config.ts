export const config = {
  beBaseUrl: import.meta.env.VITE_AP2_DEMO_BE_URL,
  tenantSlug: import.meta.env.VITE_TENANT_SLUG,
  connectorName: import.meta.env.VITE_CONNECTOR_NAME,
  kcAuthority: import.meta.env.VITE_KC_AUTHORITY,
  kcClientId: import.meta.env.VITE_KC_CLIENT_ID,
  ap2ConnectorUrl: import.meta.env.VITE_AP2_CONNECTOR_URL,
  shopUcpUrl: import.meta.env.VITE_SHOP_UCP_URL,
  credentialIssuerUrl: import.meta.env.VITE_CREDENTIAL_ISSUER_URL,
} as const
