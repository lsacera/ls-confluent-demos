-- SCADA Query 5: Sensor health monitoring
-- Detects offline or malfunctioning sensors based on reading patterns

CREATE TABLE IF NOT EXISTS scada_sensor_health (
  sensor_id STRING NOT NULL,
  window_start TIMESTAMP_LTZ(3) NOT NULL,
  zone_id STRING,
  state STRING,
  city STRING,
  window_end TIMESTAMP_LTZ(3),
  reading_count BIGINT,
  expected_readings BIGINT,
  health_percentage DOUBLE,
  status STRING,
  last_reading_time TIMESTAMP_LTZ(3),
  consecutive_failures BIGINT,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '30' SECOND,
  PRIMARY KEY (sensor_id, window_start) NOT ENFORCED
)
COMMENT 'Sensor health status based on reading frequency (1-minute windows)'
AS
  SELECT
    sensor_id,
    window_start,
    zone_id,
    state,
    city,
    window_end,
    COUNT(*) AS reading_count,
    12 AS expected_readings,  -- Expecting ~12 readings per minute (5 sec interval)
    (COUNT(*) * 100.0 / 12) AS health_percentage,
    CASE
      WHEN COUNT(*) = 0 THEN 'OFFLINE'
      WHEN COUNT(*) < 4 THEN 'CRITICAL'
      WHEN COUNT(*) < 8 THEN 'WARNING'
      ELSE 'HEALTHY'
    END AS status,
    MAX(reading_timestamp) AS last_reading_time,
    -- Calculate failures: 12 expected - actual readings
    GREATEST(0, 12 - COUNT(*)) AS consecutive_failures,
    window_end AS event_time

  FROM TABLE(
    TUMBLE(TABLE scada_telemetry_stream, DESCRIPTOR(event_time), INTERVAL '1' MINUTE)
  )
  GROUP BY sensor_id, zone_id, state, city, window_start, window_end;
