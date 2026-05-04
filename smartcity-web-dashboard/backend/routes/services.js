const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/postgres');

// Citizen services SLA tracking
router.get('/sla', async (req, res) => {
  try {
    const category = req.query.category; // Optional filter
    const cacheKey = `services_sla_${category || 'all'}`;
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Check if table exists first
    const tableCheck = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'smartcity_services_sla'
      )
    `);

    if (!tableCheck[0]?.exists) {
      return res.json([]);
    }

    let query = `
      SELECT
        category,
        priority,
        window_start,
        window_end,
        total_tickets,
        open_tickets,
        in_progress_tickets,
        resolved_tickets,
        closed_tickets,
        rejected_tickets,
        avg_sla_hours,
        tickets_within_sla,
        tickets_overdue
      FROM smartcity_services_sla
      WHERE window_start > NOW() - INTERVAL '24 hours'
    `;

    const params = [];
    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ` ORDER BY window_start DESC, category, priority`;

    const data = await executeQuery(query, params);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in services SLA route:', error);
    res.status(500).json({ error: 'Failed to fetch services SLA', message: error.message });
  }
});

// Services summary - current status
router.get('/summary', async (req, res) => {
  try {
    const cacheKey = 'services_summary_latest';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Check if table exists first
    const tableCheck = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'smartcity_services_sla'
      )
    `);

    if (!tableCheck[0]?.exists) {
      return res.json([]);
    }

    const query = `
      WITH latest_window AS (
        SELECT MAX(window_start) as latest
        FROM smartcity_services_sla
        WHERE window_start > NOW() - INTERVAL '2 hours'
      ),
      category_totals AS (
        SELECT
          category,
          priority,
          total_tickets,
          open_tickets,
          in_progress_tickets,
          resolved_tickets,
          tickets_overdue,
          tickets_within_sla
        FROM smartcity_services_sla s
        INNER JOIN latest_window l ON s.window_start = l.latest
      )
      SELECT
        category,
        CAST(SUM(total_tickets) AS BIGINT) as total_tickets,
        CAST(SUM(open_tickets) AS BIGINT) as open_tickets,
        CAST(SUM(in_progress_tickets) AS BIGINT) as in_progress_tickets,
        CAST(SUM(resolved_tickets) AS BIGINT) as resolved_tickets,
        CAST(SUM(tickets_overdue) AS BIGINT) as tickets_overdue,
        ROUND(
          CAST(SUM(tickets_within_sla) AS DECIMAL) /
          NULLIF(SUM(total_tickets), 0) * 100,
          1
        ) as sla_compliance_pct
      FROM category_totals
      GROUP BY category
      ORDER BY total_tickets DESC
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in services summary route:', error);
    res.status(500).json({ error: 'Failed to fetch services summary', message: error.message });
  }
});

// Priority distribution
router.get('/priority-distribution', async (req, res) => {
  try {
    const cacheKey = 'services_priority_distribution';
    const cachedData = req.cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Check if table exists first
    const tableCheck = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'smartcity_services_sla'
      )
    `);

    if (!tableCheck[0]?.exists) {
      return res.json([]);
    }

    const query = `
      WITH latest_window AS (
        SELECT MAX(window_start) as latest
        FROM smartcity_services_sla
        WHERE window_start > NOW() - INTERVAL '2 hours'
      )
      SELECT
        priority,
        SUM(total_tickets) as total_tickets,
        SUM(open_tickets) as open_tickets,
        SUM(tickets_overdue) as tickets_overdue,
        AVG(avg_sla_hours) as avg_sla_hours
      FROM smartcity_services_sla s
      INNER JOIN latest_window l ON s.window_start = l.latest
      GROUP BY priority
      ORDER BY
        CASE priority
          WHEN 'URGENTE' THEN 1
          WHEN 'ALTA' THEN 2
          WHEN 'MEDIA' THEN 3
          WHEN 'BAJA' THEN 4
        END
    `;

    const data = await executeQuery(query);
    req.cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error in priority distribution route:', error);
    res.status(500).json({ error: 'Failed to fetch priority distribution', message: error.message });
  }
});

module.exports = router;
