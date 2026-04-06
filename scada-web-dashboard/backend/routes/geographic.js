const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/geographic/sensors - All sensors with latest coordinates and status
router.get('/sensors', async (req, res, next) => {
  const cacheKey = 'geographic_sensors';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const tableExistsQuery = `
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_sensor_health') as sensor_health_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_anomalies') as anomalies_exists
    `;
    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].sensor_health_exists) {
      // Get sensor status from sensor_health
      const query = `
        WITH latest_sensor_health AS (
          SELECT sensor_id, MAX(window_start) as latest_window
          FROM scada_sensor_health
          GROUP BY sensor_id
        )
        SELECT
          h.sensor_id,
          h.status,
          h.consecutive_failures,
          h.state,
          h.zone_id
        FROM scada_sensor_health h
        INNER JOIN latest_sensor_health lsh
          ON h.sensor_id = lsh.sensor_id
          AND h.window_start = lsh.latest_window
        ORDER BY h.sensor_id
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /sensors endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/geographic/anomalies-map - Recent anomalies with lat/lon for map markers
router.get('/anomalies-map', async (req, res, next) => {
  const hours = parseInt(req.query.hours) || 1;
  const cacheKey = `geographic_anomalies_map_${hours}`;
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
        WHERE alert_timestamp >= NOW() - INTERVAL '${hours} HOURS'
          AND alert_timestamp IS NOT NULL
        ORDER BY alert_timestamp DESC
        LIMIT 500
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /anomalies-map endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/geographic/anomalies-by-state - Anomalies grouped by state for map visualization
router.get('/anomalies-by-state', async (req, res, next) => {
  const hours = parseInt(req.query.hours) || 24;
  const cacheKey = `geographic_anomalies_by_state_${hours}`;
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
          state,
          COUNT(*)::INTEGER as total_anomalies,
          COUNT(*) FILTER (WHERE severity = 'CRITICAL')::INTEGER as critical_count,
          COUNT(*) FILTER (WHERE severity = 'WARNING')::INTEGER as warning_count
        FROM scada_anomalies
        WHERE alert_timestamp >= NOW() - INTERVAL '${hours} HOURS'
          AND alert_timestamp IS NOT NULL
          AND state IS NOT NULL
        GROUP BY state
        ORDER BY total_anomalies DESC
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /anomalies-by-state endpoint:', error.message);
    res.json([]);
  }
});

module.exports = router;
