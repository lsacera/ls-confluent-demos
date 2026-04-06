output "flink_statement_ids" {
  description = "Map of Flink Statement names to their IDs"
  value = {
    "enriched_customers"            = confluent_flink_statement.enriched_customers.id
    "products_with_pk"              = confluent_flink_statement.products_with_pk.id
    "product_sales"                 = confluent_flink_statement.product_sales.id
    "thirty_day_customer_snapshot"  = confluent_flink_statement.thirty_day_customer_snapshot.id
    "unique_payments"               = confluent_flink_statement.unique_payments.id
    "completed_orders"              = confluent_flink_statement.completed_orders.id
  }
}

output "flink_statement_names" {
  description = "List of Flink Statement names in order of execution"
  value = [
    "enriched_customers",
    "products_with_pk",
    "product_sales",
    "thirty_day_customer_snapshot",
    "unique_payments",
    "completed_orders"
  ]
}

output "flink_statements" {
  description = "Full details of all Flink Statements"
  value = {
    "enriched_customers" = {
      id = confluent_flink_statement.enriched_customers.id
    }
    "products_with_pk" = {
      id = confluent_flink_statement.products_with_pk.id
    }
    "product_sales" = {
      id = confluent_flink_statement.product_sales.id
    }
    "thirty_day_customer_snapshot" = {
      id = confluent_flink_statement.thirty_day_customer_snapshot.id
    }
    "unique_payments" = {
      id = confluent_flink_statement.unique_payments.id
    }
    "completed_orders" = {
      id = confluent_flink_statement.completed_orders.id
    }
  }
}

# Individual outputs for easier access
output "enriched_customers_id" {
  description = "Flink Statement ID for enriched_customers"
  value       = confluent_flink_statement.enriched_customers.id
}

output "products_with_pk_id" {
  description = "Flink Statement ID for products_with_pk"
  value       = confluent_flink_statement.products_with_pk.id
}

output "product_sales_id" {
  description = "Flink Statement ID for product_sales"
  value       = confluent_flink_statement.product_sales.id
}

output "thirty_day_customer_snapshot_id" {
  description = "Flink Statement ID for thirty_day_customer_snapshot"
  value       = confluent_flink_statement.thirty_day_customer_snapshot.id
}

output "unique_payments_id" {
  description = "Flink Statement ID for unique_payments"
  value       = confluent_flink_statement.unique_payments.id
}

output "completed_orders_id" {
  description = "Flink Statement ID for completed_orders"
  value       = confluent_flink_statement.completed_orders.id
}
