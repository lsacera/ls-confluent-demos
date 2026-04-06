-- SCADA Query 4: Grid region statistics
-- Aggregates metrics by major grid interconnection regions (ERCOT, WECC, EASTERN)

CREATE TABLE IF NOT EXISTS scada_grid_region_stats (
  grid_region STRING NOT NULL,
  window_start TIMESTAMP_LTZ(3) NOT NULL,
  window_end TIMESTAMP_LTZ(3),
  total_zones BIGINT,
  total_sensors BIGINT,
  avg_frequency_hz DOUBLE,
  frequency_deviation DOUBLE,
  total_generation_mw DOUBLE,
  total_consumption_mw DOUBLE,
  power_balance_mw DOUBLE,
  grid_stability_score DOUBLE,
  critical_alerts BIGINT,
  warning_alerts BIGINT,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '20' SECOND,
  PRIMARY KEY (grid_region, window_start) NOT ENFORCED
)
COMMENT 'Grid region statistics for USA interconnection monitoring (10-minute windows)'
AS
  SELECT
    COALESCE(grid_region, 'UNKNOWN') AS grid_region,
    window_start,
    window_end,
    COUNT(DISTINCT zone_id) AS total_zones,
    COUNT(DISTINCT sensor_id) AS total_sensors,

    -- Frequency monitoring (critical for grid stability)
    AVG(CASE WHEN measurement_type = 'FREQUENCY' THEN `value` END) AS avg_frequency_hz,
    STDDEV(CASE WHEN measurement_type = 'FREQUENCY' THEN `value` END) AS frequency_deviation,

    -- Power balance
    SUM(CASE WHEN measurement_type = 'POWER_ACTIVE' AND `value` > 0 THEN `value` END) AS total_generation_mw,
    SUM(CASE WHEN measurement_type = 'POWER_ACTIVE' AND `value` < 0 THEN ABS(`value`) END) AS total_consumption_mw,
    SUM(CASE WHEN measurement_type = 'POWER_ACTIVE' THEN `value` END) AS power_balance_mw,

    -- Grid stability score (0-100, based on frequency deviation from 60 Hz)
    CASE
      WHEN AVG(CASE WHEN measurement_type = 'FREQUENCY' THEN `value` END) IS NULL THEN NULL
      ELSE GREATEST(0, LEAST(100, 100 - (ABS(AVG(CASE WHEN measurement_type = 'FREQUENCY' THEN `value` END) - 60.0) * 100)))
    END AS grid_stability_score,

    -- Alert counts
    SUM(
      CASE
        WHEN (measurement_type = 'VOLTAGE' AND (`value` > 765 * 1.25 OR `value` < 132 * 0.75)) THEN 1
        WHEN (measurement_type = 'FREQUENCY' AND (`value` > 60.5 OR `value` < 59.5)) THEN 1
        WHEN (measurement_type = 'PRESSURE' AND (`value` > 70 * 1.25 OR `value` < 40 * 0.75)) THEN 1
        WHEN (measurement_type = 'CURRENT' AND (`value` > 3000 * 1.25 OR `value` < 100 * 0.75)) THEN 1
        WHEN (measurement_type = 'TEMPERATURE' AND (`value` > 25 * 1.25 OR `value` < 5 * 0.75)) THEN 1
        ELSE 0
      END
    ) AS critical_alerts,
    SUM(
      CASE
        WHEN (measurement_type = 'VOLTAGE' AND (`value` > 765 * 1.15 OR `value` < 132 * 0.85)) THEN 1
        WHEN (measurement_type = 'FREQUENCY' AND (`value` > 60.2 OR `value` < 59.8)) THEN 1
        WHEN (measurement_type = 'PRESSURE' AND (`value` > 70 * 1.15 OR `value` < 40 * 0.85)) THEN 1
        WHEN (measurement_type = 'CURRENT' AND (`value` > 3000 * 1.15 OR `value` < 100 * 0.85)) THEN 1
        WHEN (measurement_type = 'TEMPERATURE' AND (`value` > 25 * 1.15 OR `value` < 5 * 0.85)) THEN 1
        ELSE 0
      END
    ) AS warning_alerts,

    window_end AS event_time

  FROM TABLE(
    TUMBLE(TABLE scada_telemetry_stream, DESCRIPTOR(event_time), INTERVAL '10' MINUTES)
  )
  GROUP BY grid_region, window_start, window_end;
