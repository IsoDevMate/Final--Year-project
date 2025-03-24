import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { EventProvider } from './contexts/EventContext.tsx'
import { SessionProvider } from './contexts/SessionContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <EventProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </EventProvider>
    </AuthProvider>
  </StrictMode>,
)
