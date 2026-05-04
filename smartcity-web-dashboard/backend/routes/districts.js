const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// Global stats - calculated from individual stations/sensors
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'districts_global_stats';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      WITH latest_traffic AS (
        SELECT
          sensor_id,
          avg_speed,
          ROW_NUMBER() OVER (PARTITION BY sensor_id ORDER BY reading_timestamp DESC) as rn
        FROM smartcity_traffic_stream
        WHERE reading_timestamp > NOW() - INTERVAL '10 minutes'
      ),
      latest_airquality AS (
        SELECT
          station_id,
          aqi,
          ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY reading_timestamp DESC) as rn
        FROM smartcity_airquality_stream
        WHERE reading_timestamp > NOW() - INTERVAL '10 minutes'
      )
      SELECT
        ROUND(CAST(AVG(t.avg_speed) AS NUMERIC), 1) as avg_speed,
        ROUND(CAST(AVG(a.aqi) AS NUMERIC), 0) as avg_aqi
      FROM
        (SELECT avg_speed FROM latest_traffic WHERE rn = 1) t
      CROSS JOIN
        (SELECT aqi FROM latest_airquality WHERE rn = 1) a
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data.length > 0 ? data[0] : {});
    res.json(data.length > 0 ? data[0] : {});
  } catch (error) {
    console.error('Error in districts stats route:', error);
    res.status(500).json({ error: 'Failed to fetch districts stats', message: error.message });
  }
});

// District aggregations - latest data
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'districts_latest';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Get latest data for all districts
    const query = `
      WITH latest_window AS (
        SELECT MAX(window_start) as latest
        FROM smartcity_district_stats
      )
      SELECT
        s.district,
        s.window_start,
        s.window_end,
        s.avg_traffic_speed,
        s.avg_occupancy,
        s.total_vehicles,
        s.congested_sensors,
        s.total_traffic_sensors,
        s.avg_aqi,
        s.avg_no2,
        s.avg_pm25,
        s.unhealthy_air_stations,
        s.total_air_stations
      FROM smartcity_district_stats s
      INNER JOIN latest_window l ON s.window_start = l.latest
      ORDER BY s.district
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in districts route:', error);
    res.status(500).json({ error: 'Failed to fetch district data', message: error.message });
  }
});

// District details - single district trends
router.get('/:district/trends', async (req, res) => {
  try {
    const district = req.params.district;
    const cacheKey = `district_trends_${district}`;
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        district,
        window_start,
        avg_traffic_speed,
        avg_occupancy,
        total_vehicles,
        congested_sensors,
        avg_aqi,
        avg_pm25,
        unhealthy_air_stations
      FROM smartcity_district_stats
      WHERE district = $1
        AND window_start > NOW() - INTERVAL '6 hours'
      ORDER BY window_start ASC
    `;

    const data = await executeQuery(query, [district]);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in district trends route:', error);
    res.status(500).json({ error: 'Failed to fetch district trends', message: error.message });
  }
});

// Top/bottom districts by metric
router.get('/rankings/:metric', async (req, res) => {
  try {
    const metric = req.params.metric; // 'traffic_speed', 'aqi', 'congestion'
    const cacheKey = `district_rankings_${metric}`;
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Build query based on metric
    let orderByClause;
    let selectClause = `district, avg_traffic_speed, avg_aqi, congested_sensors, total_traffic_sensors`;

    switch (metric) {
      case 'traffic_speed':
        orderByClause = 'avg_traffic_speed DESC NULLS LAST';
        break;
      case 'aqi':
        orderByClause = 'avg_aqi DESC NULLS LAST';
        break;
      case 'congestion':
        orderByClause = 'CAST(congested_sensors AS DECIMAL) / NULLIF(total_traffic_sensors, 0) DESC NULLS LAST';
        break;
      default:
        orderByClause = 'district';
    }

    const query = `
      WITH latest_window AS (
        SELECT MAX(window_start) as latest
        FROM smartcity_district_stats
      )
      SELECT ${selectClause}
      FROM smartcity_district_stats s
      INNER JOIN latest_window l ON s.window_start = l.latest
      ORDER BY ${orderByClause}
      LIMIT 10
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in district rankings route:', error);
    res.status(500).json({ error: 'Failed to fetch district rankings', message: error.message });
  }
});

module.exports = router;
