-- SCADA Query 2: Real-time anomaly detection
-- Detects `value`s outside normal operating ranges and generates alerts

CREATE TABLE IF NOT EXISTS scada_anomalies (
  alert_id STRING NOT NULL,
  sensor_id STRING,
  alert_timestamp TIMESTAMP_LTZ(3) NOT NULL,
  severity STRING,
  alert_type STRING,
  message STRING,
  measured_value DOUBLE,
  threshold_value DOUBLE,
  zone_id STRING,
  state STRING,
  resolved BOOLEAN,
  resolved_at TIMESTAMP(3),
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND,
  PRIMARY KEY (alert_id) NOT ENFORCED
)
COMMENT 'Real-time anomaly alerts detected from telemetry data'
AS
  SELECT
    COALESCE(CONCAT(sensor_id, '_', DATE_FORMAT(reading_timestamp, 'yyyyMMddHHmmssSSS')), CAST(UUID() AS STRING)) AS alert_id,
    sensor_id,
    reading_timestamp AS alert_timestamp,
    CASE
      -- Critical anomalies (>25% outside range)
      WHEN measurement_type = 'VOLTAGE' AND (`value` > 765 * 1.25 OR `value` < 132 * 0.75) THEN 'CRITICAL'
      WHEN measurement_type = 'FREQUENCY' AND (`value` > 60.5 OR `value` < 59.5) THEN 'CRITICAL'
      WHEN measurement_type = 'PRESSURE' AND (`value` > 70 * 1.25 OR `value` < 40 * 0.75) THEN 'CRITICAL'
      WHEN measurement_type = 'CURRENT' AND (`value` > 3000 * 1.25 OR `value` < 100 * 0.75) THEN 'CRITICAL'
      WHEN measurement_type = 'TEMPERATURE' AND (`value` > 25 * 1.25 OR `value` < 5 * 0.75) THEN 'CRITICAL'

      -- Warning anomalies (15-25% outside range)
      WHEN measurement_type = 'VOLTAGE' AND (`value` > 765 * 1.15 OR `value` < 132 * 0.85) THEN 'WARNING'
      WHEN measurement_type = 'CURRENT' AND (`value` > 3000 * 1.15 OR `value` < 100 * 0.85) THEN 'WARNING'
      WHEN measurement_type = 'FREQUENCY' AND (`value` > 60.2 OR `value` < 59.8) THEN 'WARNING'
      WHEN measurement_type = 'POWER_ACTIVE' AND (`value` > 500 * 1.15 OR `value` < 50 * 0.85) THEN 'WARNING'
      WHEN measurement_type = 'POWER_REACTIVE' AND (`value` > 100 * 1.15 OR `value` < 10 * 0.85) THEN 'WARNING'
      WHEN measurement_type = 'PRESSURE' AND (`value` > 70 * 1.15 OR `value` < 40 * 0.85) THEN 'WARNING'
      WHEN measurement_type = 'FLOW' AND (`value` > 50000 * 1.15 OR `value` < 1000 * 0.85) THEN 'WARNING'
      WHEN measurement_type = 'TEMPERATURE' AND (`value` > 25 * 1.15 OR `value` < 5 * 0.85) THEN 'WARNING'

      ELSE 'INFO'
    END AS severity,
    CASE
      WHEN measurement_type = 'VOLTAGE' AND `value` > 765 * 1.15 THEN 'VOLTAGE_HIGH'
      WHEN measurement_type = 'VOLTAGE' AND `value` < 132 * 0.85 THEN 'VOLTAGE_LOW'
      WHEN measurement_type = 'FREQUENCY' AND (`value` > 60.2 OR `value` < 59.8) THEN 'FREQUENCY_DEVIATION'
      WHEN measurement_type = 'CURRENT' AND `value` > 3000 * 1.15 THEN 'OVERLOAD'
      WHEN measurement_type = 'PRESSURE' AND `value` < 40 * 0.85 THEN 'PRESSURE_DROP'
      WHEN measurement_type = 'TEMPERATURE' AND `value` > 25 * 1.15 THEN 'TEMPERATURE_HIGH'
      WHEN measurement_type IN ('POWER_ACTIVE', 'POWER_REACTIVE') AND (`value` > 500 * 1.15 OR `value` < 50 * 0.85) THEN 'POWER_IMBALANCE'
      ELSE 'EQUIPMENT_FAILURE'
    END AS alert_type,
    CONCAT(
      measurement_type, ' anomaly detected: ',
      CAST(`value` AS STRING), ' ', unit,
      ' at sensor ', sensor_id, ' in ', city, ', ', state
    ) AS message,
    `value` AS measured_value,
    CASE
      WHEN measurement_type = 'VOLTAGE' THEN 765.0
      WHEN measurement_type = 'CURRENT' THEN 3000.0
      WHEN measurement_type = 'FREQUENCY' THEN 60.05
      WHEN measurement_type = 'POWER_ACTIVE' THEN 500.0
      WHEN measurement_type = 'POWER_REACTIVE' THEN 100.0
      WHEN measurement_type = 'PRESSURE' THEN 70.0
      WHEN measurement_type = 'FLOW' THEN 50000.0
      WHEN measurement_type = 'TEMPERATURE' THEN 25.0
      ELSE 0.0
    END AS threshold_value,
    zone_id,
    state,
    FALSE AS resolved,
    CAST(NULL AS TIMESTAMP(3)) AS resolved_at,
    event_time
  FROM scada_telemetry_stream
  WHERE
    -- Only emit alerts for anomalous `value`s (15% threshold)
    (measurement_type = 'VOLTAGE' AND (`value` > 765 * 1.15 OR `value` < 132 * 0.85))
    OR (measurement_type = 'CURRENT' AND (`value` > 3000 * 1.15 OR `value` < 100 * 0.85))
    OR (measurement_type = 'FREQUENCY' AND (`value` > 60.2 OR `value` < 59.8))
    OR (measurement_type = 'POWER_ACTIVE' AND (`value` > 500 * 1.15 OR `value` < 50 * 0.85))
    OR (measurement_type = 'POWER_REACTIVE' AND (`value` > 100 * 1.15 OR `value` < 10 * 0.85))
    OR (measurement_type = 'PRESSURE' AND (`value` > 70 * 1.15 OR `value` < 40 * 0.85))
    OR (measurement_type = 'FLOW' AND (`value` > 50000 * 1.15 OR `value` < 1000 * 0.85))
    OR (measurement_type = 'TEMPERATURE' AND (`value` > 25 * 1.15 OR `value` < 5 * 0.85));
