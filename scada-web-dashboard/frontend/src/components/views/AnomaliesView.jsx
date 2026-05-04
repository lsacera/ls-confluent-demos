import React, { useState } from 'react';
import { useFetch } from '../../utils/hooks';
import { getRecentAnomalies, getAnomaliesBySeverity, getAnomaliesByType } from '../../services/api';
import { formatDate, getSeverityColor, formatDecimal } from '../../utils/formatters';
import DonutChart from '../shared/DonutChart';
import BarChart from '../shared/BarChart';

const AnomaliesView = () => {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const { data: anomalies, loading: anomaliesLoading } = useFetch(getRecentAnomalies, 10000);
  const { data: bySeverity, loading: severityLoading } = useFetch(getAnomaliesBySeverity, 10000);
  const { data: byType, loading: typeLoading } = useFetch(getAnomaliesByType, 10000);

  const filteredAnomalies = anomalies?.filter(a =>
    severityFilter === 'ALL' || a.severity === severityFilter
  ) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Anomalies</h1>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          data={bySeverity}
          valueKey="count"
          labelKey="severity"
          title="Anomalies by Severity (Last 24h)"
          loading={severityLoading}
          format="number"
        />
        <BarChart
          data={byType}
          valueKey="count"
          labelKey="alert_type"
          title="Top Anomaly Types (Last 24h)"
          maxItems={10}
          loading={typeLoading}
          format="number"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Severity:</label>
          <div className="flex space-x-2">
            {['ALL', 'CRITICAL', 'WARNING'].map((severity) => (
              <button
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  severityFilter === severity
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Anomalies ({filteredAnomalies.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          {anomaliesLoading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse text-gray-400">Loading anomalies...</div>
            </div>
          ) : filteredAnomalies.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sensor ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Measured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Threshold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAnomalies.slice(0, 50).map((anomaly, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(anomaly.alert_timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                      {anomaly.sensor_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {anomaly.alert_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDecimal(anomaly.measured_value, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDecimal(anomaly.threshold_value, 2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {anomaly.state || 'N/A'} / Zone {anomaly.zone_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-400">No anomalies found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomaliesView;
