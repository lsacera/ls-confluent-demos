import React from 'react';
import BarChart from '../shared/BarChart';
import DonutChart from '../shared/DonutChart';
import { useFetch } from '../../utils/hooks';
import { getTopProducts, getTopBrands, getBrandDistribution } from '../../services/api';

const ProductAnalytics = () => {
  const { data: topProducts, loading: productsLoading } = useFetch(() => getTopProducts(7), 10000);
  const { data: topBrands, loading: brandsLoading } = useFetch(() => getTopBrands(7), 10000);
  const { data: distribution, loading: distributionLoading } = useFetch(() => getBrandDistribution(7), 10000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Product Performance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={topProducts}
          title="Top 5 Products (Last 7 Days)"
          valueKey="revenue"
          labelKey="productname"
          maxItems={5}
          loading={productsLoading}
        />
        <BarChart
          data={topBrands}
          title="Top 5 Brands (Last 7 Days)"
          valueKey="revenue"
          labelKey="brand"
          maxItems={5}
          loading={brandsLoading}
        />
      </div>

      <DonutChart
        data={distribution}
        title="Brand Distribution by Revenue"
        loading={distributionLoading}
      />
    </div>
  );
};

export default ProductAnalytics;
