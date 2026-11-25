import type { ReactNode } from 'react'
import { hasAuthParams, useAuth } from 'react-oidc-context'
import { useAccessTokenSync, useExpiredAuthSessionHandler, useExpiredUserRenewal } from './auth'
import { SplashScreen } from '../ui/SplashScreen'

export function AuthHandler({ children }: { children: ReactNode }) {
  const auth = useAuth()

  useExpiredAuthSessionHandler()
  useAccessTokenSync()
  const renewingExpiredUser = useExpiredUserRenewal()

  if (auth.error) {
    return <SplashScreen message="Could not sign you in." error={auth.error.message} onRetry={() => void auth.signinRedirect()} />
  }

  if (auth.isLoading || auth.activeNavigator || renewingExpiredUser || (hasAuthParams() && !auth.isAuthenticated)) {
    return <SplashScreen message="One moment…" />
  }

  return <>{children}</>
}
