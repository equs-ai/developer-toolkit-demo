import { useCallback, useEffect, useRef } from 'react'
import { WebStorageStateStore } from 'oidc-client-ts'
import { useAuth, type AuthProviderProps } from 'react-oidc-context'
import { config } from '../app/config'

/**
 * Connecting the AP2 connector: the user signs in to DTK's users realm through the Tenant's own identity
 * provider (`kc_idp_hint` = the tenant slug), the same login an AI assistant goes through when the
 * user adds the AP2 connector. The access token is what the AP2 connector accepts as this user.
 */

const KEYCLOAK_URL_PARAMS = ['state', 'iss', 'session_state', 'code', 'kc_idp_hint', 'error', 'error_description']

const clearKeycloakParams = () => {
  const params = new URLSearchParams(window.location.search)
  KEYCLOAK_URL_PARAMS.forEach((param) => params.delete(param))

  const query = params.toString() ? `?${params.toString()}` : ''
  window.history.replaceState({}, document.title, window.location.pathname.concat(query))
}

export const oidcConfig: AuthProviderProps = {
  authority: config.kcAuthority,
  client_id: config.kcClientId,
  redirect_uri: `${window.location.origin}/`,
  scope: 'openid profile email',
  extraQueryParams: { kc_idp_hint: config.tenantSlug },
  userStore: new WebStorageStateStore({ store: localStorage }),
  onSigninCallback: clearKeycloakParams,
}

let accessToken: string | undefined

export const getAccessToken = () => accessToken

export interface BankSession {
  isConnected: boolean
  userName?: string
  /** Why the last sign-in failed, if it did */
  error?: string
  connect: () => void
  disconnect: () => void
}

/** The connector connection, for the chat to ask for and to show. Unlike the issuer demo, signing in is not required to see the page. */
export const useBankSession = (): BankSession => {
  const auth = useAuth()
  const profile = auth.user?.profile

  const latestAuth = useRef(auth)
  latestAuth.current = auth

  useEffect(() => {
    accessToken = auth.user?.access_token
  }, [auth.user])

  useEffect(() => {
    if (auth.error) clearKeycloakParams()
  }, [auth.error])

  const connect = useCallback(() => void latestAuth.current.signinRedirect(), [])

  // Forgets the token on this page only. The sign-in session stays, so connecting again does
  // not ask for the password — which is what a demo wants.
  const disconnect = useCallback(() => void latestAuth.current.removeUser(), [])

  return {
    isConnected: auth.isAuthenticated,
    userName: profile?.name ?? profile?.preferred_username ?? profile?.email,
    error: auth.error?.message,
    connect,
    disconnect,
  }
}
