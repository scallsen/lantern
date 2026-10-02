import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.jsx'
import TranslateNotice from './components/TranslateNotice.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

// iOS Safari zooms the page into any field whose text is under 16px, and the
// app's fields are 15px. `maximum-scale=1` stops that, but Android honours it
// by disabling pinch-zoom too — a real loss with small kanji on screen — while
// iOS ignores it for pinch-zoom and only drops the focus zoom. So it's added
// on iOS alone (iPadOS reports itself as a Mac with touch points).
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
if (isIOS) {
  const viewport = document.querySelector('meta[name="viewport"]')
  if (viewport && !viewport.content.includes('maximum-scale')) {
    viewport.content += ', maximum-scale=1'
  }
}

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
