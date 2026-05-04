terraform {
  required_providers {
    confluent = {
      source  = "confluentinc/confluent"
      version = ">= 2.32.0"
    }
  }
}

# =====================================================
# Smart City Madrid Flink Statements with Dependencies
# =====================================================
# 7 queries process traffic, air quality, EMT buses,
# and citizen services for Madrid urban monitoring

# ------------------------------------------------------
# Query 1: Traffic Stream
# ------------------------------------------------------
# No dependencies - base stream from smartcity-traffic topic

resource "confluent_flink_statement" "smartcity_traffic_stream" {
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

  statement  = file("${path.root}/${var.queries_dir}/01_traffic_stream.sql")
  properties = {
    "sql.current-catalog"   = var.environment_id
    "sql.current-database"  = var.kafka_cluster_id
    "client.statement-name" = "smartcity-traffic-stream"
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
# Query 2: Air Quality Stream
# ------------------------------------------------------
# No dependencies - base stream from smartcity-airquality topic

resource "confluent_flink_statement" "smartcity_airquality_stream" {
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

  statement  = file("${path.root}/${var.queries_dir}/02_airquality_stream.sql")
  properties = {
    "sql.current-catalog"   = var.environment_id
    "sql.current-database"  = var.kafka_cluster_id
    "client.statement-name" = "smartcity-airquality-stream"
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
# Query 3: Traffic Congestion Alerts
# ------------------------------------------------------
# DEPENDS ON: smartcity_traffic_stream

resource "confluent_flink_statement" "smartcity_traffic_alerts" {
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

  statement  = file("${path.root}/${var.queries_dir}/03_traffic_congestion_alerts.sql")
  properties = {
    "sql.current-catalog"   = var.environment_id
    "sql.current-database"  = var.kafka_cluster_id
    "client.statement-name" = "smartcity-traffic-alerts"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.smartcity_traffic_stream
  ]

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Query 4: District Aggregations
# ------------------------------------------------------
# DEPENDS ON: traffic_stream, airquality_stream

resource "confluent_flink_statement" "smartcity_district_stats" {
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

  statement  = file("${path.root}/${var.queries_dir}/04_district_aggregations.sql")
  properties = {
    "sql.current-catalog"   = var.environment_id
    "sql.current-database"  = var.kafka_cluster_id
    "sql.state-ttl"         = "1 d"
    "client.statement-name" = "smartcity-district-stats"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.smartcity_traffic_stream,
    confluent_flink_statement.smartcity_airquality_stream
  ]

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Query 5: EMT Bus Performance
# ------------------------------------------------------
# No dependencies - reads directly from smartcity-emtbus topic

resource "confluent_flink_statement" "smartcity_emt_performance" {
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

  statement  = file("${path.root}/${var.queries_dir}/05_emt_bus_performance.sql")
  properties = {
    "sql.current-catalog"   = var.environment_id
    "sql.current-database"  = var.kafka_cluster_id
    "sql.state-ttl"         = "1 d"
    "client.statement-name" = "smartcity-emt-performance"
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
# Query 6: Citizen Services SLA
# ------------------------------------------------------
# No dependencies - reads directly from smartcity-service topic

resource "confluent_flink_statement" "smartcity_services_sla" {
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

  statement  = file("${path.root}/${var.queries_dir}/06_citizen_services_sla.sql")
  properties = {
    "sql.current-catalog"   = var.environment_id
    "sql.current-database"  = var.kafka_cluster_id
    "sql.state-ttl"         = "7 d"
    "client.statement-name" = "smartcity-services-sla"
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
# Query 7: City Health Score
# ------------------------------------------------------
# DEPENDS ON: traffic_stream, airquality_stream
# (Also uses emtbus and service topics directly)

resource "confluent_flink_statement" "smartcity_health_dashboard" {
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

  statement  = file("${path.root}/${var.queries_dir}/07_city_health_score.sql")
  properties = {
    "sql.current-catalog"   = var.environment_id
    "sql.current-database"  = var.kafka_cluster_id
    "sql.state-ttl"         = "1 d"
    "client.statement-name" = "smartcity-health-dashboard"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.smartcity_traffic_stream,
    confluent_flink_statement.smartcity_airquality_stream,
    confluent_flink_statement.smartcity_district_stats
  ]

  lifecycle {
    prevent_destroy = false
  }
}
