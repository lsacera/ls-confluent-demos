const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// EMT bus performance by line
router.get('/performance', async (req, res) => {
  try {
    const cacheKey = 'emt_performance_recent';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        bus_line,
        window_start,
        window_end,
        total_buses,
        avg_delay_minutes,
        buses_delayed,
        buses_on_time,
        avg_occupancy_pct,
        overcrowded_buses,
        avg_speed,
        buses_in_service,
        buses_at_stop,
        buses_out_of_service
      FROM smartcity_emt_performance
      WHERE window_start > NOW() - INTERVAL '2 hours'
      ORDER BY window_start DESC, bus_line
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in EMT performance route:', error);
    res.status(500).json({ error: 'Failed to fetch EMT performance', message: error.message });
  }
});

// EMT summary - all lines latest data
router.get('/summary', async (req, res) => {
  try {
    const cacheKey = 'emt_summary_latest';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Get latest data for each bus line
    const query = `
      WITH latest_per_line AS (
        SELECT
          bus_line,
          MAX(window_start) as latest_window
        FROM smartcity_emt_performance
        WHERE window_start > NOW() - INTERVAL '1 hour'
        GROUP BY bus_line
      )
      SELECT
        p.bus_line,
        p.total_buses,
        p.avg_delay_minutes,
        p.buses_delayed,
        p.buses_on_time,
        p.avg_occupancy_pct,
        p.overcrowded_buses
      FROM smartcity_emt_performance p
      INNER JOIN latest_per_line l
        ON p.bus_line = l.bus_line
        AND p.window_start = l.latest_window
      ORDER BY p.bus_line
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in EMT summary route:', error);
    res.status(500).json({ error: 'Failed to fetch EMT summary', message: error.message });
  }
});

// Delay trends - aggregated across all lines (last 6 hours)
router.get('/delay-trends', async (req, res) => {
  try {
    const cacheKey = 'emt_delay_trends_avg';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        window_start,
        ROUND(CAST(AVG(avg_delay_minutes) AS NUMERIC), 1) as avg_delay_minutes,
        SUM(buses_delayed) as total_buses_delayed,
        SUM(buses_on_time) as total_buses_on_time
      FROM smartcity_emt_performance
      WHERE window_start > NOW() - INTERVAL '6 hours'
      GROUP BY window_start
      ORDER BY window_start ASC
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in EMT delay trends route:', error);
    res.status(500).json({ error: 'Failed to fetch delay trends', message: error.message });
  }
});

module.exports = router;
