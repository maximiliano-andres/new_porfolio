import React from 'react'
import ReactDOM from 'react-dom/client'
import PolyglotPortfolio from './app/PolyglotPortfolio.jsx'
import ErrorBoundary from './app/ErrorBoundary.jsx'
import './styles/fonts.css'
import './styles/index.css'
import { reloadOnce } from './lib/reload.js'

// Vite's preload helper: a CSS/JS dependency of a lazy chunk is gone after a redeploy
window.addEventListener('vite:preloadError', (event) => { if (reloadOnce()) event.preventDefault() })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PolyglotPortfolio />
    </ErrorBoundary>
  </React.StrictMode>,
)

// offline support + instant repeat visits (production only: the dev server must never be cached)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("Service worker registration failed:", err));
  });
}
