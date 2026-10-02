import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.jsx'
import TranslateNotice from './components/TranslateNotice.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Toasts outside auth, so a completed sign-in can announce itself. */}
    <ToastProvider>
      <AuthProvider>
        <App />
        <TranslateNotice />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
)
