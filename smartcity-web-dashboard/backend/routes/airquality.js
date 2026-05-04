const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// Air quality stations - current readings
router.get('/stations', async (req, res) => {
  try {
    const cacheKey = 'airquality_stations_current';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      WITH ranked AS (
        SELECT
          station_id,
          reading_timestamp,
          district,
          location_name,
          latitude,
          longitude,
          no2,
          pm25,
          pm10,
          o3,
          co,
          aqi,
          quality_level,
          station_status,
          ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY reading_timestamp DESC) as rn
        FROM smartcity_airquality_stream
        WHERE reading_timestamp > NOW() - INTERVAL '10 minutes'
      )
      SELECT
        station_id,
        reading_timestamp,
        district,
        location_name,
        latitude,
        longitude,
        no2,
        pm25,
        pm10,
        o3,
        co,
        aqi,
        quality_level,
        station_status
      FROM ranked
      WHERE rn = 1
      ORDER BY station_id
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in airquality stations route:', error);
    res.status(500).json({ error: 'Failed to fetch air quality stations', message: error.message });
  }
});

// Air quality summary by quality level
router.get('/summary', async (req, res) => {
  try {
    const cacheKey = 'airquality_summary';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        quality_level,
        COUNT(DISTINCT station_id) as station_count,
        AVG(aqi) as avg_aqi,
        AVG(no2) as avg_no2,
        AVG(pm25) as avg_pm25,
        AVG(pm10) as avg_pm10
      FROM smartcity_airquality_stream
      WHERE reading_timestamp > NOW() - INTERVAL '10 minutes'
      GROUP BY quality_level
      ORDER BY
        CASE quality_level
          WHEN 'GOOD' THEN 1
          WHEN 'MODERATE' THEN 2
          WHEN 'UNHEALTHY_SENSITIVE' THEN 3
          WHEN 'UNHEALTHY' THEN 4
          WHEN 'VERY_UNHEALTHY' THEN 5
          WHEN 'HAZARDOUS' THEN 6
        END
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in airquality summary route:', error);
    res.status(500).json({ error: 'Failed to fetch air quality summary', message: error.message });
  }
});

// Pollutant trends (last 24 hours)
router.get('/trends', async (req, res) => {
  try {
    const cacheKey = 'airquality_trends_24h';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        DATE_TRUNC('hour', reading_timestamp) as hour,
        AVG(aqi) as avg_aqi,
        AVG(no2) as avg_no2,
        AVG(pm25) as avg_pm25,
        AVG(pm10) as avg_pm10,
        AVG(o3) as avg_o3,
        AVG(co) as avg_co
      FROM smartcity_airquality_stream
      WHERE reading_timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', reading_timestamp)
      ORDER BY hour ASC
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in airquality trends route:', error);
    res.status(500).json({ error: 'Failed to fetch air quality trends', message: error.message });
  }
});

// Air quality stats - aggregated statistics from district data
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'airquality_stats';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      WITH latest_readings AS (
        SELECT
          station_id,
          aqi,
          pm25,
          quality_level,
          ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY reading_timestamp DESC) as rn
        FROM smartcity_airquality_stream
        WHERE reading_timestamp > NOW() - INTERVAL '10 minutes'
      )
      SELECT
        ROUND(CAST(AVG(aqi) AS NUMERIC), 0) as avg_aqi,
        ROUND(CAST(AVG(pm25) AS NUMERIC), 1) as avg_pm25,
        COUNT(*) FILTER (WHERE quality_level IN ('UNHEALTHY', 'VERY_UNHEALTHY', 'HAZARDOUS')) as unhealthy_count
      FROM latest_readings
      WHERE rn = 1
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data.length > 0 ? data[0] : {});
  } catch (error) {
    console.error('Error in airquality stats route:', error);
    res.status(500).json({ error: 'Failed to fetch air quality stats', message: error.message });
  }
});

// Air quality trend - 24h AQI
router.get('/trend', async (req, res) => {
  try {
    const cacheKey = 'airquality_trend';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        window_start,
        AVG(avg_aqi) as avg_aqi
      FROM smartcity_district_stats
      WHERE window_start > NOW() - INTERVAL '24 hours'
        AND avg_aqi IS NOT NULL
      GROUP BY window_start
      ORDER BY window_start ASC
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in airquality trend route:', error);
    res.status(500).json({ error: 'Failed to fetch air quality trend', message: error.message });
  }
});

module.exports = router;
