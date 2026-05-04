import { useFetch } from '../../utils/hooks';
import { getOverviewKPIs } from '../../services/api';

export default function OverviewDashboard() {
  const { data, loading, error } = useFetch(getOverviewKPIs, 10000);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  const { cityHealth, alerts, worstAirDistrict, mostDelayedBusLine, overdueServices } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">City Overview</h2>
        <p className="text-gray-600 mt-1">Real-time monitoring of Madrid urban systems</p>
      </div>

      {/* City Health Score */}
      {cityHealth && (
        <div className="card p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Overall City Health</h3>
              <div className="flex items-baseline space-x-3">
                <span className="text-6xl font-bold text-gray-900">{cityHealth.overall_health_score}</span>
                <span className="text-2xl text-gray-600">/100</span>
              </div>
              <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium ${getHealthBadgeClass(cityHealth.health_status)}`}>
                {cityHealth.health_status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MetricPill label="Traffic" value={cityHealth.traffic_fluidity_score} />
              <MetricPill label="Air Quality" value={cityHealth.air_quality_score} />
              <MetricPill label="EMT Reliability" value={cityHealth.emt_reliability_score} />
              <MetricPill label="Services" value={cityHealth.citizen_service_score} />
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Alerts"
          value={alerts.total_alerts}
          icon="🚨"
          subtitle={`${alerts.critical_alerts} critical`}
          trend={alerts.critical_alerts > 0 ? 'up' : 'stable'}
        />

        <StatCard
          label="Average Speed"
          value={`${cityHealth?.city_avg_speed?.toFixed(1) ?? '--'} km/h`}
          icon="🚗"
          subtitle={`${cityHealth?.total_city_vehicles ?? 0} vehicles`}
        />

        <StatCard
          label="Air Quality Index"
          value={cityHealth?.city_avg_aqi ?? '--'}
          icon="🌫️"
          subtitle={`PM2.5: ${cityHealth?.city_avg_pm25?.toFixed(1) ?? '--'} µg/m³`}
          trend={cityHealth?.city_avg_aqi > 100 ? 'down' : 'stable'}
        />

        <StatCard
          label="EMT Buses"
          value={cityHealth?.total_emt_buses ?? '--'}
          icon="🚌"
          subtitle={`Avg delay: ${cityHealth?.avg_bus_delay?.toFixed(1) ?? '0.0'} min`}
        />
      </div>

      {/* Alerts and Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Alerts */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Alerts (Last Hour)</h3>
          <div className="space-y-3">
            <AlertRow severity="CRITICAL" count={alerts.critical_alerts} />
            <AlertRow severity="HIGH" count={alerts.high_alerts} />
            <AlertRow severity="MEDIUM" count={alerts.medium_alerts} />
          </div>
        </div>

        {/* Air Quality Hot Spots */}
        {worstAirDistrict && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Air Quality Hot Spot</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xl font-semibold text-gray-900">{worstAirDistrict.district}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {worstAirDistrict.unhealthy_air_stations} unhealthy station(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{worstAirDistrict.avg_aqi}</p>
                  <p className="text-xs text-gray-600">AQI</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Issues */}
      {mostDelayedBusLine && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Delayed Bus Line</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-2xl font-bold text-gray-900">Line {mostDelayedBusLine.bus_line}</span>
                <p className="text-sm text-gray-600 mt-1">{mostDelayedBusLine.buses_delayed} delayed buses</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-red-600">+{mostDelayedBusLine.avg_delay_minutes.toFixed(1)}</p>
                <p className="text-sm text-gray-600">minutes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {overdueServices && overdueServices.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overdue Service Tickets</h3>
          <div className="space-y-2">
            {overdueServices.map((service, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 rounded p-3 border border-gray-200">
                <span className="text-gray-900 font-medium">{service.category}</span>
                <span className="text-gray-600 text-sm">{service.priority}</span>
                <span className="text-red-600 font-semibold">{service.total_overdue} overdue</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricPill({ label, value }) {
  return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
      <p className="text-xs text-blue-600 font-medium">{label}</p>
      <p className="text-2xl font-bold text-blue-900 mt-1">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon, subtitle, trend }) {
  const trendColors = {
    up: 'text-red-600',
    down: 'text-red-600',
    stable: 'text-green-600'
  };

  return (
    <div className="stat-card">
      <div className="flex justify-between items-start">
        <p className="stat-label">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="stat-value">{value}</p>
      {subtitle && (
        <p className={`text-sm mt-2 ${trendColors[trend] || 'text-gray-600'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function AlertRow({ severity, count }) {
  const colors = {
    CRITICAL: 'bg-red-50 text-red-700 border-red-300',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-300',
    MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-300'
  };

  return (
    <div className={`flex justify-between items-center px-4 py-2 rounded border ${colors[severity]}`}>
      <span className="font-medium">{severity}</span>
      <span className="font-bold text-lg">{count}</span>
    </div>
  );
}

function getHealthBadgeClass(status) {
  const classes = {
    EXCELLENT: 'bg-green-100 text-green-700 border border-green-300',
    GOOD: 'bg-blue-100 text-blue-700 border border-blue-300',
    MODERATE: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    POOR: 'bg-red-100 text-red-700 border border-red-300'
  };
  return classes[status] || classes.MODERATE;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-4">
      <p className="text-red-700">Error: {message}</p>
    </div>
  );
}
