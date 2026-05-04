import React from 'react';
import { Navigation, TrendingUp, AlertTriangle } from 'lucide-react';
import KPICard from '../shared/KPICard';
import BarChart from '../shared/BarChart';
import LineChart from '../shared/LineChart';
import { useFetch } from '../../utils/hooks';
import { getTrafficSensors, getTrafficStats, getTrafficTrend } from '../../services/api';
import { formatNumber, formatDecimal, getTrafficStatusColor } from '../../utils/formatters';

const TrafficDashboard = () => {
  const { data: sensors, loading: sensorsLoading } = useFetch(getTrafficSensors, 10000);
  const { data: stats, loading: statsLoading } = useFetch(getTrafficStats, 10000);
  const { data: trend, loading: trendLoading } = useFetch(getTrafficTrend, 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Traffic Monitoring</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Sensors"
          value={sensors?.length || 0}
          icon={Navigation}
          format="number"
          loading={sensorsLoading}
        />
        <KPICard
          title="Avg Speed"
          value={stats?.avg_speed ? `${formatDecimal(stats.avg_speed, 1)} km/h` : 'N/A'}
          icon={TrendingUp}
          format="custom"
          loading={statsLoading}
        />
        <KPICard
          title="Congested Sensors"
          value={stats?.congested_count || 0}
          icon={AlertTriangle}
          format="number"
          loading={statsLoading}
        />
        <KPICard
          title="Total Vehicles"
          value={formatNumber(stats?.total_vehicles || 0)}
          icon={Navigation}
          format="custom"
          loading={statsLoading}
        />
      </div>

      {/* Traffic Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Speed Trend (24h)</h2>
        <LineChart
          data={trend || []}
          xKey="window_start"
          yKey="avg_speed"
          loading={trendLoading}
          height={300}
          suffix=" km/h"
        />
      </div>

      {/* Sensors Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Traffic Sensors ({sensors?.length || 0} locations)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sensor ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupancy
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sensorsLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : sensors && sensors.length > 0 ? (
                sensors.map((sensor) => (
                  <tr key={sensor.sensor_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sensor.sensor_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sensor.location_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sensor.district}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTrafficStatusColor(sensor.traffic_status)}`}>
                        {sensor.traffic_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDecimal(sensor.avg_speed, 1)} km/h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(sensor.vehicle_count)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDecimal(sensor.occupancy_pct, 0)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No sensors data available
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

export default TrafficDashboard;
