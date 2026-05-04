const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/customers/top - Top 10 customers by revenue
router.get('/top', async (req, res, next) => {
  const cacheKey = 'customers_top';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const query = `
      SELECT
        customerid,
        customername,
        total_amount,
        number_of_orders,
        updated_at
      FROM thirty_day_customer_snapshot
      WHERE total_amount IS NOT NULL
      ORDER BY total_amount DESC
      LIMIT 10
    `;

    const result = await executeQuery(query);

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/metrics - Average ticket and frequency
router.get('/metrics', async (req, res, next) => {
  const cacheKey = 'customers_metrics';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const query = `
      SELECT
        AVG(total_amount / NULLIF(number_of_orders, 0)) as avg_ticket,
        AVG(number_of_orders) as avg_frequency,
        COUNT(DISTINCT customerid) as total_customers
      FROM thirty_day_customer_snapshot
      WHERE number_of_orders > 0 AND total_amount > 0
    `;

    const result = await executeQuery(query);
    const data = result[0] || { avg_ticket: 0, avg_frequency: 0, total_customers: 0 };

    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/recent-activity - Recent customer activity
router.get('/recent-activity', async (req, res, next) => {
  const cacheKey = 'customers_recent_activity';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const query = `
      SELECT
        customerid,
        customername,
        total_amount,
        number_of_orders,
        updated_at
      FROM thirty_day_customer_snapshot
      WHERE updated_at IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 10
    `;

    const result = await executeQuery(query);

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
