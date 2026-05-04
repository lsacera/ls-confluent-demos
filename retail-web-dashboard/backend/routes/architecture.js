const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/architecture/stats - Statistics for architecture diagram
router.get('/stats', async (req, res, next) => {
  const cacheKey = 'architecture_stats';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    // Check which tables exist
    const tableExistsQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('product_sales', 'completed_orders', 'thirty_day_customer_snapshot')
    `;

    const existingTablesResult = await executeQuery(tableExistsQuery);
    const existingTables = new Set(existingTablesResult.map(row => row.table_name));

    // Get row counts only from existing tables
    const stats = {
      product_sales: 0,
      completed_orders: 0,
      customer_snapshot: 0,
      timestamp: new Date().toISOString()
    };

    if (existingTables.has('product_sales')) {
      const result = await executeQuery(
        `SELECT COUNT(*) as count FROM product_sales WHERE orderdate >= NOW() - INTERVAL '1 DAY'`
      );
      stats.product_sales = parseInt(result[0]?.count || 0);
    }

    if (existingTables.has('completed_orders')) {
      const result = await executeQuery(
        `SELECT COUNT(*) as count FROM completed_orders WHERE ts >= NOW() - INTERVAL '1 DAY'`
      );
      stats.completed_orders = parseInt(result[0]?.count || 0);
    }

    if (existingTables.has('thirty_day_customer_snapshot')) {
      const result = await executeQuery(
        `SELECT COUNT(*) as count FROM thirty_day_customer_snapshot`
      );
      stats.customer_snapshot = parseInt(result[0]?.count || 0);
    }

    req.cache.set(cacheKey, stats);
    res.json(stats);
  } catch (error) {
    console.error('Error in architecture/stats endpoint:', error.message);
    // Return zeros instead of 500 error
    res.json({
      product_sales: 0,
      completed_orders: 0,
      customer_snapshot: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/architecture/activity - Recent activity log
router.get('/activity', async (req, res, next) => {
  const cacheKey = 'architecture_activity';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
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

    let query;

    if (!tableExists) {
      // Table doesn't exist, only show recent orders
      query = `
        SELECT
          'order' as event_type,
          orderid as event_id,
          productname as description,
          orderdate as event_time
        FROM product_sales
        WHERE orderdate >= NOW() - INTERVAL '5 MINUTES'
        ORDER BY orderdate DESC
        LIMIT 10
      `;
    } else {
      // Table exists, show both orders and payments
      query = `
        WITH recent_orders AS (
          SELECT
            'order' as event_type,
            orderid as event_id,
            productname as description,
            orderdate as event_time
          FROM product_sales
          WHERE orderdate >= NOW() - INTERVAL '5 MINUTES'
          ORDER BY orderdate DESC
          LIMIT 5
        ),
        recent_payments AS (
          SELECT
            'payment' as event_type,
            order_id as event_id,
            CONCAT('Payment validated: $', ROUND(amount::numeric, 2)::TEXT) as description,
            ts as event_time
          FROM completed_orders
          WHERE ts >= NOW() - INTERVAL '5 MINUTES'
          ORDER BY ts DESC
          LIMIT 5
        )
        SELECT * FROM recent_orders
        UNION ALL
        SELECT * FROM recent_payments
        ORDER BY event_time DESC
        LIMIT 10
      `;
    }

    const result = await executeQuery(query);

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in architecture/activity endpoint:', error.message);
    // Return empty array instead of 500 error
    res.json([]);
  }
});

module.exports = router;
