-- Smart City Query 1: Traffic sensor stream with parsed fields
-- Creates a structured view of traffic readings for downstream processing

CREATE TABLE IF NOT EXISTS smartcity_traffic_stream (
  sensor_id STRING,
  reading_timestamp TIMESTAMP_LTZ(3) NOT NULL,
  district STRING,
  location_name STRING,
  location_type STRING,
  latitude DOUBLE,
  longitude DOUBLE,
  vehicle_count INT,
  avg_speed DOUBLE,
  occupancy_pct DOUBLE,
  traffic_status STRING,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND,
  PRIMARY KEY (sensor_id, reading_timestamp) NOT ENFORCED
)
COMMENT 'Cleaned traffic sensor stream for Madrid urban monitoring'
AS
  SELECT
    sensor_id,
    COALESCE(TO_TIMESTAMP_LTZ(`timestamp`, 3), CURRENT_TIMESTAMP) AS reading_timestamp,
    CAST(district AS STRING) AS district,
    location_name,
    CAST(location_type AS STRING) AS location_type,
    latitude,
    longitude,
    vehicle_count,
    avg_speed,
    occupancy_pct,
    CAST(`status` AS STRING) AS traffic_status,
    `$rowtime` AS event_time
  FROM `smartcity-traffic`;
