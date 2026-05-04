CREATE TABLE IF NOT EXISTS smartcity_health_dashboard (
  window_start TIMESTAMP_LTZ(3) NOT NULL,
  window_end TIMESTAMP_LTZ(3) NOT NULL,

  city_avg_speed DOUBLE,
  total_city_vehicles BIGINT,
  traffic_fluidity_score INT,

  city_avg_aqi INT,
  city_avg_pm25 DOUBLE,
  air_quality_score INT,

  total_emt_buses INT,
  avg_bus_delay DOUBLE,
  emt_reliability_score INT,

  total_service_tickets INT,
  service_resolution_rate DOUBLE,
  citizen_service_score INT,

  overall_health_score INT,
  health_status STRING,

  PRIMARY KEY (window_start, window_end) NOT ENFORCED
)
AS
WITH district_windows AS (
  SELECT
    window_start,
    window_end,
    AVG(avg_traffic_speed) AS avg_speed,
    SUM(total_vehicles) AS total_vehicles,
    AVG(avg_aqi) AS avg_aqi,
    AVG(avg_pm25) AS avg_pm25
  FROM smartcity_district_stats
  GROUP BY window_start, window_end
),

bus_windows AS (
  SELECT
    window_start,
    window_end,
    SUM(total_buses) AS bus_count,
    AVG(avg_delay_minutes) AS avg_delay
  FROM smartcity_emt_performance
  GROUP BY window_start, window_end
),

service_windows AS (
  SELECT
    window_start,
    window_end,
    COUNT(DISTINCT ticket_id) AS ticket_count,
    SUM(
      CASE
        WHEN CAST(`status` AS STRING) IN ('RESUELTO', 'CERRADO') THEN 1
        ELSE 0
      END
    ) AS resolved_tickets
  FROM TABLE(
    TUMBLE(TABLE `smartcity-service`, DESCRIPTOR(`$rowtime`), INTERVAL '5' MINUTES)
  )
  GROUP BY window_start, window_end
)

SELECT
  d.window_start,
  d.window_end,

  ROUND(d.avg_speed, 2) AS city_avg_speed,
  d.total_vehicles AS total_city_vehicles,

  CAST(LEAST(100, GREATEST(0, (d.avg_speed / 50.0) * 100)) AS INT) AS traffic_fluidity_score,

  CAST(ROUND(d.avg_aqi) AS INT) AS city_avg_aqi,
  ROUND(d.avg_pm25, 2) AS city_avg_pm25,
  CAST(LEAST(100, GREATEST(0, 100 - (d.avg_aqi / 2))) AS INT) AS air_quality_score,

  CAST(COALESCE(b.bus_count, 0) AS INT) AS total_emt_buses,
  ROUND(COALESCE(b.avg_delay, 0.0), 1) AS avg_bus_delay,
  CAST(LEAST(100, GREATEST(0, 100 - (ABS(COALESCE(b.avg_delay, 0.0)) * 10))) AS INT) AS emt_reliability_score,

  CAST(COALESCE(s.ticket_count, 0) AS INT) AS total_service_tickets,
  ROUND(
    (COALESCE(s.resolved_tickets, 0) * 100.0) / NULLIF(COALESCE(s.ticket_count, 0), 0),
    1
  ) AS service_resolution_rate,

  CAST(
    COALESCE(
      (COALESCE(s.resolved_tickets, 0) * 100.0) / NULLIF(COALESCE(s.ticket_count, 0), 0),
      80
    ) AS INT
  ) AS citizen_service_score,

  CAST(
    (
      (LEAST(100, GREATEST(0, (d.avg_speed / 50.0) * 100)) * 0.30) +
      (LEAST(100, GREATEST(0, 100 - (d.avg_aqi / 2))) * 0.30) +
      (LEAST(100, GREATEST(0, 100 - (ABS(COALESCE(b.avg_delay, 0.0)) * 10))) * 0.20) +
      (
        COALESCE(
          (COALESCE(s.resolved_tickets, 0) * 100.0) / NULLIF(COALESCE(s.ticket_count, 0), 0),
          80
        ) * 0.20
      )
    ) AS INT
  ) AS overall_health_score,

  CASE
    WHEN (
      (LEAST(100, GREATEST(0, (d.avg_speed / 50.0) * 100)) * 0.30) +
      (LEAST(100, GREATEST(0, 100 - (d.avg_aqi / 2))) * 0.30) +
      (LEAST(100, GREATEST(0, 100 - (ABS(COALESCE(b.avg_delay, 0.0)) * 10))) * 0.20) +
      (
        COALESCE(
          (COALESCE(s.resolved_tickets, 0) * 100.0) / NULLIF(COALESCE(s.ticket_count, 0), 0),
          80
        ) * 0.20
      )
    ) >= 80 THEN 'EXCELLENT'
    WHEN (
      (LEAST(100, GREATEST(0, (d.avg_speed / 50.0) * 100)) * 0.30) +
      (LEAST(100, GREATEST(0, 100 - (d.avg_aqi / 2))) * 0.30) +
      (LEAST(100, GREATEST(0, 100 - (ABS(COALESCE(b.avg_delay, 0.0)) * 10))) * 0.20) +
      (
        COALESCE(
          (COALESCE(s.resolved_tickets, 0) * 100.0) / NULLIF(COALESCE(s.ticket_count, 0), 0),
          80
        ) * 0.20
      )
    ) >= 60 THEN 'GOOD'
    WHEN (
      (LEAST(100, GREATEST(0, (d.avg_speed / 50.0) * 100)) * 0.30) +
      (LEAST(100, GREATEST(0, 100 - (d.avg_aqi / 2))) * 0.30) +
      (LEAST(100, GREATEST(0, 100 - (ABS(COALESCE(b.avg_delay, 0.0)) * 10))) * 0.20) +
      (
        COALESCE(
          (COALESCE(s.resolved_tickets, 0) * 100.0) / NULLIF(COALESCE(s.ticket_count, 0), 0),
          80
        ) * 0.20
      )
    ) >= 40 THEN 'MODERATE'
    ELSE 'POOR'
  END AS health_status,

  d.window_end AS event_time

FROM district_windows d
LEFT JOIN bus_windows b
  ON d.window_start = b.window_start AND d.window_end = b.window_end
LEFT JOIN service_windows s
  ON d.window_start = s.window_start AND d.window_end = s.window_end;