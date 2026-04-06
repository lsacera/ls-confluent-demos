import React from 'react';
import { Database, Activity, Server, BarChart3, ArrowRight } from 'lucide-react';
import { useFetch } from '../../utils/hooks';
import { getArchitectureStats, getArchitectureActivity } from '../../services/api';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';

const ArchitectureFlow = () => {
  const { data: stats, loading: statsLoading } = useFetch(getArchitectureStats, 10000);
  const { data: activity, loading: activityLoading } = useFetch(getArchitectureActivity, 10000);

  const components = [
    {
      name: 'SCADA Simulator',
      icon: Activity,
      description: 'Generates sensor telemetry data',
      color: 'bg-purple-100 text-purple-600',
      borderColor: 'border-purple-300',
    },
    {
      name: 'Kafka Topic',
      icon: Server,
      description: 'scada-telemetry stream',
      color: 'bg-blue-100 text-blue-600',
      borderColor: 'border-blue-300',
    },
    {
      name: 'Flink SQL',
      icon: BarChart3,
      description: '5 streaming queries',
      color: 'bg-orange-100 text-orange-600',
      borderColor: 'border-orange-300',
      stats: [
        { label: 'Anomalies', value: stats?.scada_anomalies },
        { label: 'Zone Stats', value: stats?.scada_zone_stats },
        { label: 'Grid Stats', value: stats?.scada_grid_region_stats },
        { label: 'Sensor Health', value: stats?.scada_sensor_health },
      ],
    },
    {
      name: 'PostgreSQL RDS',
      icon: Database,
      description: '4 materialized tables',
      color: 'bg-green-100 text-green-600',
      borderColor: 'border-green-300',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Architecture Flow</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Data Pipeline</h2>

        {/* Architecture Diagram */}
        <div className="flex items-center justify-between mb-8">
          {components.map((component, idx) => (
            <React.Fragment key={component.name}>
              {/* Component Card */}
              <div className={`flex-1 border-2 ${component.borderColor} rounded-lg p-4 ${component.color}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <component.icon className="w-6 h-6" />
                  <h3 className="font-semibold">{component.name}</h3>
                </div>
                <p className="text-sm opacity-80">{component.description}</p>

                {/* Stats for Flink component */}
                {component.stats && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {component.stats.map((stat) => (
                      <div key={stat.label} className="bg-white bg-opacity-50 rounded p-2">
                        <p className="text-xs opacity-70">{stat.label}</p>
                        <p className="text-lg font-bold">
                          {statsLoading ? '...' : formatNumber(stat.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Arrow */}
              {idx < components.length - 1 && (
                <div className="px-4">
                  <ArrowRight className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Pipeline Description */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>SCADA Simulator generates real-time sensor telemetry (voltage, current, frequency, temperature, pressure)</li>
            <li>Data streams to Kafka topic <code className="bg-gray-200 px-1 rounded">scada-telemetry</code></li>
            <li>Flink processes data in real-time with 5 SQL queries:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Anomaly detection (threshold violations)</li>
                <li>5-minute zone aggregations</li>
                <li>10-minute grid region statistics</li>
                <li>1-minute sensor health monitoring</li>
              </ul>
            </li>
            <li>Results are written to PostgreSQL via sink connectors</li>
            <li>This dashboard queries PostgreSQL for real-time visualization</li>
          </ol>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity (Last 5 minutes)</h2>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {activityLoading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse text-gray-400">Loading activity...</div>
            </div>
          ) : activity && activity.length > 0 ? (
            activity.map((event, idx) => (
              <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        event.event_type === 'anomaly'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {event.event_type}
                      </span>
                      <span className="font-mono text-sm text-gray-700">{event.event_id}</span>
                    </div>
                    <p className="text-sm text-gray-900 mt-1">{event.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500">{formatRelativeTime(event.event_time)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary - Commented out as it duplicates info from architecture diagram above */}
      {/* <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Statistics (Last 24h)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Anomalies Detected</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {statsLoading ? '...' : formatNumber(stats?.scada_anomalies)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Zone Statistics</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {statsLoading ? '...' : formatNumber(stats?.scada_zone_stats)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Grid Region Stats</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {statsLoading ? '...' : formatNumber(stats?.scada_grid_region_stats)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Sensor Health Checks</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {statsLoading ? '...' : formatNumber(stats?.scada_sensor_health)}
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default ArchitectureFlow;
