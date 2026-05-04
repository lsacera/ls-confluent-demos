import React from 'react';
import { useFetch } from '../../utils/hooks';
import { getSensorHealthSummary, getFailingSensors, getSensorsByZone } from '../../services/api';
import { formatDate, getStatusColor } from '../../utils/formatters';
import DonutChart from '../shared/DonutChart';

const SensorHealthView = () => {
  const { data: healthSummary, loading: summaryLoading } = useFetch(getSensorHealthSummary, 10000);
  const { data: failingSensors, loading: failingLoading } = useFetch(getFailingSensors, 10000);
  const { data: byZone, loading: zoneLoading } = useFetch(getSensorsByZone, 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sensor Health Monitoring</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Summary */}
        <DonutChart
          data={healthSummary}
          valueKey="count"
          labelKey="status"
          title="Sensor Health Status"
          loading={summaryLoading}
          format="number"
        />

        {/* Zone Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sensors by Zone</h2>
          {zoneLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading zone data...</div>
            </div>
          ) : byZone && byZone.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {byZone.map((zone) => (
                <div key={zone.zone_id} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">Zone {zone.zone_id}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      zone.anomaly_count === 0 ? 'bg-green-100 text-green-600' :
                      zone.anomaly_count < 5 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {zone.anomaly_count} anomalies
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Sensors</p>
                      <p className="font-semibold">{zone.sensor_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg Voltage</p>
                      <p className="font-semibold">{zone.avg_voltage?.toFixed(1) || 'N/A'} V</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Power</p>
                      <p className="font-semibold">{zone.total_power_mw?.toFixed(1) || 'N/A'} MW</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No zone data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Failing Sensors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Sensors Requiring Attention
          </h2>
        </div>
        <div className="overflow-x-auto">
          {failingLoading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse text-gray-400">Loading sensor data...</div>
            </div>
          ) : failingSensors && failingSensors.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sensor ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reading Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consecutive Failures
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Reading
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {failingSensors.map((sensor) => (
                  <tr key={sensor.sensor_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {sensor.sensor_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sensor.status)}`}>
                        {sensor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sensor.reading_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {sensor.consecutive_failures || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sensor.last_reading_time ? formatDate(sensor.last_reading_time) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <p className="text-green-600 font-semibold">All sensors are healthy!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorHealthView;
