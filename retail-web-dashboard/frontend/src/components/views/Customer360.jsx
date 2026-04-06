import React from 'react';
import { formatCurrency, formatNumber, formatRelativeTime, toNumber } from '../../utils/formatters';
import { useFetch } from '../../utils/hooks';
import { getTopCustomers, getCustomerMetrics } from '../../services/api';
import { Trophy, TrendingUp, Users, DollarSign } from 'lucide-react';

const Customer360 = () => {
  const { data: topCustomers, loading: customersLoading } = useFetch(getTopCustomers, 10000);
  const { data: metrics, loading: metricsLoading } = useFetch(getCustomerMetrics, 10000);

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';

    // El timestamp podría venir en segundos o milisegundos
    // Si el número es muy grande (más de 13 dígitos), está en microsegundos
    // Si tiene 13 dígitos, está en milisegundos
    // Si tiene 10 dígitos, está en segundos
    const timestampNum = Number(timestamp);
    const timestampStr = String(timestampNum);

    let date;
    if (timestampStr.length >= 16) {
      // Microsegundos - dividir por 1000
      date = new Date(timestampNum / 1000);
    } else if (timestampStr.length === 13) {
      // Milisegundos
      date = new Date(timestampNum);
    } else {
      // Segundos - multiplicar por 1000
      date = new Date(timestampNum * 1000);
    }

    return formatRelativeTime(date.toISOString());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer 360 Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Ticket</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {metricsLoading ? '...' : formatCurrency(metrics?.avg_ticket)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Frequency</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {metricsLoading ? '...' : `${toNumber(metrics?.avg_frequency).toFixed(1)} orders`}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {metricsLoading ? '...' : formatNumber(metrics?.total_customers)}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Top 10 Customers (Last 30 Days)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customersLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="5" className="px-4 py-3">
                      <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : topCustomers && topCustomers.length > 0 ? (
                topCustomers.map((customer, index) => (
                  <tr key={customer.customerid} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getMedalEmoji(index)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.customername}</div>
                      <div className="text-sm text-gray-500">ID: {customer.customerid}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(customer.total_amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(customer.number_of_orders)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(customer.updated_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-center text-gray-500">
                    No customer data available
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

export default Customer360;
