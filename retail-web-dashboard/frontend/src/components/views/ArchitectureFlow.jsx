import { Database, Zap, Radio } from 'lucide-react';
import ActivityLog from '../shared/ActivityLog';
import { useFetch } from '../../utils/hooks';
import { getArchitectureStats, getArchitectureActivity } from '../../services/api';
import { formatNumber } from '../../utils/formatters';

const ArchitectureFlow = () => {
  const { data: stats, loading: statsLoading } = useFetch(getArchitectureStats, 10000);
  const { data: activity, loading: activityLoading } = useFetch(getArchitectureActivity, 10000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Data Flow Architecture</h1>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-600">LIVE</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Source Systems */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sources</h3>

            {/* PostgreSQL */}
            <div className="relative">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">PostgreSQL</h4>
                    <p className="text-xs text-gray-500">RDS</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <div>• customers</div>
                  <div>• orders</div>
                  <div>• products</div>
                </div>
              </div>
              {/* Arrow to Kafka */}
              <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-blue-400 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-pulse-slow"></div>
                  </div>
                  <div className="w-2 h-2 bg-blue-600 rotate-45 transform translate-x-[-3px]"></div>
                </div>
              </div>
            </div>

            {/* Payments App */}
            <div className="relative">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Zap className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Payments App</h4>
                    <p className="text-xs text-gray-500">Java</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping-slow"></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping-slow" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping-slow" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs text-gray-600">Generating payments...</span>
                </div>
              </div>
              {/* Arrow to Kafka */}
              <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-green-400 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-600 to-transparent animate-pulse-slow"></div>
                  </div>
                  <div className="w-2 h-2 bg-green-600 rotate-45 transform translate-x-[-3px]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Layer */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Processing</h3>

            <div className="relative">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Radio className="w-8 h-8 text-purple-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Confluent Cloud</h4>
                    <p className="text-xs text-gray-500">Kafka + Flink</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded p-2 border border-purple-100">
                    <div className="text-xs font-medium text-gray-700">Kafka Topics</div>
                    <div className="mt-1 flex items-center space-x-1">
                      <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">Streaming data...</span>
                    </div>
                  </div>

                  <div className="bg-white rounded p-2 border border-purple-100">
                    <div className="text-xs font-medium text-gray-700">Flink Processing</div>
                    <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                      <div>• Enrich</div>
                      <div>• Join</div>
                      <div>• Aggregate</div>
                    </div>
                  </div>

                  <div className="bg-white rounded p-2 border border-purple-100">
                    <div className="text-xs font-medium text-gray-700">PostgreSQL Sink</div>
                    <div className="mt-1 flex items-center space-x-1">
                      <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                      <span className="text-xs text-gray-500">Writing to RDS...</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Arrow to PostgreSQL */}
              <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-purple-400 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-600 to-transparent animate-pulse-slow"></div>
                  </div>
                  <div className="w-2 h-2 bg-purple-600 rotate-45 transform translate-x-[-3px]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Analytics</h3>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Database className="w-8 h-8 text-orange-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">PostgreSQL RDS</h4>
                  <p className="text-xs text-gray-500">Analytics Tables</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="bg-white rounded p-2 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">product_sales</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">
                        {statsLoading ? '...' : formatNumber(stats?.product_sales)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded p-2 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">completed_orders</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-xs text-gray-500">
                        {statsLoading ? '...' : formatNumber(stats?.completed_orders)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded p-2 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">customer_snapshot</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-xs text-gray-500">
                        {statsLoading ? '...' : formatNumber(stats?.customer_snapshot)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <ActivityLog activities={activity} loading={activityLoading} />
    </div>
  );
};

export default ArchitectureFlow;
