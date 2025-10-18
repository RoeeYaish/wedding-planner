import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth-context'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { initTheme } from '@/lib/theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)

registerSW()
// apply saved theme as early as possible
initTheme()

// The Vite PWA plugin injects `registerSW` when `injectRegister: 'auto'` is used.
// Calling registerSW() here ensures the service worker is registered when the app starts.
// No further code is required; the plugin will handle the runtime registration script.

// apply saved theme as early as possible
initTheme()
