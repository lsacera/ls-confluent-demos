terraform {
  required_providers {
    confluent = {
      source  = "confluentinc/confluent"
      version = ">= 2.32.0"
    }
  }
}

# =====================================================
# Flink Statements with Explicit Dependencies
# =====================================================
# Each query is created as a separate resource to ensure
# proper ordering and dependencies between statements

# NOTE: The 'payments' table is automatically available in Flink's catalog
# from the Kafka topic, so we don't need to create it explicitly

# ------------------------------------------------------
# Query 1: Enriched Customers
# ------------------------------------------------------
# No dependencies - can be created first

resource "confluent_flink_statement" "enriched_customers" {
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

  statement  = file("${path.root}/${var.queries_dir}/01_enriched_customers.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "client.statement-name"  = "enriched-customer-materializer"
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
# Query 2: Products with PK
# ------------------------------------------------------
# No dependencies - can be created in parallel with Query 1

resource "confluent_flink_statement" "products_with_pk" {
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

  statement  = file("${path.root}/${var.queries_dir}/02_products_with_pk.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "client.statement-name"  = "products-with-pk-materializer"
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
# Query 3: Product Sales
# ------------------------------------------------------
# DEPENDS ON: enriched_customers, products_with_pk

resource "confluent_flink_statement" "product_sales" {
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

  statement  = file("${path.root}/${var.queries_dir}/03_product_sales.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "sql.state-ttl"          = "1 d"
    "client.statement-name"  = "product-sales-materializer"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.enriched_customers,
    confluent_flink_statement.products_with_pk
  ]

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Query 4: Thirty Day Customer Snapshot
# ------------------------------------------------------
# DEPENDS ON: product_sales

resource "confluent_flink_statement" "thirty_day_customer_snapshot" {
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

  statement  = file("${path.root}/${var.queries_dir}/04_thirty_day_customer_snapshot.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "sql.state-ttl"          = "30 d"
    "client.statement-name"  = "customer-snapshot-materializer"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.product_sales
  ]

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------
# Query 5: Unique Payments
# ------------------------------------------------------
# No dependencies - payments table is available from Kafka catalog

resource "confluent_flink_statement" "unique_payments" {
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

  statement  = file("${path.root}/${var.queries_dir}/05_unique_payments.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "sql.state-ttl"          = "1 h"
    "client.statement-name"  = "unique-payments-maintenance"
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
# Query 6: Completed Orders
# ------------------------------------------------------
# DEPENDS ON: unique_payments

resource "confluent_flink_statement" "completed_orders" {
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

  statement  = file("${path.root}/${var.queries_dir}/06_completed_orders.sql")
  properties = {
    "sql.current-catalog"    = var.environment_id
    "sql.current-database"   = var.kafka_cluster_id
    "client.statement-name"  = "completed-orders-materializer"
  }

  stopped = var.stop_statements

  rest_endpoint = var.flink_rest_endpoint

  credentials {
    key    = var.flink_api_key
    secret = var.flink_api_secret
  }

  depends_on = [
    confluent_flink_statement.unique_payments
  ]

  lifecycle {
    prevent_destroy = false
  }
}
