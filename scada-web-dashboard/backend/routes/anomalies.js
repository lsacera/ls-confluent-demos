const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/anomalies/recent - Last 100 alerts with pagination
router.get('/recent', async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const cacheKey = `anomalies_recent_${limit}_${offset}`;
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const tableExistsQuery = `
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_anomalies') as exists
    `;
    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].exists) {
      const query = `
        SELECT
          sensor_id,
          alert_timestamp::TEXT as alert_timestamp,
          alert_type,
          severity,
          measured_value,
          threshold_value,
          zone_id,
          state
        FROM scada_anomalies
        WHERE alert_timestamp IS NOT NULL
        ORDER BY alert_timestamp DESC
        LIMIT $1 OFFSET $2
      `;

      result = await executeQuery(query, [limit, offset]);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /recent endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/anomalies/by-severity - Count by severity
router.get('/by-severity', async (req, res, next) => {
  const cacheKey = 'anomalies_by_severity';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const tableExistsQuery = `
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_anomalies') as exists
    `;
    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].exists) {
      const query = `
        SELECT
          severity,
          COUNT(*)::INTEGER as count
        FROM scada_anomalies
        WHERE alert_timestamp >= NOW() - INTERVAL '24 HOURS'
        GROUP BY severity
        ORDER BY
          CASE severity
            WHEN 'CRITICAL' THEN 1
            WHEN 'WARNING' THEN 2
            WHEN 'INFO' THEN 3
            ELSE 4
          END
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /by-severity endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/anomalies/by-type - Count by alert type
router.get('/by-type', async (req, res, next) => {
  const cacheKey = 'anomalies_by_type';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const tableExistsQuery = `
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_anomalies') as exists
    `;
    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].exists) {
      const query = `
        SELECT
          alert_type,
          COUNT(*)::INTEGER as count,
          AVG(measured_value) as avg_measured_value,
          AVG(threshold_value) as avg_threshold_value
        FROM scada_anomalies
        WHERE alert_timestamp >= NOW() - INTERVAL '24 HOURS'
        GROUP BY alert_type
        ORDER BY count DESC
        LIMIT 10
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /by-type endpoint:', error.message);
    res.json([]);
  }
});

module.exports = router;
