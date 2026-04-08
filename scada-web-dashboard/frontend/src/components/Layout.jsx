import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, AlertTriangle, Activity, Thermometer, Map, Network, RefreshCw } from 'lucide-react';
import { useState, createContext } from 'react';

export const AutoRefreshContext = createContext();

const Layout = ({ children }) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const navItems = [
    { name: 'Overview', path: '/', icon: Home },
    { name: 'Anomalies', path: '/anomalies', icon: AlertTriangle },
    { name: 'Grid Health', path: '/grid', icon: Activity },
    { name: 'Sensor Health', path: '/sensors', icon: Thermometer },
    { name: 'Geographic', path: '/geographic', icon: Map },
    { name: 'Architecture', path: '/architecture', icon: Network },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo-cnfl-ibm.jpg" alt="Confluent + IBM" className="h-14" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCADA Streaming Analytics</h1>
                <p className="text-sm text-gray-500">Real-time grid monitoring powered by Confluent</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  disabled={autoRefresh}
                  className={`p-2 rounded-lg transition-colors ${
                    autoRefresh
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                  title={autoRefresh ? 'Disable auto-refresh to use manual refresh' : 'Refresh now'}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      autoRefresh ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoRefresh ? 'translate-x-5' : ''
                      }`}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Auto-refresh</span>
                </label>
              </div>

              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <AutoRefreshContext.Provider value={autoRefresh}>
              {children}
            </AutoRefreshContext.Provider>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
