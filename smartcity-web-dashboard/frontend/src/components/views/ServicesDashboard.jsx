import React from 'react';
import { Wrench, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import KPICard from '../shared/KPICard';
import BarChart from '../shared/BarChart';
import { useFetch } from '../../utils/hooks';
import { getServiceSummary, getServicePriorityDistribution } from '../../services/api';
import { formatNumber, formatPercent } from '../../utils/formatters';

const ServicesDashboard = () => {
  const { data: summary, loading: summaryLoading } = useFetch(getServiceSummary, 10000);
  const { data: priorityDist, loading: priorityLoading } = useFetch(getServicePriorityDistribution, 10000);

  // Calculate overall KPIs
  const totalTickets = summary?.reduce((sum, cat) => sum + (parseInt(cat.total_tickets) || 0), 0) || 0;
  const totalOverdue = summary?.reduce((sum, cat) => sum + (parseInt(cat.tickets_overdue) || 0), 0) || 0;
  const totalOpen = summary?.reduce((sum, cat) => sum + (parseInt(cat.open_tickets) || 0), 0) || 0;
  const avgCompliance = summary?.length > 0
    ? summary.reduce((sum, cat) => sum + (cat.sla_compliance_pct || 0), 0) / summary.length
    : 0;

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'URGENTE':
        return 'text-red-600 bg-red-50';
      case 'ALTA':
        return 'text-orange-600 bg-orange-50';
      case 'MEDIA':
        return 'text-yellow-600 bg-yellow-50';
      case 'BAJA':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'WASTE_COLLECTION':
        return '🗑️';
      case 'STREET_LIGHTS':
        return '💡';
      case 'ROAD_MAINTENANCE':
        return '🛣️';
      case 'PARKS_GARDENS':
        return '🌳';
      case 'NOISE_COMPLAINT':
        return '🔊';
      default:
        return '📋';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Citizen Services Monitoring</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Tickets"
          value={formatNumber(totalTickets)}
          icon={Wrench}
          format="custom"
          loading={summaryLoading}
        />
        <KPICard
          title="Open Tickets"
          value={formatNumber(totalOpen)}
          icon={AlertCircle}
          format="custom"
          loading={summaryLoading}
        />
        <KPICard
          title="Overdue"
          value={formatNumber(totalOverdue)}
          icon={XCircle}
          format="custom"
          loading={summaryLoading}
        />
        <KPICard
          title="SLA Compliance"
          value={avgCompliance ? `${avgCompliance.toFixed(1)}%` : 'N/A'}
          icon={CheckCircle}
          format="custom"
          loading={summaryLoading}
        />
      </div>

      {/* Priority Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tickets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg SLA (hours)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priorityLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : priorityDist && priorityDist.length > 0 ? (
                priorityDist.map((priority) => (
                  <tr key={priority.priority} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(priority.priority)}`}>
                        {priority.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(priority.total_tickets)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(priority.open_tickets)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatNumber(priority.tickets_overdue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {priority.avg_sla_hours != null && !isNaN(priority.avg_sla_hours) ? formatNumber(Number(priority.avg_sla_hours).toFixed(1)) : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No priority data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tickets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLA Compliance
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
                summary.map((cat) => (
                  <tr key={cat.category} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="mr-2">{getCategoryIcon(cat.category)}</span>
                      {cat.category.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(cat.total_tickets)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(cat.open_tickets)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(cat.in_progress_tickets)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(cat.resolved_tickets)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatNumber(cat.tickets_overdue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-16 mr-2 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              cat.sla_compliance_pct >= 90 ? 'bg-green-500' :
                              cat.sla_compliance_pct >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(cat.sla_compliance_pct || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {cat.sla_compliance_pct != null && !isNaN(cat.sla_compliance_pct) ? `${Number(cat.sla_compliance_pct).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No category data available
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

export default ServicesDashboard;
