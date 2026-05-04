import React from 'react';
import { Wind, AlertCircle, TrendingDown } from 'lucide-react';
import KPICard from '../shared/KPICard';
import LineChart from '../shared/LineChart';
import BarChart from '../shared/BarChart';
import { useFetch } from '../../utils/hooks';
import { getAirQualityStations, getAirQualityStats, getAirQualityTrend } from '../../services/api';
import { formatNumber, formatDecimal, getHealthStatusColor } from '../../utils/formatters';

const AirQualityDashboard = () => {
  const { data: stations, loading: stationsLoading } = useFetch(getAirQualityStations, 10000);
  const { data: stats, loading: statsLoading } = useFetch(getAirQualityStats, 10000);
  const { data: trend, loading: trendLoading } = useFetch(getAirQualityTrend, 10000);

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return { label: 'GOOD', color: 'text-green-600 bg-green-50' };
    if (aqi <= 100) return { label: 'MODERATE', color: 'text-yellow-600 bg-yellow-50' };
    if (aqi <= 150) return { label: 'UNHEALTHY_SENSITIVE', color: 'text-orange-600 bg-orange-50' };
    if (aqi <= 200) return { label: 'UNHEALTHY', color: 'text-red-600 bg-red-50' };
    if (aqi <= 300) return { label: 'VERY_UNHEALTHY', color: 'text-purple-600 bg-purple-50' };
    return { label: 'HAZARDOUS', color: 'text-red-900 bg-red-100' };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Air Quality Monitoring</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Stations"
          value={stations?.length || 0}
          icon={Wind}
          format="number"
          loading={stationsLoading}
        />
        <KPICard
          title="Average AQI"
          value={stats?.avg_aqi ? Math.round(stats.avg_aqi) : 0}
          icon={AlertCircle}
          format="number"
          loading={statsLoading}
        />
        <KPICard
          title="PM2.5 Average"
          value={stats?.avg_pm25 ? `${formatDecimal(stats.avg_pm25, 1)} µg/m³` : 'N/A'}
          icon={TrendingDown}
          format="custom"
          loading={statsLoading}
        />
        <KPICard
          title="Unhealthy Stations"
          value={stats?.unhealthy_count || 0}
          icon={AlertCircle}
          format="number"
          loading={statsLoading}
        />
      </div>

      {/* AQI Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Air Quality Index Trend (24h)</h2>
        <LineChart
          data={trend || []}
          xKey="window_start"
          yKey="avg_aqi"
          loading={trendLoading}
          height={300}
          valueFormatter={(value) => Math.round(value).toString()}
        />
      </div>

      {/* Air Quality Stations Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Air Quality Stations ({stations?.length || 0} locations)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Station ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AQI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NO2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PM2.5
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PM10
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stationsLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : stations && stations.length > 0 ? (
                stations.map((station) => {
                  const aqiLevel = getAQILevel(station.aqi);
                  return (
                    <tr key={station.station_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {station.station_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.location_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.district}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {station.aqi}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${aqiLevel.color}`}>
                          {station.quality_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDecimal(station.no2, 1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDecimal(station.pm25, 1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDecimal(station.pm10, 1)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No stations data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AirQualityDashboard;
