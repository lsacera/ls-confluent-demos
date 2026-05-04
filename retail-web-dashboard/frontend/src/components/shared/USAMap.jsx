import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { formatCurrency } from '../../utils/formatters';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const USAMap = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-96 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Loading map...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 h-96 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No geographic data available</span>
      </div>
    );
  }

  // Create a map of state names to revenue
  const stateData = data.reduce((acc, item) => {
    if (item.state) {
      // Store by state name (lowercase) for matching
      acc[item.state.toLowerCase()] = item.revenue;
    }
    return acc;
  }, {});

  // Calculate color scale
  const maxRevenue = Math.max(...Object.values(stateData), 1);
  const colorScale = scaleLinear()
    .domain([0, maxRevenue])
    .range(['#fee2e2', '#dc2626']); // red-100 to red-600

  return (
    <div className="relative">
      <ComposableMap projection="geoAlbersUsa" className="w-full h-96">
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const stateName = geo.properties.name; // Full state name from GeoJSON
              const revenue = stateData[stateName.toLowerCase()] || 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={revenue > 0 ? colorScale(revenue) : '#f3f4f6'}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      fill: '#991b1b',
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: { outline: 'none' },
                  }}
                  title={`${stateName}: ${revenue > 0 ? formatCurrency(revenue) : 'No data'}`}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="text-xs font-semibold text-gray-700 mb-2">Revenue</div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Low</span>
          <div className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-6 h-4"
                style={{
                  backgroundColor: colorScale((maxRevenue / 4) * i),
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">High</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Max: {formatCurrency(maxRevenue)}
        </div>
      </div>
    </div>
  );
};

export default USAMap;
