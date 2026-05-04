import React from 'react';
import { useFetch } from '../../utils/hooks';
import { getSensors, getAnomaliesMap, getAnomaliesByState } from '../../services/api';
import USAMap from '../shared/USAMap';
import { getStatusColor, getSeverityColor, formatDate } from '../../utils/formatters';

// Map state codes to full names for map matching
const STATE_NAMES = {
  'TX': 'Texas', 'CA': 'California', 'NY': 'New York', 'FL': 'Florida',
  'PA': 'Pennsylvania', 'IL': 'Illinois', 'OH': 'Ohio', 'GA': 'Georgia',
  'NC': 'North Carolina', 'MI': 'Michigan', 'NJ': 'New Jersey', 'VA': 'Virginia',
  'WA': 'Washington', 'AZ': 'Arizona', 'MA': 'Massachusetts', 'TN': 'Tennessee',
  'IN': 'Indiana', 'MO': 'Missouri', 'MD': 'Maryland', 'WI': 'Wisconsin',
  'CO': 'Colorado', 'MN': 'Minnesota', 'SC': 'South Carolina', 'AL': 'Alabama',
  'LA': 'Louisiana', 'KY': 'Kentucky', 'OR': 'Oregon', 'OK': 'Oklahoma',
  'CT': 'Connecticut', 'UT': 'Utah', 'IA': 'Iowa', 'NV': 'Nevada',
  'AR': 'Arkansas', 'MS': 'Mississippi', 'KS': 'Kansas', 'NM': 'New Mexico'
};

const GeographicView = () => {
  const { data: sensors, loading: sensorsLoading } = useFetch(getSensors, 10000);
  const { data: anomaliesMap, loading: anomaliesLoading } = useFetch(() => getAnomaliesMap(1), 10000);
  const { data: anomaliesByState, loading: anomaliesByStateLoading } = useFetch(() => getAnomaliesByState(24), 10000);

  // Transform sensor data for state summary table
  const sensorsByState = sensors?.reduce((acc, sensor) => {
    if (!sensor.state) return acc;
    const stateCode = sensor.state;
    const stateName = STATE_NAMES[stateCode] || stateCode;

    if (!acc[stateCode]) {
      acc[stateCode] = { state: stateName, stateCode: stateCode, count: 0, offline: 0, critical: 0 };
    }
    acc[stateCode].count++;
    if (sensor.status === 'OFFLINE') acc[stateCode].offline++;
    if (sensor.status === 'CRITICAL') acc[stateCode].critical++;
    return acc;
  }, {});

  const stateData = sensorsByState ? Object.values(sensorsByState) : [];

  // Transform anomalies by state for map visualization
  const anomaliesMapData = anomaliesByState?.map(item => ({
    state: STATE_NAMES[item.state] || item.state,
    stateCode: item.state,
    total_anomalies: item.total_anomalies || 0,
    critical_count: item.critical_count || 0,
    warning_count: item.warning_count || 0
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Geographic Monitoring</h1>

      {/* USA Map */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Anomalies by State (Last 24h)</h2>
        <USAMap
          data={anomaliesMapData}
          loading={anomaliesByStateLoading}
          valueKey="total_anomalies"
          format="number"
          label="Total Anomalies"
          colorRange={['#fef2f2', '#991b1b']}
        />
      </div>

      {/* State Summary Table - Merge sensor health with anomaly data */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">State Summary (Last 24h)</h2>
        </div>
        <div className="overflow-x-auto">
          {sensorsLoading || anomaliesByStateLoading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse text-gray-400">Loading state data...</div>
            </div>
          ) : stateData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sensors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Anomalies
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Critical Alerts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warning Alerts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sensor Health
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stateData
                  .map((state) => {
                    const anomalyData = anomaliesMapData.find(a => a.stateCode === state.stateCode);
                    const healthScore = ((state.count - state.offline - state.critical) / state.count) * 100;
                    return {
                      ...state,
                      anomalies: anomalyData?.total_anomalies || 0,
                      critical_alerts: anomalyData?.critical_count || 0,
                      warning_alerts: anomalyData?.warning_count || 0,
                      healthScore
                    };
                  })
                  .sort((a, b) => b.anomalies - a.anomalies)
                  .map((state) => (
                    <tr key={state.stateCode} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {state.stateCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {state.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {state.anomalies}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        {state.critical_alerts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                        {state.warning_alerts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                            <div
                              className={`h-2 rounded-full ${
                                state.healthScore >= 90 ? 'bg-green-500' :
                                state.healthScore >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${state.healthScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {state.healthScore.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-400">No state data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Anomalies Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Anomalies (Last Hour)</h2>
        </div>
        <div className="p-6">
          {anomaliesLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-gray-400">Loading anomaly data...</div>
            </div>
          ) : anomaliesMap && anomaliesMap.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {anomaliesMap.slice(0, 30).map((anomaly, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm text-gray-700">{anomaly.sensor_id}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mb-1">{anomaly.alert_type}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    {anomaly.state} / Zone {anomaly.zone_id}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(anomaly.alert_timestamp)}</p>
                  <div className="mt-2 text-xs text-gray-600">
                    Measured: {anomaly.measured_value?.toFixed(2)} / Threshold: {anomaly.threshold_value?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-green-600 font-semibold">No recent anomalies detected!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeographicView;
