import { useEffect } from 'react'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { useAuth, type AuthProviderProps } from 'react-oidc-context'
import { config } from './config'

const KEYCLOAK_URL_PARAMS = ['state', 'iss', 'session_state', 'code', 'kc_idp_hint', 'error', 'error_description']

const clearKeycloakParams = () => {
  const params = new URLSearchParams(window.location.search)
  KEYCLOAK_URL_PARAMS.forEach((param) => params.delete(param))

  const query = params.toString() ? `?${params.toString()}` : ''
  window.history.replaceState({}, document.title, window.location.pathname.concat(query))
}

const userManager = new UserManager({
  authority: config.kcAuthority,
  client_id: config.kcClientId,
  redirect_uri: `${window.location.origin}/`,
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: localStorage }),
})

export const oidcConfig: AuthProviderProps = {
  userManager,
  onSigninCallback: clearKeycloakParams,
}

let renewal: Promise<unknown> | undefined

const renewOrForgetUser = () =>
  (renewal ??= userManager
    .signinSilent()
    .catch(() => userManager.removeUser())
    .finally(() => {
      renewal = undefined
    }))

export const useExpiredUserRenewal = () => {
  const auth = useAuth()
  const expired = !auth.isLoading && !auth.activeNavigator && !!auth.user?.expired

  useEffect(() => {
    if (expired) void renewOrForgetUser()
  }, [expired])

  return expired
}

const isUnrecoverable = (auth: ReturnType<typeof useAuth>) => {
  const params = new URLSearchParams(window.location.search)

  return (
    (params.get('error') === 'temporarily_unavailable' && params.get('error_description') === 'authentication_expired') ||
    auth.error?.message === 'No matching state found in storage' ||
    auth.error?.message === 'PKCE verification failed: Code mismatch' ||
    auth.error?.message === 'Incorrect redirect_uri'
  )
}

export const useExpiredAuthSessionHandler = () => {
  const auth = useAuth()

  useEffect(() => {
    if (!isUnrecoverable(auth)) return

    clearKeycloakParams()
    window.location.reload()
  }, [auth])
}

let accessToken: string | undefined

export const getAccessToken = () => accessToken

export const useAccessTokenSync = () => {
  const auth = useAuth()

  useEffect(() => {
    accessToken = auth.user?.access_token
  }, [auth.user])
}

export interface SessionUser {
  id: string
  email?: string
  name: string
}

export interface Session {
  user?: SessionUser
  login: () => void
  logout: () => void
}

/**
 * The session, for anything rendered inside `<AuthHandler>`. `user` is undefined when signed out.
 *
 * `id` is the token's `sub`, which `issueVC()` takes as `userInfo.id`. `email` is optional
 * because the claim depends on what the tenant's Keycloak releases.
 */
export const useSession = (): Session => {
  const auth = useAuth()
  const profile = auth.user?.profile

  return {
    user: profile?.sub
      ? {
          id: profile.sub,
          email: profile.email,
          name: profile.name ?? profile.preferred_username ?? profile.email ?? 'user',
        }
      : undefined,
    login: () => void auth.signinRedirect(),
    logout: () => {
      const idToken = auth.user?.id_token

      void auth.signoutRedirect({
        post_logout_redirect_uri: `${window.location.origin}/`,
        ...(idToken ? { id_token_hint: idToken } : { client_id: config.kcClientId }),
      })
    },
  }
}
