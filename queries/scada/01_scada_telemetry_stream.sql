-- SCADA Query 1: Clean telemetry stream with parsed fields
-- This creates a structured view of sensor readings for downstream processing

CREATE TABLE IF NOT EXISTS scada_telemetry_stream (
  sensor_id STRING,
  reading_timestamp TIMESTAMP_LTZ(3) NOT NULL,
  measurement_type STRING,
  `value` DOUBLE,
  unit STRING,
  latitude DOUBLE,
  longitude DOUBLE,
  zone_id STRING,
  state STRING,
  city STRING,
  sensor_status STRING,
  grid_region STRING,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND,
  PRIMARY KEY (sensor_id, reading_timestamp) NOT ENFORCED
)
COMMENT 'Cleaned SCADA telemetry stream with all sensor readings'
AS
  SELECT
    sensor_id,
    COALESCE(TO_TIMESTAMP_LTZ(`timestamp`, 3), CURRENT_TIMESTAMP) AS reading_timestamp,
    CAST(measurement_type AS STRING) AS measurement_type,
    `value`,
    unit,
    latitude,
    longitude,
    zone_id,
    state,
    city,
    CAST(`status` AS STRING) AS sensor_status,
    CAST(grid_region AS STRING) AS grid_region,
    `$rowtime` AS event_time
  FROM `scada-telemetry`;
