import React from 'react';
import { Network, Database, Zap, Activity } from 'lucide-react';
import KPICard from '../shared/KPICard';
import { useFetch } from '../../utils/hooks';
import { getArchitectureTopics, getArchitectureFlinkTables, getArchitectureMetrics } from '../../services/api';
import { formatNumber } from '../../utils/formatters';

const ArchitectureDashboard = () => {
  const { data: topics, loading: topicsLoading } = useFetch(getArchitectureTopics, 30000);
  const { data: flinkTables, loading: tablesLoading } = useFetch(getArchitectureFlinkTables, 30000);
  const { data: metrics, loading: metricsLoading } = useFetch(getArchitectureMetrics, 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Architecture</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Kafka Topics"
          value={topics?.length || 0}
          icon={Database}
          format="number"
          loading={topicsLoading}
        />
        <KPICard
          title="Flink Tables"
          value={flinkTables?.length || 0}
          icon={Zap}
          format="number"
          loading={tablesLoading}
        />
        <KPICard
          title="Traffic Events (1h)"
          value={formatNumber(metrics?.traffic_events || 0)}
          icon={Activity}
          format="custom"
          loading={metricsLoading}
        />
        <KPICard
          title="Air Quality Events (1h)"
          value={formatNumber(metrics?.airquality_events || 0)}
          icon={Activity}
          format="custom"
          loading={metricsLoading}
        />
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pipeline Overview</h2>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg">
          <div className="flex flex-col space-y-6">
            {/* Data Sources */}
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Data Sources</h3>
              <div className="flex justify-center space-x-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-blue-200">
                  <div className="text-2xl mb-2">🚗</div>
                  <div className="text-xs font-medium">Traffic Sensors</div>
                  <div className="text-xs text-gray-500">17 sensors</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-200">
                  <div className="text-2xl mb-2">🌫️</div>
                  <div className="text-xs font-medium">Air Quality</div>
                  <div className="text-xs text-gray-500">12 stations</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-yellow-200">
                  <div className="text-2xl mb-2">🚌</div>
                  <div className="text-xs font-medium">EMT Buses</div>
                  <div className="text-xs text-gray-500">11 buses</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-purple-200">
                  <div className="text-2xl mb-2">📞</div>
                  <div className="text-xs font-medium">311 Services</div>
                  <div className="text-xs text-gray-500">5 categories</div>
                </div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="text-center text-3xl text-gray-400">↓</div>

            {/* Kafka Layer */}
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Confluent Kafka</h3>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-lg">
                <div className="text-lg font-bold">5 Topics</div>
                <div className="text-xs mt-1">Real-time event streaming with Avro schemas</div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="text-center text-3xl text-gray-400">↓</div>

            {/* Flink Layer */}
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Apache Flink SQL</h3>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-lg shadow-lg">
                <div className="text-lg font-bold">7 SQL Statements</div>
                <div className="text-xs mt-1">Stream processing, windowing, aggregations</div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="text-center text-3xl text-gray-400">↓</div>

            {/* PostgreSQL Layer */}
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">PostgreSQL (RDS)</h3>
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-lg shadow-lg">
                <div className="text-lg font-bold">Materialized Views</div>
                <div className="text-xs mt-1">Query-optimized analytics tables</div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="text-center text-3xl text-gray-400">↓</div>

            {/* Dashboard Layer */}
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Web Dashboard</h3>
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-lg shadow-lg">
                <div className="text-lg font-bold">React + Node.js</div>
                <div className="text-xs mt-1">Real-time city monitoring (7 pages)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kafka Topics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-600" />
          Kafka Topics
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partitions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retention
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topicsLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : topics && topics.length > 0 ? (
                topics.map((topic) => (
                  <tr key={topic.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-blue-600">
                      {topic.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {topic.partitions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {topic.retention}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {topic.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No topics data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flink Tables */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-600" />
          Flink SQL Tables
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tablesLoading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : flinkTables && flinkTables.length > 0 ? (
                flinkTables.map((table) => (
                  <tr key={table.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-purple-600">
                      {table.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        table.type === 'stream' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {table.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {table.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No Flink tables data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-green-600" />
          Pipeline Metrics (Last Hour)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Traffic Events</div>
            <div className="text-2xl font-bold text-blue-900 mt-2">
              {metricsLoading ? '...' : formatNumber(metrics?.traffic_events || 0)}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium">Air Quality Events</div>
            <div className="text-2xl font-bold text-green-900 mt-2">
              {metricsLoading ? '...' : formatNumber(metrics?.airquality_events || 0)}
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Traffic Alerts</div>
            <div className="text-2xl font-bold text-orange-900 mt-2">
              {metricsLoading ? '...' : formatNumber(metrics?.traffic_alerts || 0)}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">City Health Windows</div>
            <div className="text-2xl font-bold text-purple-900 mt-2">
              {metricsLoading ? '...' : formatNumber(metrics?.city_health_windows || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">☕</div>
            <div className="text-sm font-semibold">Java 17</div>
            <div className="text-xs text-gray-500">Simulator</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🔵</div>
            <div className="text-sm font-semibold">Confluent Cloud</div>
            <div className="text-xs text-gray-500">Kafka + Flink</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🐘</div>
            <div className="text-sm font-semibold">PostgreSQL</div>
            <div className="text-xs text-gray-500">RDS db.t3.micro</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">⚛️</div>
            <div className="text-sm font-semibold">React + Node.js</div>
            <div className="text-xs text-gray-500">Dashboard</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🐳</div>
            <div className="text-sm font-semibold">Docker</div>
            <div className="text-xs text-gray-500">Containers</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-sm font-semibold">ECS Fargate</div>
            <div className="text-xs text-gray-500">AWS</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🏗️</div>
            <div className="text-sm font-semibold">Terraform</div>
            <div className="text-xs text-gray-500">IaC</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm font-semibold">Chart.js</div>
            <div className="text-xs text-gray-500">Visualizations</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDashboard;
