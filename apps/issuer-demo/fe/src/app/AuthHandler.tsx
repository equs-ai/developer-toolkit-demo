import { useEffect, type ReactNode } from 'react'
import { hasAuthParams, useAuth } from 'react-oidc-context'
import { useAccessTokenSync, useExpiredAuthSessionHandler } from './auth'
import { SplashScreen } from '../ui/SplashScreen'

export function AuthHandler({ children }: { children: ReactNode }) {
  const auth = useAuth()

  useExpiredAuthSessionHandler()
  useAccessTokenSync()

  useEffect(() => {
    if (hasAuthParams() || auth.isLoading || auth.activeNavigator || auth.isAuthenticated || auth.error) {
      return
    }

    void auth.signinRedirect()
  }, [auth])

  if (auth.error) {
    return <SplashScreen message="Could not sign you in." error={auth.error.message} onRetry={() => void auth.signinRedirect()} />
  }

  if (!auth.isAuthenticated) {
    return <SplashScreen message="One moment…" />
  }

  return <>{children}</>
}
