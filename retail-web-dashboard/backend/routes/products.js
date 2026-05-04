const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/products/top - Top 10 products by revenue
router.get('/top', async (req, res, next) => {
  const cacheKey = 'products_top';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const days = parseInt(req.query.days) || 7;

    const query = `
      SELECT
        productname,
        brand,
        SUM(total_amount) as revenue,
        SUM(quantity) as units_sold,
        COUNT(DISTINCT orderid) as num_orders
      FROM product_sales
      WHERE orderdate >= NOW() - INTERVAL '${days} DAY'
      GROUP BY productname, brand
      ORDER BY revenue DESC
      LIMIT 10
    `;

    const result = await executeQuery(query);

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/brands - Top brands by revenue
router.get('/brands', async (req, res, next) => {
  const cacheKey = 'products_brands';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const days = parseInt(req.query.days) || 7;

    const query = `
      SELECT
        brand,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT orderid) as num_orders,
        SUM(quantity) as units_sold
      FROM product_sales
      WHERE orderdate >= NOW() - INTERVAL '${days} DAY'
      GROUP BY brand
      ORDER BY revenue DESC
      LIMIT 10
    `;

    const result = await executeQuery(query);

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/distribution - Brand distribution for donut chart
router.get('/distribution', async (req, res, next) => {
  const cacheKey = 'products_distribution';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const days = parseInt(req.query.days) || 7;

    const query = `
      WITH brand_revenue AS (
        SELECT
          brand,
          SUM(total_amount)::DECIMAL as revenue
        FROM product_sales
        WHERE orderdate >= NOW() - INTERVAL '${days} DAY'
          AND brand IS NOT NULL
        GROUP BY brand
      ),
      total_revenue AS (
        SELECT COALESCE(SUM(revenue), 0)::DECIMAL as total FROM brand_revenue
      ),
      top_brands AS (
        SELECT
          brand,
          revenue,
          CASE
            WHEN (SELECT total FROM total_revenue) > 0
            THEN ROUND((revenue / (SELECT total FROM total_revenue) * 100)::NUMERIC, 1)
            ELSE 0
          END as percentage
        FROM brand_revenue
        ORDER BY revenue DESC
        LIMIT 5
      )
      SELECT
        brand,
        revenue,
        percentage
      FROM top_brands
      WHERE revenue > 0
      UNION ALL
      SELECT
        'Others' as brand,
        COALESCE(SUM(br.revenue), 0) as revenue,
        CASE
          WHEN (SELECT total FROM total_revenue) > 0
          THEN ROUND((COALESCE(SUM(br.revenue), 0) / (SELECT total FROM total_revenue) * 100)::NUMERIC, 1)
          ELSE 0
        END as percentage
      FROM brand_revenue br
      WHERE br.brand NOT IN (SELECT brand FROM top_brands)
        AND (SELECT COUNT(*) FROM top_brands) > 0
      HAVING SUM(br.revenue) > 0
    `;

    const result = await executeQuery(query);

    // Clean up escaped quotes from brand names and convert to numbers
    const cleanedResult = result.map(row => ({
      brand: row.brand ? row.brand.replace(/^"|"$/g, '') : row.brand,
      revenue: parseFloat(row.revenue) || 0,
      percentage: parseFloat(row.percentage) || 0
    }));

    req.cache.set(cacheKey, cleanedResult);
    res.json(cleanedResult);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
