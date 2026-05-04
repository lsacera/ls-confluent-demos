const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// GET /api/grid/regions - Stats for ERCOT, WECC, EASTERN (latest window)
router.get('/regions', async (req, res, next) => {
  const cacheKey = 'grid_regions';
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
          s.window_start,
          s.window_end,
          s.grid_region,
          s.avg_frequency_hz as avg_frequency,
          s.grid_stability_score,
          s.total_generation_mw as total_power_mw,
          s.total_sensors as sensor_count,
          s.power_balance_mw,
          s.critical_alerts,
          s.warning_alerts
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
    console.error('Error in /regions endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/grid/stability-trend - Grid stability score over time (last 24h)
router.get('/stability-trend', async (req, res, next) => {
  const cacheKey = 'grid_stability_trend';
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
        SELECT
          window_start,
          grid_region,
          grid_stability_score,
          avg_frequency_hz as avg_frequency,
          total_generation_mw as total_power_mw
        FROM scada_grid_region_stats
        WHERE window_start >= NOW() - INTERVAL '24 HOURS'
          AND grid_stability_score IS NOT NULL
          AND avg_frequency_hz IS NOT NULL
        ORDER BY window_start, grid_region
      `;

      result = await executeQuery(query);
    }

    req.cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /stability-trend endpoint:', error.message);
    res.json([]);
  }
});

// GET /api/grid/power-balance - Power balance by region
router.get('/power-balance', async (req, res, next) => {
  const cacheKey = 'grid_power_balance';
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
          s.total_generation_mw as total_power_mw,
          s.power_balance_mw,
          CASE
            WHEN s.power_balance_mw > 0 THEN 'SURPLUS'
            WHEN s.power_balance_mw < 0 THEN 'DEFICIT'
            ELSE 'BALANCED'
          END as balance_status
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
    console.error('Error in /power-balance endpoint:', error.message);
    res.json([]);
  }
});

module.exports = router;
