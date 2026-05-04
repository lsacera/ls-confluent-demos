-- Smart City Query 5: EMT bus performance monitoring
-- Analyzes bus delays, occupancy, and service quality

CREATE TABLE IF NOT EXISTS smartcity_emt_performance (
  bus_line STRING NOT NULL,
  window_start TIMESTAMP_LTZ(3) NOT NULL,
  window_end TIMESTAMP_LTZ(3) NOT NULL,
  total_buses INT,
  avg_delay_minutes DOUBLE,
  buses_delayed INT,
  buses_on_time INT,
  avg_occupancy_pct DOUBLE,
  overcrowded_buses INT,
  avg_speed DOUBLE,
  buses_in_service INT,
  buses_at_stop INT,
  buses_out_of_service INT,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND,
  PRIMARY KEY (bus_line, window_start) NOT ENFORCED
)
COMMENT 'EMT bus line performance metrics (5-minute windows)'
AS
  WITH bus_aggregates AS (
    SELECT
      line,
      bus_id,
      window_start,
      window_end,
      AVG(delay_minutes) AS avg_delay,
      AVG(occupancy_pct) AS avg_occupancy,
      AVG(speed) AS avg_speed,
      MAX(CAST(`status` AS STRING)) AS last_status
    FROM TABLE(
      TUMBLE(
        TABLE `smartcity-emtbus`,
        DESCRIPTOR(`$rowtime`),
        INTERVAL '5' MINUTES
      )
    )
    GROUP BY line, bus_id, window_start, window_end
  )
  SELECT
    line AS bus_line,
    CAST(window_start AS TIMESTAMP_LTZ(3)) AS window_start,
    CAST(window_end AS TIMESTAMP_LTZ(3)) AS window_end,
    CAST(COUNT(DISTINCT bus_id) AS INT) AS total_buses,
    ROUND(AVG(avg_delay), 1) AS avg_delay_minutes,
    CAST(COUNT(DISTINCT CASE WHEN avg_delay > 3 THEN bus_id END) AS INT) AS buses_delayed,
    CAST(COUNT(DISTINCT CASE WHEN avg_delay BETWEEN -2 AND 3 THEN bus_id END) AS INT) AS buses_on_time,
    ROUND(AVG(avg_occupancy), 1) AS avg_occupancy_pct,
    CAST(COUNT(DISTINCT CASE WHEN avg_occupancy > 90 THEN bus_id END) AS INT) AS overcrowded_buses,
    ROUND(AVG(avg_speed), 1) AS avg_speed,
    CAST(COUNT(DISTINCT CASE WHEN last_status = 'IN_SERVICE' THEN bus_id END) AS INT) AS buses_in_service,
    CAST(COUNT(DISTINCT CASE WHEN last_status = 'AT_STOP' THEN bus_id END) AS INT) AS buses_at_stop,
    CAST(COUNT(DISTINCT CASE WHEN last_status IN ('OUT_OF_SERVICE', 'MAINTENANCE', 'OFFLINE') THEN bus_id END) AS INT) AS buses_out_of_service,
    CAST(window_end AS TIMESTAMP_LTZ(3)) AS event_time
  FROM bus_aggregates
  GROUP BY line, window_start, window_end;
