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
    // Get row counts from all SCADA tables
    const tableExistsQuery = `
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_anomalies') as anomalies_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_zone_stats') as zone_stats_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_grid_region_stats') as grid_stats_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_sensor_health') as sensor_health_exists
    `;

    const tableCheck = await executeQuery(tableExistsQuery);
    const { anomalies_exists, zone_stats_exists, grid_stats_exists, sensor_health_exists } = tableCheck[0];

    let stats = {
      scada_anomalies: 0,
      scada_zone_stats: 0,
      scada_grid_region_stats: 0,
      scada_sensor_health: 0,
      timestamp: new Date().toISOString()
    };

    const queries = [];
    if (anomalies_exists) {
      queries.push(executeQuery(`SELECT COUNT(*)::INTEGER as count FROM scada_anomalies`));
    } else {
      queries.push(Promise.resolve([{ count: 0 }]));
    }

    if (zone_stats_exists) {
      queries.push(executeQuery(`SELECT COUNT(*)::INTEGER as count FROM scada_zone_stats`));
    } else {
      queries.push(Promise.resolve([{ count: 0 }]));
    }

    if (grid_stats_exists) {
      queries.push(executeQuery(`SELECT COUNT(*)::INTEGER as count FROM scada_grid_region_stats`));
    } else {
      queries.push(Promise.resolve([{ count: 0 }]));
    }

    if (sensor_health_exists) {
      queries.push(executeQuery(`SELECT COUNT(*)::INTEGER as count FROM scada_sensor_health`));
    } else {
      queries.push(Promise.resolve([{ count: 0 }]));
    }

    const [anomaliesResult, zoneStatsResult, gridStatsResult, sensorHealthResult] = await Promise.all(queries);

    stats.scada_anomalies = anomaliesResult[0]?.count || 0;
    stats.scada_zone_stats = zoneStatsResult[0]?.count || 0;
    stats.scada_grid_region_stats = gridStatsResult[0]?.count || 0;
    stats.scada_sensor_health = sensorHealthResult[0]?.count || 0;

    req.cache.set(cacheKey, stats);
    res.json(stats);
  } catch (error) {
    console.error('Error in /stats endpoint:', error.message);
    res.json({
      scada_anomalies: 0,
      scada_zone_stats: 0,
      scada_grid_region_stats: 0,
      scada_sensor_health: 0,
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
    const tableExistsQuery = `
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scada_anomalies') as exists
    `;

    const tableCheck = await executeQuery(tableExistsQuery);

    let result = [];

    if (tableCheck[0].exists) {
      const query = `
        SELECT
          'anomaly' as event_type,
          sensor_id as event_id,
          CONCAT(severity, ' - ', alert_type, ' (', measured_value::TEXT, ')') as description,
          alert_timestamp::TEXT as event_time
        FROM scada_anomalies
        WHERE alert_timestamp >= NOW() - INTERVAL '5 MINUTES'
          AND alert_timestamp IS NOT NULL
        ORDER BY alert_timestamp DESC
        LIMIT 20
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /activity endpoint:', error.message);
    res.json([]);
  }
});

module.exports = router;
