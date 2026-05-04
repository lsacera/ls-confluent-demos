import axios from 'axios';

// Check for runtime config first (for production), then build-time env, then fallback to localhost
const API_BASE_URL = (window.ENV && window.ENV.VITE_API_URL) || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Overview API
export const getOverviewKPIs = () => api.get('/overview/kpis');
export const getHourlySales = () => api.get('/overview/hourly-sales');
export const getComparison = () => api.get('/overview/comparison');

// Products API
export const getTopProducts = (days = 7) => api.get(`/products/top?days=${days}`);
export const getTopBrands = (days = 7) => api.get(`/products/brands?days=${days}`);
export const getBrandDistribution = (days = 7) => api.get(`/products/distribution?days=${days}`);

// Customers API
export const getTopCustomers = () => api.get('/customers/top');
export const getCustomerMetrics = () => api.get('/customers/metrics');
export const getRecentActivity = () => api.get('/customers/recent-activity');

// Geographic API
export const getSalesByState = (days = 7) => api.get(`/geographic/by-state?days=${days}`);
export const getPaymentCompletion = (days = 1) => api.get(`/geographic/payment-completion?days=${days}`);

// Architecture API
export const getArchitectureStats = () => api.get('/architecture/stats');
export const getArchitectureActivity = () => api.get('/architecture/activity');

export default api;
