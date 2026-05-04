# Flink Queries Terraform Module

This Terraform module automatically deploys Flink SQL queries to Confluent Cloud.

## Description

The module creates Flink Statements for each SQL query defined in the `queries/` directory. It automatically manages:

- Creation of Flink Statements using the Confluent API
- Configuration of credentials and endpoints
- References to environment, compute pool, and service account
- Outputs for tracking query status

## Usage

```hcl
module "flink_queries" {
  source = "./modules/flink_queries"

  environment_id      = confluent_environment.staging.id
  compute_pool_id     = confluent_flink_compute_pool.flinkpool-main.id
  kafka_cluster_id    = confluent_kafka_cluster.standard.id
  service_account_id  = confluent_service_account.app-manager.id
  flink_api_key       = confluent_api_key.app-manager-flink-api-key.id
  flink_api_secret    = confluent_api_key.app-manager-flink-api-key.secret
  flink_rest_endpoint = data.confluent_flink_region.demo_flink_region.rest_endpoint
}
```

## Variables

| Variable | Type | Description | Required |
|----------|------|-------------|----------|
| `environment_id` | string | Confluent Cloud Environment ID | Yes |
| `compute_pool_id` | string | Flink Compute Pool ID | Yes |
| `kafka_cluster_id` | string | Kafka Cluster ID | Yes |
| `service_account_id` | string | Service Account ID for Flink | Yes |
| `flink_api_key` | string | Flink API Key | Yes |
| `flink_api_secret` | string | Flink API Secret (sensitive) | Yes |
| `flink_rest_endpoint` | string | Flink REST Endpoint | Yes |
| `queries_dir` | string | Directory containing SQL query files | No (default: "../../queries") |

## Outputs

| Output | Description |
|--------|-------------|
| `flink_statement_ids` | Map of query names to their IDs |
| `flink_statement_names` | List of deployed query names |
| `flink_statements` | Full details of all statements |

## Query Structure and Dependencies

Queries are defined as individual resources in `main.tf` with explicit dependencies using `depends_on`:

### Dependency Graph

```
enriched_customers (Query 1)  ─┐
                               ├──> product_sales (Query 3) ──> thirty_day_customer_snapshot (Query 4)
products_with_pk (Query 2)    ─┘

unique_payments (Query 5) ──> completed_orders (Query 6)
```

### Guaranteed Execution Order

1. **Group 1 (Parallel)**: `enriched_customers`, `products_with_pk`, `unique_payments`
2. **Group 2**: `product_sales` (waits for Group 1), `completed_orders` (waits for `unique_payments`)
3. **Group 3**: `thirty_day_customer_snapshot` (waits for `product_sales`)

## Important Notes

1. **Execution order**: Terraform will create statements in the correct order using explicit `depends_on`
2. **Dependencies**: Dependencies are explicitly implemented in each resource, ensuring necessary tables exist before creating queries that use them
3. **State**: Statements maintain their state in Confluent Cloud
4. **Modifications**: Changing SQL content will recreate the statement
5. **Lifecycle**: `prevent_destroy = false` allows easy destruction of statements
6. **Parallel execution**: Queries without dependencies will be created in parallel for greater efficiency

## Troubleshooting

### Statement fails to create

1. Verify that the Compute Pool is active
2. Confirm credentials are correct
3. Check that source tables/topics exist
4. Review logs in Confluent Cloud UI

### Query has syntax errors

1. Validate SQL syntax in Flink SQL Workspace
2. Verify table and column names
3. Confirm dependencies exist

### Unable to delete statements

1. Ensure there are no active dependent queries
2. Use `terraform destroy` to remove in reverse order
3. You can pause/delete manually from Confluent Cloud UI if necessary

## Resources

- [Confluent Flink SQL Documentation](https://docs.confluent.io/cloud/current/flink/index.html)
- [Terraform Confluent Provider](https://registry.terraform.io/providers/confluentinc/confluent/latest/docs)
- [Flink SQL Statement Resource](https://registry.terraform.io/providers/confluentinc/confluent/latest/docs/resources/confluent_flink_statement)
