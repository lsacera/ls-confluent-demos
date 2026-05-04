const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// Get Kafka topics metadata (from information schema)
router.get('/topics', async (req, res) => {
  try {
    const cacheKey = 'architecture_topics';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Return static topic info (metadata not available in Flink tables)
    const topics = [
      {
        name: 'smartcity-traffic',
        partitions: 6,
        description: 'Traffic sensor readings from 17 sensors across Madrid',
        retention: '7 days'
      },
      {
        name: 'smartcity-airquality',
        partitions: 3,
        description: 'Air quality measurements from 12 monitoring stations',
        retention: '7 days'
      },
      {
        name: 'smartcity-emtbus',
        partitions: 3,
        description: 'EMT bus telemetry for 11 buses on 7 routes',
        retention: '7 days'
      },
      {
        name: 'smartcity-service',
        partitions: 3,
        description: 'Citizen service requests (311-style reporting)',
        retention: '30 days'
      },
      {
        name: 'smartcity-alert',
        partitions: 3,
        description: 'System-generated alerts (traffic congestion, air quality)',
        retention: '30 days'
      }
    ];

    req.cache.set(cacheKey, topics);
    res.json(topics);
  } catch (error) {
    console.error('Error in architecture topics route:', error);
    res.status(500).json({ error: 'Failed to fetch topics', message: error.message });
  }
});

// Get Flink tables
router.get('/flink-tables', async (req, res) => {
  try {
    const cacheKey = 'architecture_flink_tables';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Return static Flink table info
    const tables = [
      { name: 'smartcity_traffic_stream', type: 'stream', description: 'Traffic sensor base stream' },
      { name: 'smartcity_airquality_stream', type: 'stream', description: 'Air quality base stream' },
      { name: 'smartcity_traffic_alerts', type: 'stream', description: 'Congestion detection alerts' },
      { name: 'smartcity_district_stats', type: 'materialized', description: 'District aggregations (5-min windows)' },
      { name: 'smartcity_emt_performance', type: 'materialized', description: 'EMT bus performance (5-min windows)' },
      { name: 'smartcity_services_sla', type: 'materialized', description: 'Citizen services SLA (1-hour windows)' },
      { name: 'smartcity_health_dashboard', type: 'materialized', description: 'City health score (10-min windows)' }
    ];

    req.cache.set(cacheKey, tables);
    res.json(tables);
  } catch (error) {
    console.error('Error in architecture flink tables route:', error);
    res.status(500).json({ error: 'Failed to fetch Flink tables', message: error.message });
  }
});

// Get data pipeline metrics
router.get('/metrics', async (req, res) => {
  try {
    const cacheKey = 'architecture_metrics';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Get row counts from key tables
    const queries = {
      traffic_events: `SELECT COUNT(*) as count FROM smartcity_traffic_stream WHERE reading_timestamp > NOW() - INTERVAL '1 hour'`,
      airquality_events: `SELECT COUNT(*) as count FROM smartcity_airquality_stream WHERE reading_timestamp > NOW() - INTERVAL '1 hour'`,
      traffic_alerts: `SELECT COUNT(*) as count FROM smartcity_traffic_alerts WHERE alert_timestamp > NOW() - INTERVAL '1 hour'`,
      city_health_windows: `SELECT COUNT(*) as count FROM smartcity_health_dashboard WHERE window_start > NOW() - INTERVAL '24 hours'`
    };

    const results = {};
    for (const [key, query] of Object.entries(queries)) {
      try {
        const data = await executeQuery(query);
        results[key] = data[0]?.count || 0;
      } catch (err) {
        results[key] = 0;
      }
    }

    req.cache.set(cacheKey, results);
    res.json(results);
  } catch (error) {
    console.error('Error in architecture metrics route:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', message: error.message });
  }
});

module.exports = router;
