const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/overview/kpis - Main KPIs for last 24 hours
router.get('/kpis', async (req, res, next) => {
  const cacheKey = 'overview_kpis';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const query = `
      SELECT
        SUM(total_amount) as revenue,
        COUNT(DISTINCT orderid) as total_orders,
        COUNT(DISTINCT customerid) as active_customers
      FROM product_sales
      WHERE orderdate >= NOW() - INTERVAL '1 DAY'
    `;

    const result = await executeQuery(query);
    const data = result[0] || { revenue: 0, total_orders: 0, active_customers: 0 };

    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/overview/hourly-sales - Sales by hour for last 24h
router.get('/hourly-sales', async (req, res, next) => {
  const cacheKey = 'overview_hourly_sales';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const query = `
      SELECT
        DATE_TRUNC('hour', orderdate) as hour,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT orderid) as num_orders
      FROM product_sales
      WHERE orderdate >= NOW() - INTERVAL '1 DAY'
      GROUP BY DATE_TRUNC('hour', orderdate)
      ORDER BY hour
    `;

    const result = await executeQuery(query);

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/overview/comparison - Compare with previous period
router.get('/comparison', async (req, res, next) => {
  const cacheKey = 'overview_comparison';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const query = `
      WITH today AS (
        SELECT SUM(total_amount) as revenue
        FROM product_sales
        WHERE orderdate >= NOW() - INTERVAL '1 DAY'
      ),
      yesterday AS (
        SELECT SUM(total_amount) as revenue
        FROM product_sales
        WHERE orderdate >= NOW() - INTERVAL '2 DAY'
          AND orderdate < NOW() - INTERVAL '1 DAY'
      )
      SELECT
        today.revenue as today_revenue,
        yesterday.revenue as yesterday_revenue,
        CASE
          WHEN yesterday.revenue > 0 THEN
            ((today.revenue - yesterday.revenue) / yesterday.revenue) * 100
          ELSE 0
        END as change_percent
      FROM today, yesterday
    `;

    const result = await executeQuery(query);
    const data = result[0] || { today_revenue: 0, yesterday_revenue: 0, change_percent: 0 };

    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
