import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { App } from './App'
import { oidcConfig } from './app/auth'
import { AuthHandler } from './app/AuthHandler'
import './ui/styles/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <AuthHandler>
        <App />
      </AuthHandler>
    </AuthProvider>
  </StrictMode>
)
