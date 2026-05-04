output "flink_statement_ids" {
  description = "Map of Smart City Flink Statement names to their IDs"
  value = {
    "smartcity_traffic_stream"      = confluent_flink_statement.smartcity_traffic_stream.id
    "smartcity_airquality_stream"   = confluent_flink_statement.smartcity_airquality_stream.id
    "smartcity_traffic_alerts"      = confluent_flink_statement.smartcity_traffic_alerts.id
    "smartcity_district_stats"      = confluent_flink_statement.smartcity_district_stats.id
    "smartcity_emt_performance"     = confluent_flink_statement.smartcity_emt_performance.id
    "smartcity_services_sla"        = confluent_flink_statement.smartcity_services_sla.id
    "smartcity_health_dashboard"    = confluent_flink_statement.smartcity_health_dashboard.id
  }
}

output "flink_statement_names" {
  description = "List of Smart City Flink Statement names in order of execution"
  value = [
    "smartcity_traffic_stream",
    "smartcity_airquality_stream",
    "smartcity_traffic_alerts",
    "smartcity_district_stats",
    "smartcity_emt_performance",
    "smartcity_services_sla",
    "smartcity_health_dashboard"
  ]
}

output "flink_statements" {
  description = "Full details of all Smart City Flink Statements"
  value = {
    "smartcity_traffic_stream" = {
      id = confluent_flink_statement.smartcity_traffic_stream.id
    }
    "smartcity_airquality_stream" = {
      id = confluent_flink_statement.smartcity_airquality_stream.id
    }
    "smartcity_traffic_alerts" = {
      id = confluent_flink_statement.smartcity_traffic_alerts.id
    }
    "smartcity_district_stats" = {
      id = confluent_flink_statement.smartcity_district_stats.id
    }
    "smartcity_emt_performance" = {
      id = confluent_flink_statement.smartcity_emt_performance.id
    }
    "smartcity_services_sla" = {
      id = confluent_flink_statement.smartcity_services_sla.id
    }
    "smartcity_health_dashboard" = {
      id = confluent_flink_statement.smartcity_health_dashboard.id
    }
  }
}

# Individual outputs for easier access
output "smartcity_traffic_stream_id" {
  description = "Flink Statement ID for smartcity_traffic_stream"
  value       = confluent_flink_statement.smartcity_traffic_stream.id
}

output "smartcity_airquality_stream_id" {
  description = "Flink Statement ID for smartcity_airquality_stream"
  value       = confluent_flink_statement.smartcity_airquality_stream.id
}

output "smartcity_traffic_alerts_id" {
  description = "Flink Statement ID for smartcity_traffic_alerts"
  value       = confluent_flink_statement.smartcity_traffic_alerts.id
}

output "smartcity_district_stats_id" {
  description = "Flink Statement ID for smartcity_district_stats"
  value       = confluent_flink_statement.smartcity_district_stats.id
}

output "smartcity_emt_performance_id" {
  description = "Flink Statement ID for smartcity_emt_performance"
  value       = confluent_flink_statement.smartcity_emt_performance.id
}

output "smartcity_services_sla_id" {
  description = "Flink Statement ID for smartcity_services_sla"
  value       = confluent_flink_statement.smartcity_services_sla.id
}

output "smartcity_health_dashboard_id" {
  description = "Flink Statement ID for smartcity_health_dashboard"
  value       = confluent_flink_statement.smartcity_health_dashboard.id
}
