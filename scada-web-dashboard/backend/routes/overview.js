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
    // Check if tables exist
    const tableExistsQuery = `
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_anomalies') as anomalies_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_sensor_health') as sensor_health_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_grid_region_stats') as grid_stats_exists
    `;

    const tableCheck = await executeQuery(tableExistsQuery);
    const { anomalies_exists, sensor_health_exists, grid_stats_exists } = tableCheck[0];

    let data = {
      total_anomalies_24h: 0,
      critical_alerts: 0,
      avg_grid_stability: 0,
      sensors_offline: 0
    };

    if (anomalies_exists && sensor_health_exists && grid_stats_exists) {
      const query = `
        SELECT
          COALESCE((SELECT COUNT(*) FROM scada_anomalies
            WHERE alert_timestamp >= NOW() - INTERVAL '24 HOURS'), 0) as total_anomalies_24h,
          COALESCE((SELECT COUNT(*) FROM scada_anomalies
            WHERE alert_timestamp >= NOW() - INTERVAL '24 HOURS'
            AND severity = 'CRITICAL'), 0) as critical_alerts,
          COALESCE((SELECT AVG(grid_stability_score) FROM scada_grid_region_stats
            WHERE window_start >= NOW() - INTERVAL '1 HOUR'), 0) as avg_grid_stability,
          COALESCE((SELECT COUNT(DISTINCT sensor_id) FROM scada_sensor_health
            WHERE window_start >= NOW() - INTERVAL '5 MINUTES'
            AND status = 'OFFLINE'), 0) as sensors_offline
      `;

      const result = await executeQuery(query);
      data = result[0];
    }

    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in /kpis endpoint:', error.message);
    // Return default data instead of 500 error
    res.json({
      total_anomalies_24h: 0,
      critical_alerts: 0,
      avg_grid_stability: 0,
      sensors_offline: 0
    });
  }
});

// GET /api/overview/hourly-anomalies - Anomalies per hour for last 24h
router.get('/hourly-anomalies', async (req, res, next) => {
  const cacheKey = 'overview_hourly_anomalies';
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
          DATE_TRUNC('hour', alert_timestamp) as hour,
          COUNT(*)::INTEGER as anomaly_count,
          COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_count,
          COUNT(*) FILTER (WHERE severity = 'WARNING') as warning_count
        FROM scada_anomalies
        WHERE alert_timestamp >= NOW() - INTERVAL '24 HOURS'
        GROUP BY DATE_TRUNC('hour', alert_timestamp)
        ORDER BY hour
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /hourly-anomalies endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/overview/grid-health - Current health of all 3 grid regions
router.get('/grid-health', async (req, res, next) => {
  const cacheKey = 'overview_grid_health';
  const cached = req.cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const tableExistsQuery = `
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_grid_region_stats') as exists
    `;
    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].exists) {
      const query = `
        WITH latest_windows AS (
          SELECT grid_region, MAX(window_start) as latest_window
          FROM scada_grid_region_stats
          GROUP BY grid_region
        )
        SELECT
          s.grid_region,
          s.grid_stability_score,
          s.total_generation_mw as total_power_mw,
          s.critical_alerts,
          s.warning_alerts,
          s.total_sensors as sensor_count
        FROM scada_grid_region_stats s
        INNER JOIN latest_windows lw
          ON s.grid_region = lw.grid_region
          AND s.window_start = lw.latest_window
        ORDER BY s.grid_region
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /grid-health endpoint:', error.message);
    res.json([]);
  }
});

module.exports = router;
