/**
 * Retail Analytics Dashboard - Application Entry Point
 *
 * Real-time e-commerce analytics powered by Confluent Cloud
 * Displays Customer360, Product Sales, and Daily Trends
 *
 * @see https://github.com/lsacera/ls-confluent-demos
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize React application
const initializeApp = () => {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Root element not found in DOM')
  }

  const root = ReactDOM.createRoot(rootElement)

  // Render main application component
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// Bootstrap the application
initializeApp()
