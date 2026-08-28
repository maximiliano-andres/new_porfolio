import React from 'react'
import ReactDOM from 'react-dom/client'
import PolyglotPortfolio from '../PolyglotPortfolio.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PolyglotPortfolio />
    </ErrorBoundary>
  </React.StrictMode>,
)
