import React, { useState, createContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Navigation, Wind, Bus, Wrench, Building2, Network, RefreshCw } from 'lucide-react';

export const AutoRefreshContext = createContext();

const Layout = ({ children }) => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const navItems = [
    { name: 'Overview', path: '/', icon: Home },
    { name: 'Traffic', path: '/traffic', icon: Navigation },
    { name: 'Air Quality', path: '/airquality', icon: Wind },
    { name: 'EMT Buses', path: '/emtbuses', icon: Bus },
    { name: 'Services', path: '/services', icon: Wrench },
    { name: 'Districts', path: '/districts', icon: Building2 },
    { name: 'Architecture', path: '/architecture', icon: Network },
  ];

  return (
    <AutoRefreshContext.Provider value={autoRefresh}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src="/logo-cnfl-ibm.jpg" alt="Confluent + Flink" className="h-14" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Smart City Madrid</h1>
                  <p className="text-sm text-gray-500">Real-time urban intelligence powered by Confluent + Flink</p>
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
                    <span className="text-sm font-medium text-gray-700">
                      Auto-refresh
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="px-6">
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>© 2024 Smart City Madrid - Powered by Confluent Cloud + Apache Flink</p>
              <div className="flex items-center space-x-4">
                <a href="https://www.confluent.io" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                  Confluent
                </a>
                <a href="https://flink.apache.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                  Apache Flink
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AutoRefreshContext.Provider>
  );
};

export default Layout;
