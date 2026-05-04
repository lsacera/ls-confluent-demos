-- Smart City Query 3: Traffic congestion detection and alerts
-- Detects congestion and generates alerts to smartcity-alert topic

CREATE TABLE IF NOT EXISTS smartcity_traffic_alerts (
  alert_id STRING NOT NULL,
  sensor_id STRING,
  alert_timestamp TIMESTAMP_LTZ(3) NOT NULL,
  severity STRING,
  alert_type STRING,
  message STRING,
  district STRING,
  location_name STRING,
  avg_speed DOUBLE,
  occupancy_pct DOUBLE,
  vehicle_count INT,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND,
  PRIMARY KEY (alert_id) NOT ENFORCED
)
COMMENT 'Traffic congestion alerts for Madrid monitoring'
AS
  SELECT
    COALESCE(CONCAT(sensor_id, '_', DATE_FORMAT(reading_timestamp, 'yyyyMMddHHmmssSSS')), CAST(UUID() AS STRING)) AS alert_id,
    sensor_id,
    reading_timestamp AS alert_timestamp,
    CASE
      -- Critical: Blocked traffic or sensor offline
      WHEN traffic_status = 'BLOCKED' THEN 'CRITICAL'
      WHEN traffic_status = 'OFFLINE' THEN 'CRITICAL'
      WHEN avg_speed < 5 AND occupancy_pct > 95 THEN 'CRITICAL'

      -- High: Severe congestion
      WHEN traffic_status = 'CONGESTED' THEN 'HIGH'
      WHEN avg_speed < 15 AND occupancy_pct > 85 THEN 'HIGH'

      -- Medium: Moderate congestion
      WHEN traffic_status = 'MODERATE' THEN 'MEDIUM'
      WHEN avg_speed < 30 AND occupancy_pct > 70 THEN 'MEDIUM'

      ELSE 'INFO'
    END AS severity,
    CASE
      WHEN traffic_status = 'BLOCKED' THEN 'TRAFFIC_BLOCKED'
      WHEN traffic_status = 'OFFLINE' THEN 'SENSOR_OFFLINE'
      WHEN traffic_status = 'CONGESTED' THEN 'HEAVY_CONGESTION'
      WHEN traffic_status = 'MODERATE' THEN 'MODERATE_CONGESTION'
      ELSE 'TRAFFIC_INCIDENT'
    END AS alert_type,
    CONCAT(
      'Traffic alert at ', location_name, ' (', district, '): ',
      traffic_status, ' - Speed: ', CAST(ROUND(avg_speed, 1) AS STRING), ' km/h, ',
      'Occupancy: ', CAST(ROUND(occupancy_pct, 1) AS STRING), '%'
    ) AS message,
    district,
    location_name,
    avg_speed,
    occupancy_pct,
    vehicle_count,
    event_time
  FROM smartcity_traffic_stream
  WHERE
    -- Only emit alerts for problematic traffic conditions
    traffic_status IN ('BLOCKED', 'CONGESTED', 'MODERATE', 'OFFLINE')
    OR avg_speed < 30
    OR occupancy_pct > 70;
