import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import OverviewDashboard from './components/views/OverviewDashboard';
import ProductAnalytics from './components/views/ProductAnalytics';
import Customer360 from './components/views/Customer360';
import GeographicView from './components/views/GeographicView';
import PaymentCompletion from './components/views/PaymentCompletion';
import ArchitectureFlow from './components/views/ArchitectureFlow';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<OverviewDashboard />} />
          <Route path="/products" element={<ProductAnalytics />} />
          <Route path="/customers" element={<Customer360 />} />
          <Route path="/geographic" element={<GeographicView />} />
          <Route path="/payments" element={<PaymentCompletion />} />
          <Route path="/architecture" element={<ArchitectureFlow />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
