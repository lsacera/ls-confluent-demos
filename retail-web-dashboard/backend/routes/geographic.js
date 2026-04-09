const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/geographic/by-state - Sales by state
router.get('/by-state', async (req, res, next) => {
  const cacheKey = 'geographic_by_state';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const days = parseInt(req.query.days) || 7;

    const query = `
      SELECT
        shipping_address_state as state,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT orderid) as num_orders,
        COUNT(DISTINCT customerid) as num_customers
      FROM product_sales
      WHERE orderdate >= NOW() - INTERVAL '${days} DAY'
        AND shipping_address_state IS NOT NULL
        AND shipping_address_state != ''
      GROUP BY shipping_address_state
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

// GET /api/geographic/payment-completion - Payment completion rate
router.get('/payment-completion', async (req, res, next) => {
  const cacheKey = 'geographic_payment_completion';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const days = parseInt(req.query.days) || 1;

    // Check if completed_orders table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'completed_orders'
      ) as exists
    `;

    const tableCheckResult = await executeQuery(tableExistsQuery);
    const tableExists = tableCheckResult[0]?.exists;

    let data;

    if (!tableExists) {
      // Table doesn't exist, return zeros
      data = {
        completed_orders: 0,
        total_orders: 0,
        pending_orders: 0,
        completion_rate: 0
      };
    } else {
      // Table exists, run the query
      const query = `
        WITH completed AS (
          SELECT COUNT(DISTINCT order_id) as count
          FROM completed_orders
          WHERE ts >= NOW() - INTERVAL '${days} DAY'
        ),
        total AS (
          SELECT COUNT(DISTINCT orderid) as count
          FROM orders
          WHERE orderdate >= NOW() - INTERVAL '${days} DAY'
        )
        SELECT
          COALESCE(completed.count, 0) as completed_orders,
          COALESCE(total.count, 0) as total_orders,
          COALESCE((total.count - completed.count), 0) as pending_orders,
          CASE
            WHEN total.count > 0 THEN (completed.count * 100.0 / total.count)
            ELSE 0
          END as completion_rate
        FROM completed, total
      `;

      const result = await executeQuery(query);
      data = result[0] || {
        completed_orders: 0,
        total_orders: 0,
        pending_orders: 0,
        completion_rate: 0
      };
    }

    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in payment-completion endpoint:', error.message);
    // Return default data instead of 500 error
    const data = {
      completed_orders: 0,
      total_orders: 0,
      pending_orders: 0,
      completion_rate: 0
    };
    res.json(data);
  }
});

module.exports = router;
