import React from 'react'
import ReactDOM from 'react-dom/client'
import PolyglotPortfolio from './app/PolyglotPortfolio.jsx'
import ErrorBoundary from './app/ErrorBoundary.jsx'
import './styles/fonts.css'
import './styles/index.css'

// No global 'vite:preloadError' → reload handler on purpose: it fired on the first failed attempt and reloaded the
// page before lib/lazyWithRetry.js could retry (a brief network drop would lose the drafts in other windows).
// Every dynamic import retries with backoff and falls back to reloadOnce() itself (stale chunks after a redeploy).

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
