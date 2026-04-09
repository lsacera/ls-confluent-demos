import React from 'react';
import { DollarSign, ShoppingCart, Users } from 'lucide-react';
import KPICard from '../shared/KPICard';
import LineChart from '../shared/LineChart';
import { useFetch } from '../../utils/hooks';
import { getOverviewKPIs, getHourlySales, getComparison } from '../../services/api';

const OverviewDashboard = () => {
  const { data: kpis, loading: kpisLoading } = useFetch(getOverviewKPIs, 10000);
  const { data: hourlySales, loading: salesLoading } = useFetch(getHourlySales, 10000);
  const { data: comparison, loading: comparisonLoading } = useFetch(getComparison, 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Overview Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Revenue (12h)"
          value={kpis?.revenue}
          trend={comparison?.change_percent}
          icon={DollarSign}
          format="currency"
          loading={kpisLoading || comparisonLoading}
        />
        <KPICard
          title="Orders Completed"
          value={kpis?.total_orders}
          icon={ShoppingCart}
          format="number"
          loading={kpisLoading}
        />
        <KPICard
          title="Active Customers"
          value={kpis?.active_customers}
          icon={Users}
          format="number"
          loading={kpisLoading}
        />
      </div>

      <LineChart
        data={hourlySales}
        xKey="hour"
        yKey="revenue"
        title="Sales by Hour (Last 24h)"
        loading={salesLoading}
      />
    </div>
  );
};

export default OverviewDashboard;
