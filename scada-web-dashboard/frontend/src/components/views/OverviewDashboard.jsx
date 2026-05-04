import React from 'react';
import { AlertTriangle, Activity, AlertOctagon, WifiOff } from 'lucide-react';
import KPICard from '../shared/KPICard';
import BarChart from '../shared/BarChart';
import LineChart from '../shared/LineChart';
import { useFetch } from '../../utils/hooks';
import { getOverviewKPIs, getHourlyAnomalies, getGridHealth } from '../../services/api';
import { formatNumber, formatDecimal, formatHour } from '../../utils/formatters';

const OverviewDashboard = () => {
  const { data: kpis, loading: kpisLoading } = useFetch(getOverviewKPIs, 10000);
  const { data: hourlyAnomalies, loading: hourlyLoading } = useFetch(getHourlyAnomalies, 10000);
  const { data: gridHealth, loading: gridLoading } = useFetch(getGridHealth, 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">SCADA System Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Anomalies (24h)"
          value={kpis?.total_anomalies_24h}
          icon={AlertTriangle}
          format="number"
          loading={kpisLoading}
        />
        <KPICard
          title="Critical Alerts"
          value={kpis?.critical_alerts}
          icon={AlertOctagon}
          format="number"
          loading={kpisLoading}
        />
        <KPICard
          title="Avg Grid Stability"
          value={kpis?.avg_grid_stability ? `${formatDecimal(kpis.avg_grid_stability, 1)}%` : '0%'}
          icon={Activity}
          format="custom"
          loading={kpisLoading}
        />
        <KPICard
          title="Sensors Offline"
          value={kpis?.sensors_offline}
          icon={WifiOff}
          format="number"
          loading={kpisLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Anomalies Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Anomalies per Hour (Last 24h)</h2>
          {hourlyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading chart...</div>
            </div>
          ) : hourlyAnomalies && hourlyAnomalies.length > 0 ? (
            <BarChart
              data={hourlyAnomalies}
              valueKey="anomaly_count"
              labelKey="hour"
              maxItems={24}
              loading={hourlyLoading}
              showTitle={false}
              format="number"
              formatLabel={formatHour}
            />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No anomaly data available</p>
            </div>
          )}
        </div>

        {/* Grid Health by Region */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grid Health by Region</h2>
          {gridLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading data...</div>
            </div>
          ) : gridHealth && gridHealth.length > 0 ? (
            <div className="space-y-4">
              {gridHealth.map((region) => (
                <div key={region.grid_region} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{region.grid_region}</h3>
                    <span className={`text-2xl font-bold ${
                      region.grid_stability_score >= 95 ? 'text-green-600' :
                      region.grid_stability_score >= 85 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatDecimal(region.grid_stability_score, 1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Power (MW)</p>
                      <p className="font-semibold">{formatDecimal(region.total_power_mw, 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Critical Alerts</p>
                      <p className="font-semibold text-red-600">{region.critical_alerts || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sensors</p>
                      <p className="font-semibold">{region.sensor_count || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No grid health data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
