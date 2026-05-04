import axios from 'axios';

// API base URL - empty string for same-origin requests (nginx proxies /api to backend)
const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Overview API
export const getOverviewKPIs = () => api.get('/api/overview');
export const getHealthTrend = () => api.get('/api/overview/health-trend');

// Traffic API
export const getTrafficSensors = () => api.get('/api/traffic/sensors');
export const getTrafficStats = () => api.get('/api/traffic/stats');
export const getTrafficTrend = () => api.get('/api/traffic/trend');

// Air Quality API
export const getAirQualityStations = () => api.get('/api/airquality/stations');
export const getAirQualityStats = () => api.get('/api/airquality/stats');
export const getAirQualityTrend = () => api.get('/api/airquality/trend');

// EMT Buses API
export const getEmtPerformance = () => api.get('/api/emtbuses/performance');
export const getEmtSummary = () => api.get('/api/emtbuses/summary');
export const getEmtDelayTrends = (line = null) => api.get(`/api/emtbuses/delay-trends${line ? `?line=${line}` : ''}`);

// Services API
export const getServiceSLA = () => api.get('/api/services/sla');
export const getServiceSummary = () => api.get('/api/services/summary');
export const getServicePriorityDistribution = () => api.get('/api/services/priority-distribution');

// Districts API
export const getDistricts = () => api.get('/api/districts');
export const getDistrictsStats = () => api.get('/api/districts/stats');
export const getDistrictTrends = (district) => api.get(`/api/districts/${district}/trends`);
export const getDistrictRankings = (metric) => api.get(`/api/districts/rankings/${metric}`);

// Architecture API
export const getArchitectureTopics = () => api.get('/api/architecture/topics');
export const getArchitectureFlinkTables = () => api.get('/api/architecture/flink-tables');
export const getArchitectureMetrics = () => api.get('/api/architecture/metrics');

export default api;
