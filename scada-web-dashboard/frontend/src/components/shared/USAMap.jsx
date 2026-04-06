import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const USAMap = ({ data = [], loading = false, valueKey = 'revenue', format = 'currency', label = 'Value', colorRange = null }) => {
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

  // Create a map of state names to values
  const stateData = data.reduce((acc, item) => {
    if (item.state) {
      // Store by state name (lowercase) for matching
      acc[item.state.toLowerCase()] = item[valueKey] || 0;
    }
    return acc;
  }, {});

  // Calculate color scale
  const maxValue = Math.max(...Object.values(stateData), 1);

  // Use custom color range if provided, otherwise default to blue
  const defaultColorRange = colorRange || ['#dbeafe', '#1e40af']; // blue-100 to blue-800
  const colorScale = scaleLinear()
    .domain([0, maxValue])
    .range(defaultColorRange);

  return (
    <div className="relative">
      <ComposableMap projection="geoAlbersUsa" className="w-full h-96">
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const stateName = geo.properties.name; // Full state name from GeoJSON
              const value = stateData[stateName.toLowerCase()] || 0;
              const formattedValue = format === 'currency' ? formatCurrency(value) : formatNumber(value);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={value > 0 ? colorScale(value) : '#f3f4f6'}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      fill: '#1e3a8a',
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: { outline: 'none' },
                  }}
                  title={`${stateName}: ${value > 0 ? formattedValue : 'No data'}`}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="text-xs font-semibold text-gray-700 mb-2">{label}</div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Low</span>
          <div className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-6 h-4"
                style={{
                  backgroundColor: colorScale((maxValue / 4) * i),
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">High</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Max: {format === 'currency' ? formatCurrency(maxValue) : formatNumber(maxValue)}
        </div>
      </div>
    </div>
  );
};

export default USAMap;
