import BarChart from '../shared/BarChart';
import USAMap from '../shared/USAMap';
import { useFetch } from '../../utils/hooks';
import { getSalesByState } from '../../services/api';

const GeographicView = () => {
  const { data: salesByState, loading: statesLoading } = useFetch(() => getSalesByState(7), 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Geographic Analytics</h1>

      {/* USA Map */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by State (Last 7 days)</h2>
        <USAMap data={salesByState} loading={statesLoading} />
      </div>

      {/* Bar Chart - keep as backup/detail view */}
      <BarChart
        data={salesByState}
        title="Top 5 States (Detail View)"
        valueKey="revenue"
        labelKey="state"
        maxItems={5}
        loading={statesLoading}
      />
    </div>
  );
};

export default GeographicView;
