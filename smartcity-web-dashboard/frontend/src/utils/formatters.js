export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return '0';
  return new Intl.NumberFormat('en-US').format(numValue);
};

export const formatNumberWithDecimals = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0';
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue);
};

export const formatDecimal = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0';
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return '0';
  return numValue.toFixed(decimals);
};

export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined) return '$0';
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return '$0';
  return `$${numValue.toFixed(decimals)}`;
};

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return '0%';
  return `${numValue.toFixed(decimals)}%`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateString);
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatHour = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateString);
    return 'Invalid';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
  }).format(date);
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date for relative time:', dateString);
    return 'Unknown';
  }

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(dateString);
};

export const getTrendIcon = (value) => {
  if (value > 0) return '↑';
  if (value < 0) return '↓';
  return '→';
};

export const getTrendColor = (value) => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

export const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

export const getSeverityColor = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'text-red-600 bg-red-50';
    case 'HIGH':
      return 'text-orange-600 bg-orange-50';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50';
    case 'LOW':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getHealthStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'EXCELLENT':
      return 'text-green-600 bg-green-50';
    case 'GOOD':
      return 'text-blue-600 bg-blue-50';
    case 'MODERATE':
      return 'text-yellow-600 bg-yellow-50';
    case 'POOR':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getTrafficStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'FLUID':
      return 'text-green-600 bg-green-50';
    case 'MODERATE':
      return 'text-yellow-600 bg-yellow-50';
    case 'CONGESTED':
      return 'text-orange-600 bg-orange-50';
    case 'BLOCKED':
      return 'text-red-600 bg-red-50';
    case 'OFFLINE':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};
