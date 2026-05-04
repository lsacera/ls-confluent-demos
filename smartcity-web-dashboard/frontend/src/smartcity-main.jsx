/**
 * Smart City Madrid Dashboard - Application Bootstrap
 *
 * Urban IoT monitoring system with real-time traffic and environmental data
 * Tracks traffic flow, air quality, and parking across Madrid districts
 * Features: Traffic Monitoring, Environmental Sensors, Parking Analytics
 *
 * @author Luis Sanchez
 * @see https://github.com/lsacera/ls-confluent-demos
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Application bootstrap for Smart City dashboard
function initializeSmartCityDashboard() {
  const rootContainer = document.getElementById('root')

  if (!rootContainer) {
    console.error('Failed to locate root container for Smart City dashboard')
    return
  }

  const appRoot = ReactDOM.createRoot(rootContainer)

  // Mount Smart City application
  appRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// Launch the Smart City Madrid dashboard
initializeSmartCityDashboard()
