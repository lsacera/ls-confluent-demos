const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// Overview endpoint - City health KPIs and recent data
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'overview_kpis';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Get latest city health score
    const healthQuery = `
      SELECT
        city_avg_speed,
        total_city_vehicles,
        traffic_fluidity_score,
        city_avg_aqi,
        city_avg_pm25,
        air_quality_score,
        total_emt_buses,
        avg_bus_delay,
        emt_reliability_score,
        total_service_tickets,
        service_resolution_rate,
        citizen_service_score,
        overall_health_score,
        health_status,
        window_start
      FROM smartcity_health_dashboard
      ORDER BY window_start DESC
      LIMIT 1
    `;

    // Get recent traffic alerts count (latest window only)
    const alertsQuery = `
      WITH latest AS (
        SELECT MAX(alert_timestamp) as latest_time
        FROM smartcity_traffic_alerts
      )
      SELECT
        COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_alerts,
        COUNT(*) FILTER (WHERE severity = 'HIGH') as high_alerts,
        COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium_alerts,
        COUNT(*) as total_alerts
      FROM smartcity_traffic_alerts
      CROSS JOIN latest
      WHERE alert_timestamp = latest.latest_time
    `;

    // Get district with worst air quality (latest window only)
    const worstAirQuery = `
      WITH latest AS (
        SELECT MAX(window_start) as latest_window
        FROM smartcity_district_stats
      )
      SELECT district, avg_aqi, unhealthy_air_stations
      FROM smartcity_district_stats
      CROSS JOIN latest
      WHERE window_start = latest.latest_window
      ORDER BY avg_aqi DESC NULLS LAST
      LIMIT 1
    `;

    // Get most delayed bus line (latest window only)
    const delayedBusQuery = `
      WITH latest AS (
        SELECT MAX(window_start) as latest_window
        FROM smartcity_emt_performance
      )
      SELECT bus_line, avg_delay_minutes, buses_delayed
      FROM smartcity_emt_performance
      CROSS JOIN latest
      WHERE window_start = latest.latest_window
      ORDER BY avg_delay_minutes DESC NULLS LAST
      LIMIT 1
    `;

    // TEMPORARILY DISABLED: Table smartcity_services_sla doesn't exist yet
    // Get overdue service tickets by category (latest window only)
    // const overdueServicesQuery = `
    //   WITH latest AS (
    //     SELECT MAX(window_start) as latest_window
    //     FROM smartcity_services_sla
    //   )
    //   SELECT
    //     category,
    //     priority,
    //     tickets_overdue as total_overdue
    //   FROM smartcity_services_sla
    //   CROSS JOIN latest
    //   WHERE window_start = latest.latest_window
    //     AND tickets_overdue > 0
    //   ORDER BY tickets_overdue DESC
    //   LIMIT 5
    // `;

    const [healthData, alertsData, worstAir, delayedBus] = await Promise.all([
      executeQuery(healthQuery),
      executeQuery(alertsQuery),
      executeQuery(worstAirQuery),
      executeQuery(delayedBusQuery)
      // executeQuery(overdueServicesQuery)  // Disabled
    ]);

    const response = {
      cityHealth: healthData[0] || null,
      alerts: alertsData[0] || { critical_alerts: 0, high_alerts: 0, medium_alerts: 0, total_alerts: 0 },
      worstAirDistrict: worstAir[0] || null,
      mostDelayedBusLine: delayedBus[0] || null,
      overdueServices: [], // Empty array until table is created
      timestamp: new Date().toISOString()
    };

    req.cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Error in overview route:', error);
    res.status(500).json({ error: 'Failed to fetch overview data', message: error.message });
  }
});

// City health trend (last 24 hours)
router.get('/health-trend', async (req, res) => {
  try {
    const cacheKey = 'health_trend_24h';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT
        window_start,
        overall_health_score,
        traffic_fluidity_score,
        air_quality_score,
        emt_reliability_score,
        citizen_service_score,
        health_status
      FROM smartcity_health_dashboard
      WHERE window_start > NOW() - INTERVAL '24 hours'
      ORDER BY window_start ASC
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in health-trend route:', error);
    res.status(500).json({ error: 'Failed to fetch health trend', message: error.message });
  }
});

module.exports = router;
