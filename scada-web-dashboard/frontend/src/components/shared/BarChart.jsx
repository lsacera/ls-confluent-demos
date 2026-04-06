import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const BarChart = ({ data, title, valueKey = 'revenue', labelKey = 'name', maxItems = 10, loading = false, format = 'currency', formatLabel = null }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item[valueKey]));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.slice(0, maxItems).map((item, index) => {
          const percentage = (item[valueKey] / maxValue) * 100;

          return (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {index + 1}. {formatLabel ? formatLabel(item[labelKey]) : item[labelKey]}
                </span>
                <span className="text-gray-900 font-semibold">
                  {format === 'currency' ? formatCurrency(item[valueKey]) : formatNumber(item[valueKey])}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              {item.num_orders && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatNumber(item.num_orders)} orders
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
