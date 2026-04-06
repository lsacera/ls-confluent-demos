const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/sensors/health-summary - Count by status
router.get('/health-summary', async (req, res, next) => {
  const cacheKey = 'sensors_health_summary';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const tableExistsQuery = `
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_sensor_health') as exists
    `;
    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].exists) {
      const query = `
        WITH latest_readings AS (
          SELECT sensor_id, MAX(window_start) as latest_window
          FROM scada_sensor_health
          GROUP BY sensor_id
        )
        SELECT
          h.status,
          COUNT(*)::INTEGER as count
        FROM scada_sensor_health h
        INNER JOIN latest_readings lr
          ON h.sensor_id = lr.sensor_id
          AND h.window_start = lr.latest_window
        GROUP BY h.status
        ORDER BY
          CASE h.status
            WHEN 'OFFLINE' THEN 1
            WHEN 'CRITICAL' THEN 2
            WHEN 'WARNING' THEN 3
            WHEN 'HEALTHY' THEN 4
            ELSE 5
          END
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /health-summary endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/sensors/failing - List of sensors with status != HEALTHY
router.get('/failing', async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 50;
  const cacheKey = `sensors_failing_${limit}`;
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const tableExistsQuery = `
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_sensor_health') as exists
    `;
    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].exists) {
      const query = `
        WITH latest_readings AS (
          SELECT sensor_id, MAX(window_start) as latest_window
          FROM scada_sensor_health
          GROUP BY sensor_id
        )
        SELECT
          h.sensor_id,
          h.window_start,
          h.status,
          h.reading_count,
          h.consecutive_failures,
          h.last_reading_time
        FROM scada_sensor_health h
        INNER JOIN latest_readings lr
          ON h.sensor_id = lr.sensor_id
          AND h.window_start = lr.latest_window
        WHERE h.status != 'HEALTHY'
        ORDER BY
          CASE h.status
            WHEN 'OFFLINE' THEN 1
            WHEN 'CRITICAL' THEN 2
            WHEN 'WARNING' THEN 3
            ELSE 4
          END,
          h.consecutive_failures DESC
        LIMIT $1
      `;

      result = await executeQuery(query, [limit]);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /failing endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/sensors/by-zone - Health grouped by zone_id
router.get('/by-zone', async (req, res, next) => {
  const cacheKey = 'sensors_by_zone';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    // Need to join with scada_anomalies or zone stats to get zone_id
    const tableExistsQuery = `
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_zone_stats') as zone_stats_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_sensor_health') as sensor_health_exists
    `;
    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].zone_stats_exists && tableCheck[0].sensor_health_exists) {
      const query = `
        WITH latest_zone_windows AS (
          SELECT zone_id, MAX(window_start) as latest_window
          FROM scada_zone_stats
          GROUP BY zone_id
        )
        SELECT
          zs.zone_id,
          zs.sensor_count,
          zs.avg_voltage,
          zs.total_power_mw,
          zs.anomaly_count
        FROM scada_zone_stats zs
        INNER JOIN latest_zone_windows lzw
          ON zs.zone_id = lzw.zone_id
          AND zs.window_start = lzw.latest_window
        ORDER BY zs.anomaly_count DESC, zs.zone_id
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /by-zone endpoint:', error.message);
    res.json([]);
  }
});

module.exports = router;
