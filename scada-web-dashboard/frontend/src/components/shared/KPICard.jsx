import React from 'react';
import { formatCurrency, formatNumber, getTrendIcon, getTrendColor } from '../../utils/formatters';

const KPICard = ({ title, value, trend, icon: Icon, format = 'number', loading = false }) => {
  const formatValue = (val) => {
    if (loading) return '...';
    if (val === null || val === undefined) return 'N/A';

    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'number':
        return formatNumber(val);
      default:
        return val;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {formatValue(value)}
          </p>
          {trend !== null && trend !== undefined && (
            <p className={`text-sm mt-2 ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)} {Math.abs(trend).toFixed(1)}% vs yesterday
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-4">
            <div className="bg-primary-100 rounded-full p-3">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
