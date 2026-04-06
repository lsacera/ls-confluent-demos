import { useFetch } from '../../utils/hooks';
import { getPaymentCompletion } from '../../services/api';
import { formatNumber, formatPercent } from '../../utils/formatters';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const PaymentCompletion = () => {
  const { data: paymentStats, loading: paymentsLoading } = useFetch(() => getPaymentCompletion(1), 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payment Completion Rate</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Real-time Payment Analytics (Last 24h)</h2>

        {paymentsLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : paymentStats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(paymentStats.completed_orders)}
                  </p>
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    {formatPercent(paymentStats.completion_rate)} completion
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
                <div className="bg-yellow-100 rounded-full p-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(paymentStats.pending_orders)}
                  </p>
                  <p className="text-sm text-yellow-600 mt-1 font-medium">
                    {formatPercent(100 - paymentStats.completion_rate)} pending
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-100 rounded-full p-3">
                  <AlertCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(paymentStats.total_orders)}
                  </p>
                  <p className="text-sm text-blue-600 mt-1 font-medium">
                    Last 24 hours
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Completion Progress</span>
                <span className="font-bold text-gray-900 text-lg">
                  {formatPercent(paymentStats.completion_rate)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${paymentStats.completion_rate}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {paymentStats.completion_rate > 15 && formatPercent(paymentStats.completion_rate, 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatNumber(paymentStats.completed_orders)}
                </p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${paymentStats.completion_rate}%` }}
                    />
                  </div>
                  {formatPercent(paymentStats.completion_rate, 0)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatNumber(paymentStats.pending_orders)}
                </p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full"
                      style={{ width: `${100 - paymentStats.completion_rate}%` }}
                    />
                  </div>
                  {formatPercent(100 - paymentStats.completion_rate, 0)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">No payment data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCompletion;
