import React from 'react';
import { Building2, Navigation, Wind, AlertTriangle } from 'lucide-react';
import KPICard from '../shared/KPICard';
import { useFetch } from '../../utils/hooks';
import { getDistricts, getDistrictsStats } from '../../services/api';
import { formatNumber, formatDecimal, getTrafficStatusColor } from '../../utils/formatters';

const DistrictsDashboard = () => {
  const { data: districts, loading: districtsLoading } = useFetch(getDistricts, 10000);
  const { data: stats, loading: statsLoading } = useFetch(getDistrictsStats, 10000);

  // Calculate overall KPIs
  const totalDistricts = districts?.length || 0;
  const avgSpeed = stats?.avg_speed || 0;
  const avgAQI = stats?.avg_aqi || 0;
  const totalCongested = districts?.reduce((sum, d) => sum + (d.congested_sensors || 0), 0) || 0;

  const getAQIStatusColor = (aqi) => {
    if (aqi <= 50) return 'text-green-600 bg-green-50';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-50';
    if (aqi <= 150) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrafficStatus = (speed, occupancy) => {
    if (speed >= 40) return 'FLUID';
    if (speed >= 25) return 'MODERATE';
    if (speed >= 15) return 'CONGESTED';
    return 'BLOCKED';
  };

  const getAirQualityLevel = (aqi) => {
    if (aqi <= 50) return 'GOOD';
    if (aqi <= 100) return 'MODERATE';
    if (aqi <= 150) return 'UNHEALTHY_SENSITIVE';
    if (aqi <= 200) return 'UNHEALTHY';
    return 'VERY_UNHEALTHY';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">District Monitoring</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Districts"
          value={totalDistricts}
          icon={Building2}
          format="number"
          loading={districtsLoading}
        />
        <KPICard
          title="Avg Speed"
          value={avgSpeed ? `${formatDecimal(avgSpeed, 1)} km/h` : 'N/A'}
          icon={Navigation}
          format="custom"
          loading={statsLoading}
        />
        <KPICard
          title="Avg AQI"
          value={avgAQI ? formatDecimal(avgAQI, 0) : 'N/A'}
          icon={Wind}
          format="custom"
          loading={statsLoading}
        />
        <KPICard
          title="Congested Areas"
          value={totalCongested}
          icon={AlertTriangle}
          format="number"
          loading={districtsLoading}
        />
      </div>

      {/* Districts Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">District Statistics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Traffic Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Speed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Congested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Air Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AQI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PM2.5
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {districtsLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : districts && districts.length > 0 ? (
                districts.map((district) => {
                  const trafficStatus = getTrafficStatus(district.avg_traffic_speed, district.avg_occupancy);
                  const airQualityLevel = getAirQualityLevel(district.avg_aqi);

                  return (
                    <tr key={district.district} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {district.district}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTrafficStatusColor(trafficStatus)}`}>
                          {trafficStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {district.avg_traffic_speed ? `${formatDecimal(district.avg_traffic_speed, 1)} km/h` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(district.total_vehicles || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {district.congested_sensors || 0} / {district.total_traffic_sensors || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAQIStatusColor(district.avg_aqi)}`}>
                          {airQualityLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {district.avg_aqi ? formatDecimal(district.avg_aqi, 0) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {district.avg_pm25 ? `${formatDecimal(district.avg_pm25, 1)} µg/m³` : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No district data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* District Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Traffic Flow */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Traffic Flow</h3>
          <div className="space-y-3">
            {districts
              ?.filter(d => d.avg_traffic_speed)
              ?.sort((a, b) => (b.avg_traffic_speed || 0) - (a.avg_traffic_speed || 0))
              ?.slice(0, 5)
              ?.map((d, idx) => (
                <div key={d.district} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-500">#{idx + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{d.district}</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatDecimal(d.avg_traffic_speed, 1)} km/h
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Worst Air Quality */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Worst Air Quality</h3>
          <div className="space-y-3">
            {districts
              ?.filter(d => d.avg_aqi)
              ?.sort((a, b) => (b.avg_aqi || 0) - (a.avg_aqi || 0))
              ?.slice(0, 5)
              ?.map((d, idx) => (
                <div key={d.district} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-500">#{idx + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{d.district}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    AQI {formatDecimal(d.avg_aqi, 0)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Most Congested */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Congested</h3>
          <div className="space-y-3">
            {districts
              ?.filter(d => d.total_traffic_sensors > 0)
              ?.sort((a, b) => {
                const ratioA = (a.congested_sensors || 0) / (a.total_traffic_sensors || 1);
                const ratioB = (b.congested_sensors || 0) / (b.total_traffic_sensors || 1);
                return ratioB - ratioA;
              })
              ?.slice(0, 5)
              ?.map((d, idx) => {
                const congestionPct = ((d.congested_sensors || 0) / (d.total_traffic_sensors || 1)) * 100;
                return (
                  <div key={d.district} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-500">#{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{d.district}</span>
                    </div>
                    <span className="text-sm font-semibold text-orange-600">
                      {formatDecimal(congestionPct, 0)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictsDashboard;
