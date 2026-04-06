output "flink_statement_ids" {
  description = "Map of SCADA Flink Statement names to their IDs"
  value = {
    "scada_telemetry_stream"   = confluent_flink_statement.scada_telemetry_stream.id
    "scada_anomaly_detection"  = confluent_flink_statement.scada_anomaly_detection.id
    "scada_zone_aggregations"  = confluent_flink_statement.scada_zone_aggregations.id
    "scada_grid_region_stats"  = confluent_flink_statement.scada_grid_region_stats.id
    "scada_sensor_health"      = confluent_flink_statement.scada_sensor_health.id
  }
}

output "flink_statement_names" {
  description = "List of SCADA Flink Statement names in order of execution"
  value = [
    "scada_telemetry_stream",
    "scada_anomaly_detection",
    "scada_zone_aggregations",
    "scada_grid_region_stats",
    "scada_sensor_health"
  ]
}

output "flink_statements" {
  description = "Full details of all SCADA Flink Statements"
  value = {
    "scada_telemetry_stream" = {
      id = confluent_flink_statement.scada_telemetry_stream.id
    }
    "scada_anomaly_detection" = {
      id = confluent_flink_statement.scada_anomaly_detection.id
    }
    "scada_zone_aggregations" = {
      id = confluent_flink_statement.scada_zone_aggregations.id
    }
    "scada_grid_region_stats" = {
      id = confluent_flink_statement.scada_grid_region_stats.id
    }
    "scada_sensor_health" = {
      id = confluent_flink_statement.scada_sensor_health.id
    }
  }
}

# Individual outputs for easier access
output "scada_telemetry_stream_id" {
  description = "Flink Statement ID for scada_telemetry_stream"
  value       = confluent_flink_statement.scada_telemetry_stream.id
}

output "scada_anomaly_detection_id" {
  description = "Flink Statement ID for scada_anomaly_detection"
  value       = confluent_flink_statement.scada_anomaly_detection.id
}

output "scada_zone_aggregations_id" {
  description = "Flink Statement ID for scada_zone_aggregations"
  value       = confluent_flink_statement.scada_zone_aggregations.id
}

output "scada_grid_region_stats_id" {
  description = "Flink Statement ID for scada_grid_region_stats"
  value       = confluent_flink_statement.scada_grid_region_stats.id
}

output "scada_sensor_health_id" {
  description = "Flink Statement ID for scada_sensor_health"
  value       = confluent_flink_statement.scada_sensor_health.id
}
