import React from 'react'
import ReactDOM from 'react-dom/client'
import PolyglotPortfolio from './PolyglotPortfolio.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './fonts.css'
import './index.css'

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
