import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { AutoRefreshContext } from './contexts/AutoRefreshContext';
import OverviewDashboard from './components/views/OverviewDashboard';
import TrafficDashboard from './components/views/TrafficDashboard';
import AirQualityDashboard from './components/views/AirQualityDashboard';
import EmtBusesDashboard from './components/views/EmtBusesDashboard';
import ServicesDashboard from './components/views/ServicesDashboard';
import DistrictsDashboard from './components/views/DistrictsDashboard';
import ArchitectureDashboard from './components/views/ArchitectureDashboard';

function App() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleManualRefresh = () => {
    window.location.reload();
  };

  return (
    <Router>
      <AutoRefreshContext.Provider value={autoRefresh}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src="/logo-cnfl-ibm.jpg" alt="Confluent + IBM" className="h-14" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Smart City Madrid</h1>
                    <p className="text-sm text-gray-500">Real-time Urban Monitoring</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleManualRefresh}
                    disabled={autoRefresh}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      autoRefresh
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title={autoRefresh ? 'Disable auto-refresh to use manual refresh' : 'Refresh now'}
                  >
                    🔄 Refresh
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Auto-refresh</span>
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoRefresh ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoRefresh ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex space-x-1">
              <NavItem to="/" label="Overview" />
              <NavItem to="/traffic" label="Traffic" />
              <NavItem to="/airquality" label="Air Quality" />
              <NavItem to="/emtbuses" label="EMT Buses" />
              <NavItem to="/services" label="Services" />
              <NavItem to="/districts" label="Districts" />
              <NavItem to="/architecture" label="Architecture" />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<OverviewDashboard />} />
            <Route path="/traffic" element={<TrafficDashboard />} />
            <Route path="/airquality" element={<AirQualityDashboard />} />
            <Route path="/emtbuses" element={<EmtBusesDashboard />} />
            <Route path="/services" element={<ServicesDashboard />} />
            <Route path="/districts" element={<DistrictsDashboard />} />
            <Route path="/architecture" element={<ArchitectureDashboard />} />
          </Routes>
        </main>
      </div>
      </AutoRefreshContext.Provider>
    </Router>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-3 text-sm font-medium transition-colors ${
          isActive
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default App;
