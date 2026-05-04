import React from 'react';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/formatters';

const COLORS = ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DonutChart = ({ data, title, loading = false, valueKey = 'revenue', labelKey = 'name', format = 'currency' }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);

  const chartData = data.map(item => ({
    name: item[labelKey],
    value: item[valueKey] || 0,
    percentage: total > 0 ? ((item[valueKey] || 0) / total) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // Severity color mapping
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'WARNING': return 'bg-orange-500';
      case 'INFO': return 'bg-blue-500';
      case 'OFFLINE': return 'bg-gray-500';
      case 'HEALTHY': return 'bg-green-500';
      default: return 'bg-sky-500';
    }
  };

  const getTextColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'text-red-700';
      case 'WARNING': return 'text-orange-700';
      case 'INFO': return 'text-blue-700';
      case 'OFFLINE': return 'text-gray-700';
      case 'HEALTHY': return 'text-green-700';
      default: return 'text-sky-700';
    }
  };

  const formatValue = (value) => {
    return format === 'currency' ? formatCurrency(value) : formatNumber(value);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {/* Bar chart visualization */}
        <div className="space-y-3">
          {chartData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-medium ${getTextColor(item.name)}`}>
                  {item.name}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatValue(item.value)} ({formatPercent(item.percentage)})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getSeverityColor(item.name)} transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatValue(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
