-- Smart City Query 2: Air quality station stream
-- Creates a structured view of air quality measurements

CREATE TABLE IF NOT EXISTS smartcity_airquality_stream (
  station_id STRING,
  reading_timestamp TIMESTAMP_LTZ(3) NOT NULL,
  district STRING,
  location_name STRING,
  latitude DOUBLE,
  longitude DOUBLE,
  no2 DOUBLE,
  pm25 DOUBLE,
  pm10 DOUBLE,
  o3 DOUBLE,
  co DOUBLE,
  aqi INT,
  quality_level STRING,
  station_status STRING,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND,
  PRIMARY KEY (station_id, reading_timestamp) NOT ENFORCED
)
COMMENT 'Air quality monitoring stream for Madrid environmental tracking'
AS
  SELECT
    station_id,
    COALESCE(TO_TIMESTAMP_LTZ(`timestamp`, 3), CURRENT_TIMESTAMP) AS reading_timestamp,
    district,
    location_name,
    latitude,
    longitude,
    no2,
    pm25,
    pm10,
    o3,
    co,
    aqi,
    CAST(quality_level AS STRING) AS quality_level,
    CAST(`status` AS STRING) AS station_status,
    `$rowtime` AS event_time
  FROM `smartcity-airquality`;
