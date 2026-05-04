import React from 'react';
import { Bus, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import KPICard from '../shared/KPICard';
import LineChart from '../shared/LineChart';
import BarChart from '../shared/BarChart';
import { useFetch } from '../../utils/hooks';
import { getEmtSummary, getEmtDelayTrends } from '../../services/api';
import { formatNumber, formatDecimal } from '../../utils/formatters';

const EmtBusesDashboard = () => {
  const { data: summary, loading: summaryLoading } = useFetch(getEmtSummary, 10000);
  const { data: delayTrends, loading: trendsLoading } = useFetch(getEmtDelayTrends, 10000);

  // Calculate KPIs from summary data
  const totalBuses = summary?.reduce((sum, line) => sum + (line.total_buses || 0), 0) || 0;
  const totalDelayed = summary?.reduce((sum, line) => sum + (line.buses_delayed || 0), 0) || 0;
  const avgDelay = summary?.length > 0
    ? summary.reduce((sum, line) => sum + (line.avg_delay_minutes || 0), 0) / summary.length
    : 0;
  const avgOccupancy = summary?.length > 0
    ? summary.reduce((sum, line) => sum + (line.avg_occupancy_pct || 0), 0) / summary.length
    : 0;

  const getDelayStatusColor = (delay) => {
    if (delay <= 2) return 'text-green-600 bg-green-50';
    if (delay <= 5) return 'text-yellow-600 bg-yellow-50';
    if (delay <= 10) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getOccupancyStatusColor = (occupancy) => {
    if (occupancy < 50) return 'text-green-600 bg-green-50';
    if (occupancy < 75) return 'text-blue-600 bg-blue-50';
    if (occupancy < 90) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">EMT Bus Monitoring</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Buses"
          value={totalBuses}
          icon={Bus}
          format="number"
          loading={summaryLoading}
        />
        <KPICard
          title="Delayed Buses"
          value={totalDelayed}
          icon={AlertTriangle}
          format="number"
          loading={summaryLoading}
        />
        <KPICard
          title="Avg Delay"
          value={avgDelay ? `${formatDecimal(avgDelay, 1)} min` : 'N/A'}
          icon={Clock}
          format="custom"
          loading={summaryLoading}
        />
        <KPICard
          title="Avg Occupancy"
          value={avgOccupancy ? `${formatDecimal(avgOccupancy, 1)}%` : 'N/A'}
          icon={TrendingUp}
          format="custom"
          loading={summaryLoading}
        />
      </div>

      {/* Delay Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Average Delay Trend (6h)</h2>
        <LineChart
          data={delayTrends || []}
          xKey="window_start"
          yKey="avg_delay_minutes"
          loading={trendsLoading}
          height={300}
          suffix=" min"
        />
      </div>

      {/* Bus Line Performance Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bus Line Performance (11 buses on 7 routes)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Buses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Delay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delayed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overcrowded
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaryLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : summary && summary.length > 0 ? (
                summary.map((line) => (
                  <tr key={line.bus_line} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Line {line.bus_line}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {line.total_buses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDelayStatusColor(line.avg_delay_minutes)}`}>
                        {formatDecimal(line.avg_delay_minutes, 1)} min
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {line.buses_delayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {line.buses_on_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOccupancyStatusColor(line.avg_occupancy_pct)}`}>
                        {formatDecimal(line.avg_occupancy_pct, 1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {line.overcrowded_buses}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No bus performance data available
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

export default EmtBusesDashboard;
