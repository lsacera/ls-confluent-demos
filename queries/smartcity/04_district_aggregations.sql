-- Smart City Query 4: District-level aggregations (5-minute windows)
-- Aggregates traffic, air quality, and city metrics by Madrid district

CREATE TABLE IF NOT EXISTS smartcity_district_stats (
  district STRING NOT NULL,
  window_start TIMESTAMP_LTZ(3) NOT NULL,
  window_end TIMESTAMP_LTZ(3) NOT NULL,
  avg_traffic_speed DOUBLE,
  avg_occupancy DOUBLE,
  total_vehicles INT,
  congested_sensors INT,
  total_traffic_sensors INT,
  avg_aqi INT,
  avg_no2 DOUBLE,
  avg_pm25 DOUBLE,
  unhealthy_air_stations INT,
  total_air_stations INT,
  event_time TIMESTAMP_LTZ(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND,
  PRIMARY KEY (district, window_start) NOT ENFORCED
)
COMMENT 'District-level aggregated statistics (5-minute windows)'
AS
  SELECT
    COALESCE(district, 'UNKNOWN') AS district,
    COALESCE(CAST(window_start AS TIMESTAMP_LTZ(3)), TIMESTAMP '1970-01-01 00:00:00') AS window_start,
    COALESCE(CAST(window_end AS TIMESTAMP_LTZ(3)), TIMESTAMP '1970-01-01 00:00:00') AS window_end,

    -- Traffic metrics
    ROUND(AVG(avg_speed), 2) AS avg_traffic_speed,
    ROUND(AVG(occupancy_pct), 2) AS avg_occupancy,
    SUM(vehicle_count) AS total_vehicles,
    SUM(CASE WHEN traffic_status IN ('CONGESTED', 'BLOCKED') THEN 1 ELSE 0 END) AS congested_sensors,
    CAST(COUNT(DISTINCT CASE WHEN sensor_id IS NOT NULL THEN sensor_id END) AS INT) AS total_traffic_sensors,

    -- Air quality metrics
    CAST(ROUND(AVG(aqi)) AS INT) AS avg_aqi,
    ROUND(AVG(no2), 2) AS avg_no2,
    ROUND(AVG(pm25), 2) AS avg_pm25,
    SUM(CASE WHEN quality_level IN ('UNHEALTHY', 'VERY_UNHEALTHY', 'HAZARDOUS') THEN 1 ELSE 0 END) AS unhealthy_air_stations,
    CAST(COUNT(DISTINCT CASE WHEN station_id IS NOT NULL THEN station_id END) AS INT) AS total_air_stations,

    CAST(window_end AS TIMESTAMP_LTZ(3)) AS event_time
  FROM (
    SELECT
      COALESCE(t.district, a.district) AS district,
      COALESCE(t.window_start, a.window_start) AS window_start,
      COALESCE(t.window_end, a.window_end) AS window_end,
      t.sensor_id,
      t.avg_speed,
      t.occupancy_pct,
      t.vehicle_count,
      t.traffic_status,
      a.station_id,
      a.aqi,
      a.no2,
      a.pm25,
      a.quality_level
    FROM (
      SELECT
        district,
        window_start,
        window_end,
        sensor_id,
        AVG(avg_speed) AS avg_speed,
        AVG(occupancy_pct) AS occupancy_pct,
        SUM(vehicle_count) AS vehicle_count,
        MAX(traffic_status) AS traffic_status
      FROM TABLE(
        TUMBLE(TABLE smartcity_traffic_stream, DESCRIPTOR(event_time), INTERVAL '5' MINUTES)
      )
      GROUP BY district, window_start, window_end, sensor_id
    ) t
    FULL OUTER JOIN (
      SELECT
        district,
        window_start,
        window_end,
        station_id,
        AVG(aqi) AS aqi,
        AVG(no2) AS no2,
        AVG(pm25) AS pm25,
        MAX(quality_level) AS quality_level
      FROM TABLE(
        TUMBLE(TABLE smartcity_airquality_stream, DESCRIPTOR(event_time), INTERVAL '5' MINUTES)
      )
      GROUP BY district, window_start, window_end, station_id
    ) a
    ON t.district = a.district
      AND CAST(t.window_start AS TIMESTAMP_LTZ(3)) = CAST(a.window_start AS TIMESTAMP_LTZ(3))
      AND CAST(t.window_end AS TIMESTAMP_LTZ(3)) = CAST(a.window_end AS TIMESTAMP_LTZ(3))
  )
  GROUP BY district, window_start, window_end;
