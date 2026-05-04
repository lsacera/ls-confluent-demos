-- SCADA Query 3: Zone-level aggregations
-- Aggregates sensor readings by geographic zone for monitoring dashboards

CREATE TABLE IF NOT EXISTS scada_zone_stats (
  zone_id STRING NOT NULL,
  window_start TIMESTAMP_LTZ(3) NOT NULL,
  state STRING,
  window_end TIMESTAMP_LTZ(3),
  sensor_count BIGINT,
  avg_voltage DOUBLE,
  max_voltage DOUBLE,
  min_voltage DOUBLE,
  avg_current DOUBLE,
  avg_frequency DOUBLE,
  avg_power_active DOUBLE,
  total_power_mw DOUBLE,
  avg_pressure DOUBLE,
  avg_temperature DOUBLE,
  anomaly_count BIGINT,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '15' SECOND,
  PRIMARY KEY (zone_id, window_start) NOT ENFORCED
)
COMMENT 'Aggregated statistics by geographic zone (5-minute windows)'
AS
  SELECT
    COALESCE(zone_id, 'UNKNOWN') AS zone_id,
    window_start,
    state,
    window_end,
    COUNT(DISTINCT sensor_id) AS sensor_count,

    -- Voltage statistics
    AVG(CASE WHEN measurement_type = 'VOLTAGE' THEN `value` END) AS avg_voltage,
    MAX(CASE WHEN measurement_type = 'VOLTAGE' THEN `value` END) AS max_voltage,
    MIN(CASE WHEN measurement_type = 'VOLTAGE' THEN `value` END) AS min_voltage,

    -- Current statistics
    AVG(CASE WHEN measurement_type = 'CURRENT' THEN `value` END) AS avg_current,

    -- Frequency statistics (grid stability indicator)
    AVG(CASE WHEN measurement_type = 'FREQUENCY' THEN `value` END) AS avg_frequency,

    -- Power statistics
    AVG(CASE WHEN measurement_type = 'POWER_ACTIVE' THEN `value` END) AS avg_power_active,
    SUM(CASE WHEN measurement_type = 'POWER_ACTIVE' THEN `value` END) AS total_power_mw,

    -- Gas network statistics
    AVG(CASE WHEN measurement_type = 'PRESSURE' THEN `value` END) AS avg_pressure,
    AVG(CASE WHEN measurement_type = 'TEMPERATURE' THEN `value` END) AS avg_temperature,

    -- Anomaly count (`value`s outside normal range - 15% threshold)
    SUM(
      CASE
        WHEN (measurement_type = 'VOLTAGE' AND (`value` > 765 * 1.15 OR `value` < 132 * 0.85)) THEN 1
        WHEN (measurement_type = 'FREQUENCY' AND (`value` > 60.2 OR `value` < 59.8)) THEN 1
        WHEN (measurement_type = 'PRESSURE' AND (`value` > 70 * 1.15 OR `value` < 40 * 0.85)) THEN 1
        WHEN (measurement_type = 'TEMPERATURE' AND (`value` > 25 * 1.15 OR `value` < 5 * 0.85)) THEN 1
        ELSE 0
      END
    ) AS anomaly_count,

    window_end AS event_time

  FROM TABLE(
    TUMBLE(TABLE scada_telemetry_stream, DESCRIPTOR(event_time), INTERVAL '5' MINUTES)
  )
  GROUP BY zone_id, state, window_start, window_end;
