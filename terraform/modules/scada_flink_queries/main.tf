terraform {
  required_providers {
    confluent = {
      source  = "confluentinc/confluent"
      version = ">= 2.32.0"
    }
  }
}

# =====================================================
# SCADA Flink Statements with Explicit Dependencies
# =====================================================
# Each query is created as a separate resource to ensure
# proper ordering and dependencies between statements

# ------------------------------------------------------
# Query 1: SCADA Telemetry Stream
# ------------------------------------------------------
# No dependencies - base stream from scada-telemetry topic

resource "confluent_flink_statement" "scada_telemetry_stream" {
  organization {
    id = var.organization_id
  }

  environment {
    id = var.environment_id
  }

  compute_pool {
    id = var.compute_pool_id
  }

  principal {
    id = var.service_account_id
  }

  statement  = file("${path.root}/${var.queries_dir}/01_scada_telemetry_stream.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "client.statement-name"  = "scada-telemetry-stream"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Query 2: Anomaly Detection
# ------------------------------------------------------
# DEPENDS ON: scada_telemetry_stream

resource "confluent_flink_statement" "scada_anomaly_detection" {
  organization {
    id = var.organization_id
  }

  environment {
    id = var.environment_id
  }

  compute_pool {
    id = var.compute_pool_id
  }

  principal {
    id = var.service_account_id
  }

  statement  = file("${path.root}/${var.queries_dir}/02_anomaly_detection.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "client.statement-name"  = "scada-anomaly-detection"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.scada_telemetry_stream
  ]

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Query 3: Zone Aggregations
# ------------------------------------------------------
# DEPENDS ON: scada_telemetry_stream

resource "confluent_flink_statement" "scada_zone_aggregations" {
  organization {
    id = var.organization_id
  }

  environment {
    id = var.environment_id
  }

  compute_pool {
    id = var.compute_pool_id
  }

  principal {
    id = var.service_account_id
  }

  statement  = file("${path.root}/${var.queries_dir}/03_zone_aggregations.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "sql.state-ttl"          = "1 d"
    "client.statement-name"  = "scada-zone-aggregations"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.scada_telemetry_stream
  ]

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Query 4: Grid Region Stats
# ------------------------------------------------------
# DEPENDS ON: scada_telemetry_stream

resource "confluent_flink_statement" "scada_grid_region_stats" {
  organization {
    id = var.organization_id
  }

  environment {
    id = var.environment_id
  }

  compute_pool {
    id = var.compute_pool_id
  }

  principal {
    id = var.service_account_id
  }

  statement  = file("${path.root}/${var.queries_dir}/04_grid_region_stats.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "sql.state-ttl"          = "1 d"
    "client.statement-name"  = "scada-grid-region-stats"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.scada_telemetry_stream
  ]

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Query 5: Sensor Health
# ------------------------------------------------------
# DEPENDS ON: scada_telemetry_stream

resource "confluent_flink_statement" "scada_sensor_health" {
  organization {
    id = var.organization_id
  }

  environment {
    id = var.environment_id
  }

  compute_pool {
    id = var.compute_pool_id
  }

  principal {
    id = var.service_account_id
  }

  statement  = file("${path.root}/${var.queries_dir}/05_sensor_health.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "sql.state-ttl"          = "1 h"
    "client.statement-name"  = "scada-sensor-health"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.scada_telemetry_stream
  ]

  lifecycle {
    prevent_destroy = false
  }
}
