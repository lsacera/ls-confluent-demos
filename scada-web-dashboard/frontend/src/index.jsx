/**
 * SCADA Grid Monitoring Dashboard - Application Bootstrap
 *
 * Energy grid monitoring system with real-time telemetry
 * Tracks 180 sensors across USA electrical and gas networks
 * Features: Anomaly Detection, Grid Health, Sensor Monitoring
 *
 * @author Luis Sanchez
 * @see https://github.com/lsacera/ls-confluent-demos
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Application initialization function
function bootstrapApplication() {
  const containerElement = document.getElementById('root')

  if (!containerElement) {
    console.error('Failed to find root container element')
    return
  }

  const reactRoot = ReactDOM.createRoot(containerElement)

  // Mount the application to the DOM
  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// Start the SCADA dashboard application
bootstrapApplication()
