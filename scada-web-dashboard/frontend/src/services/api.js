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
export const getHourlyAnomalies = () => api.get('/overview/hourly-anomalies');
export const getGridHealth = () => api.get('/overview/grid-health');

// Anomalies API
export const getRecentAnomalies = (limit = 100, offset = 0) => api.get(`/anomalies/recent?limit=${limit}&offset=${offset}`);
export const getAnomaliesBySeverity = () => api.get('/anomalies/by-severity');
export const getAnomaliesByType = () => api.get('/anomalies/by-type');

// Grid API
export const getGridRegions = () => api.get('/grid/regions');
export const getStabilityTrend = () => api.get('/grid/stability-trend');
export const getPowerBalance = () => api.get('/grid/power-balance');

// Sensors API
export const getSensorHealthSummary = () => api.get('/sensors/health-summary');
export const getFailingSensors = (limit = 50) => api.get(`/sensors/failing?limit=${limit}`);
export const getSensorsByZone = () => api.get('/sensors/by-zone');

// Geographic API
export const getSensors = () => api.get('/geographic/sensors');
export const getAnomaliesMap = (hours = 1) => api.get(`/geographic/anomalies-map?hours=${hours}`);
export const getAnomaliesByState = (hours = 24) => api.get(`/geographic/anomalies-by-state?hours=${hours}`);

// Architecture API
export const getArchitectureStats = () => api.get('/architecture/stats');
export const getArchitectureActivity = () => api.get('/architecture/activity');

export default api;
