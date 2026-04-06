import React from 'react';
import { Activity, Zap, AlertTriangle } from 'lucide-react';
import { useFetch } from '../../utils/hooks';
import { getGridRegions, getStabilityTrend, getPowerBalance } from '../../services/api';
import { formatDecimal, formatDate, formatNumber, formatNumberWithDecimals } from '../../utils/formatters';
import LineChart from '../shared/LineChart';

const GridHealthView = () => {
  const { data: regions, loading: regionsLoading } = useFetch(getGridRegions, 10000);
  const { data: stabilityTrend, loading: trendLoading } = useFetch(getStabilityTrend, 10000);
  const { data: powerBalance, loading: balanceLoading } = useFetch(getPowerBalance, 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Grid Health Status</h1>

      {/* Grid Region Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {regionsLoading ? (
          <div className="col-span-3 text-center py-12">
            <div className="animate-pulse text-gray-400">Loading grid regions...</div>
          </div>
        ) : regions && regions.length > 0 ? (
          regions.map((region) => (
            <div key={region.grid_region} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{region.grid_region}</h2>
                <Activity className={`w-8 h-8 ${
                  region.grid_stability_score >= 95 ? 'text-green-500' :
                  region.grid_stability_score >= 85 ? 'text-yellow-500' :
                  'text-red-500'
                }`} />
              </div>

              <div className="space-y-4">
                {/* Stability Score */}
                <div>
                  <p className="text-sm text-gray-500">Grid Stability Score</p>
                  <p className={`text-3xl font-bold ${
                    region.grid_stability_score >= 95 ? 'text-green-600' :
                    region.grid_stability_score >= 85 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {formatDecimal(region.grid_stability_score, 1)}%
                  </p>
                </div>

                {/* Power */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Power</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumberWithDecimals(region.total_power_mw, 0)} MW
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Frequency</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDecimal(region.avg_frequency, 2)} Hz
                    </p>
                  </div>
                </div>

                {/* Alerts */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Critical Alerts</p>
                    <p className="text-lg font-semibold text-red-600">
                      {region.critical_alerts || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Warning Alerts</p>
                    <p className="text-lg font-semibold text-yellow-600">
                      {region.warning_alerts || 0}
                    </p>
                  </div>
                </div>

                {/* Sensors */}
                <div>
                  <p className="text-sm text-gray-500">Active Sensors</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {region.sensor_count || 0}
                  </p>
                </div>

                {/* Power Balance */}
                <div>
                  <p className="text-sm text-gray-500">Power Balance</p>
                  <p className={`text-lg font-semibold ${
                    region.power_balance_mw > 0 ? 'text-green-600' :
                    region.power_balance_mw < 0 ? 'text-red-600' :
                    'text-gray-900'
                  }`}>
                    {region.power_balance_mw > 0 ? '+' : ''}{formatNumberWithDecimals(region.power_balance_mw, 1)} MW
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-400">No grid region data available</p>
          </div>
        )}
      </div>

      {/* Stability Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grid Stability Trend (Last 24h)</h2>
        {trendLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading trend data...</div>
          </div>
        ) : stabilityTrend && stabilityTrend.length > 0 ? (
          <div className="h-80">
            {/* Simple line chart visualization */}
            <div className="text-sm text-gray-500 mb-4">
              Showing stability scores across all regions over time
            </div>
            <div className="space-y-2">
              {['ERCOT', 'WECC', 'EASTERN'].map((region) => {
                const regionData = stabilityTrend.filter(d => d.grid_region === region);
                const avgScore = regionData.length > 0
                  ? regionData.reduce((sum, d) => sum + parseFloat(d.grid_stability_score), 0) / regionData.length
                  : 0;
                return (
                  <div key={region} className="flex items-center space-x-4">
                    <span className="w-20 font-medium text-gray-700">{region}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className={`h-6 rounded-full ${
                          avgScore >= 95 ? 'bg-green-500' :
                          avgScore >= 85 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${avgScore}%` }}
                      ></div>
                    </div>
                    <span className="w-16 text-right font-semibold text-gray-900">
                      {formatDecimal(avgScore, 1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">No trend data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GridHealthView;
