import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import OverviewDashboard from './components/views/OverviewDashboard';
import AnomaliesView from './components/views/AnomaliesView';
import GridHealthView from './components/views/GridHealthView';
import SensorHealthView from './components/views/SensorHealthView';
import GeographicView from './components/views/GeographicView';
import ArchitectureFlow from './components/views/ArchitectureFlow';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<OverviewDashboard />} />
          <Route path="/anomalies" element={<AnomaliesView />} />
          <Route path="/grid" element={<GridHealthView />} />
          <Route path="/sensors" element={<SensorHealthView />} />
          <Route path="/geographic" element={<GeographicView />} />
          <Route path="/architecture" element={<ArchitectureFlow />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
