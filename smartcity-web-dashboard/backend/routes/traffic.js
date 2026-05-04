const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// Traffic sensors - from district aggregations (latest data per district)
router.get('/sensors', async (req, res) => {
  try {
    const cacheKey = 'traffic_sensors_current';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Use district_stats as proxy for sensor data
    const query = `
      WITH latest AS (
        SELECT MAX(window_start) as latest_window
        FROM smartcity_district_stats
      )
      SELECT
        district as sensor_id,
        window_start as reading_timestamp,
        district,
        district as location_name,
        'DISTRICT' as location_type,
        0.0 as latitude,
        0.0 as longitude,
        total_vehicles as vehicle_count,
        avg_traffic_speed as avg_speed,
        avg_occupancy as occupancy_pct,
        CASE
          WHEN avg_traffic_speed >= 40 THEN 'FLUID'
          WHEN avg_traffic_speed >= 25 THEN 'MODERATE'
          WHEN avg_traffic_speed >= 15 THEN 'CONGESTED'
          ELSE 'BLOCKED'
        END as traffic_status
      FROM smartcity_district_stats
      CROSS JOIN latest
      WHERE window_start = latest.latest_window
      ORDER BY district
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in traffic sensors route:', error);
    res.status(500).json({ error: 'Failed to fetch traffic sensors', message: error.message });
  }
});

// Traffic alerts - recent congestion
router.get('/alerts', async (req, res) => {
  try {
    const severity = req.query.severity; // Optional filter
    const cacheKey = `traffic_alerts_${severity || 'all'}`;
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    let query = `
      SELECT
        alert_id,
        sensor_id,
        alert_timestamp,
        severity,
        alert_type,
        message,
        district,
        location_name,
        avg_speed,
        occupancy_pct,
        vehicle_count
      FROM smartcity_traffic_alerts
      WHERE alert_timestamp > NOW() - INTERVAL '2 hours'
    `;

    const params = [];
    if (severity) {
      query += ` AND severity = $1`;
      params.push(severity);
    }

    query += ` ORDER BY alert_timestamp DESC LIMIT 100`;

    const data = await executeQuery(query, params);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in traffic alerts route:', error);
    res.status(500).json({ error: 'Failed to fetch traffic alerts', message: error.message });
  }
});

// Traffic alerts summary
router.get('/alerts/summary', async (req, res) => {
  try {
    const cacheKey = 'traffic_alerts_summary';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        severity,
        alert_type,
        COUNT(*) as count,
        AVG(avg_speed) as avg_speed,
        AVG(occupancy_pct) as avg_occupancy
      FROM smartcity_traffic_alerts
      WHERE alert_timestamp > NOW() - INTERVAL '1 hour'
      GROUP BY severity, alert_type
      ORDER BY count DESC
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in traffic alerts summary route:', error);
    res.status(500).json({ error: 'Failed to fetch alerts summary', message: error.message });
  }
});

// Traffic by location type
router.get('/by-location-type', async (req, res) => {
  try {
    const cacheKey = 'traffic_by_location_type';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        location_type,
        COUNT(DISTINCT sensor_id) as sensor_count,
        AVG(avg_speed) as avg_speed,
        AVG(occupancy_pct) as avg_occupancy,
        SUM(vehicle_count) as total_vehicles
      FROM smartcity_traffic_stream
      WHERE reading_timestamp > NOW() - INTERVAL '10 minutes'
      GROUP BY location_type
      ORDER BY location_type
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in traffic by location type route:', error);
    res.status(500).json({ error: 'Failed to fetch traffic by location', message: error.message });
  }
});

// Traffic stats - aggregated statistics from district data
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'traffic_stats';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      WITH latest_traffic AS (
        SELECT
          sensor_id,
          avg_speed,
          vehicle_count,
          traffic_status,
          ROW_NUMBER() OVER (PARTITION BY sensor_id ORDER BY reading_timestamp DESC) as rn
        FROM smartcity_traffic_stream
        WHERE reading_timestamp > NOW() - INTERVAL '10 minutes'
      )
      SELECT
        ROUND(CAST(AVG(avg_speed) AS NUMERIC), 1) as avg_speed,
        SUM(vehicle_count) as total_vehicles,
        COUNT(*) FILTER (WHERE traffic_status IN ('CONGESTED', 'BLOCKED')) as congested_count
      FROM latest_traffic
      WHERE rn = 1
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data.length > 0 ? data[0] : {});
  } catch (error) {
    console.error('Error in traffic stats route:', error);
    res.status(500).json({ error: 'Failed to fetch traffic stats', message: error.message });
  }
});

// Traffic trend - 24h average speed
router.get('/trend', async (req, res) => {
  try {
    const cacheKey = 'traffic_trend';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        window_start,
        AVG(avg_traffic_speed) as avg_speed
      FROM smartcity_district_stats
      WHERE window_start > NOW() - INTERVAL '24 hours'
      GROUP BY window_start
      ORDER BY window_start ASC
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in traffic trend route:', error);
    res.status(500).json({ error: 'Failed to fetch traffic trend', message: error.message });
  }
});

module.exports = router;
