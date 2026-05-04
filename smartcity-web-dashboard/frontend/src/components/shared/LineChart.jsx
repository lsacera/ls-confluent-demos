import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const LineChart = ({ data, xKey, yKey, title, loading = false, height = 300, valueFormatter, suffix = '' }) => {
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

  const formatXAxis = (value) => {
    const date = new Date(value);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Default formatter is currency, but can be overridden
  const defaultFormatter = valueFormatter || ((value) => formatCurrency(value));
  const yAxisFormatter = (value) => suffix ? `${Math.round(value)}${suffix}` : defaultFormatter(value);
  const tooltipFormatter = (value) => suffix ? `${Math.round(value)}${suffix}` : defaultFormatter(value);

  // Calculate interval for x-axis ticks to avoid overcrowding
  const tickInterval = Math.max(0, Math.ceil(data.length / 8));

  // For charts with suffix (like " min"), get domain to ensure integer ticks
  const getDomain = () => {
    if (!suffix || !data || data.length === 0) return ['auto', 'auto'];
    const values = data.map(d => d[yKey]).filter(v => v != null);
    if (values.length === 0) return ['auto', 'auto'];
    const min = Math.floor(Math.min(...values));
    const max = Math.ceil(Math.max(...values));
    return [min, max];
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            tickFormatter={formatXAxis}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            interval={tickInterval}
          />
          <YAxis
            tickFormatter={yAxisFormatter}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={getDomain()}
            allowDecimals={false}
          />
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={formatXAxis}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ fill: '#0ea5e9', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
