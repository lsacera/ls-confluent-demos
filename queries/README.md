# Flink SQL Queries - Modular Structure

This directory contains Flink SQL queries for real-time data processing, organized by demo.

## Directory Structure

```
queries/
├── README.md                # This file
├── retail/                  # 🛒 Retail Demo Queries (6 queries)
│   ├── 01_enriched_customers.sql
│   ├── 02_products_with_pk.sql
│   ├── 03_product_sales.sql
│   ├── 04_thirty_day_customer_snapshot.sql
│   ├── 05_unique_payments.sql
│   └── 06_completed_orders.sql
└── scada/                   # ⚡ SCADA Demo Queries (5 queries)
    ├── 01_scada_telemetry_stream.sql
    ├── 02_anomaly_detection.sql
    ├── 03_zone_aggregations.sql
    ├── 04_grid_region_stats.sql
    ├── 05_sensor_health.sql
    └── README.md
```

## Retail Demo Queries (retail/)

E-commerce analytics for Customer360, product sales, and daily trends.

**Query Files:**
1. `01_enriched_customers.sql` - Denormalize customer data by joining customers and addresses
2. `02_products_with_pk.sql` - Add primary keys to products table for better querying
3. `03_product_sales.sql` - Aggregate product sales data in real-time
4. `04_thirty_day_customer_snapshot.sql` - Create customer activity snapshots over 30-day windows
5. `05_unique_payments.sql` - Deduplicate payment records
6. `06_completed_orders.sql` - Join orders with payment data to track completed orders

**Dependencies:**
```
01_enriched_customers.sql (independent)
02_products_with_pk.sql (independent)
    ↓
03_product_sales.sql (depends on 01 & 02)
    ↓
04_thirty_day_customer_snapshot.sql (depends on 03)

05_unique_payments.sql (independent)
    ↓
06_completed_orders.sql (depends on 05)
```

## SCADA Demo Queries (scada/)

Energy grid monitoring for anomaly detection, zone aggregations, and sensor health tracking.

**Query Files:**
1. `01_scada_telemetry_stream.sql` - Clean and structure raw telemetry data
2. `02_anomaly_detection.sql` - Real-time anomaly detection and alert generation
3. `03_zone_aggregations.sql` - Geographic zone-level statistics (5-min windows)
4. `04_grid_region_stats.sql` - Grid region monitoring with stability score (10-min windows)
5. `05_sensor_health.sql` - Sensor availability tracking (1-min windows)

**Dependencies:**
```
01_scada_telemetry_stream.sql (independent - base stream)
    ↓
    ├── 02_anomaly_detection.sql (depends on 01)
    ├── 03_zone_aggregations.sql (depends on 01)
    ├── 04_grid_region_stats.sql (depends on 01)
    └── 05_sensor_health.sql (depends on 01)
```

See [scada/README.md](scada/README.md) for detailed documentation.

## How Queries Are Deployed

Flink queries are deployed **conditionally** based on feature flags:

### Terraform Modules

- **retail_flink_queries** module: Deploys when `enable_retail_demo=true`
- **scada_flink_queries** module: Deploys when `enable_scada_demo=true`

### Deployment Flow

1. When you run `terraform apply`, modules are instantiated based on feature flags
2. Each query is submitted to the Confluent Cloud Flink compute pool
3. Queries run continuously, processing streaming data
4. Results are written to Kafka topics (Flink-managed)
5. PostgreSQL sink connectors read from topics and write to database
6. Dashboards query PostgreSQL for up-to-date analytics

### Feature Flags in terraform.tfvars

```hcl
enable_retail_demo = true   # Deploy retail queries
enable_scada_demo  = false  # Skip SCADA queries
```

## Modifying Queries

If you need to modify a query:

1. Edit the `.sql` file in the appropriate directory (`retail/` or `scada/`)
2. Run `terraform apply` to update the Flink statement
3. Terraform will detect the change and recreate the statement

**Note**: Recreating a Flink statement will reset its state. For production systems, consider using versioned schema evolution instead.

## Stopping/Starting Queries

To stop all Flink queries without destroying them:

```bash
terraform apply -var="stop_flink_statements=true"
```

To resume them:

```bash
terraform apply -var="stop_flink_statements=false"
```

This is useful for:
- Testing infrastructure changes
- Reducing costs during development
- Debugging data pipeline issues

## Viewing Query Status

Check query status in:

1. **Confluent Cloud Console**: Navigate to Flink → Statements
2. **Terraform State**: 
   ```bash
   terraform show | grep confluent_flink_statement
   ```
3. **Confluent CLI**: 
   ```bash
   confluent flink statement list
   ```

## Cost Considerations

Flink statements consume compute resources continuously while running. Cost depends on:

- Number of statements (6 retail + 5 SCADA if both enabled)
- Complexity of queries
- Data throughput
- Compute pool CFUs (Confluent Flink Units)

**Cost Optimization:**
- Deploy only the demo(s) you need using feature flags
- Stop statements when not actively developing: `stop_flink_statements=true`
- Destroy resources when finished: `terraform destroy`

## Query Execution Order

Terraform manages dependencies automatically through `depends_on` blocks:

- **Retail queries**: Deployed after `retail_stack` module
- **SCADA queries**: Deployed after `scada_stack` module
- Both wait for Flink compute pool and API keys to be ready

## Adding New Queries

To add a new query to a demo:

1. Create the `.sql` file in the appropriate directory
2. Add a new `confluent_flink_statement` resource in the module's `main.tf`
3. Define dependencies with `depends_on` if needed
4. Run `terraform apply`

See `terraform/modules/retail_flink_queries/main.tf` or `terraform/modules/scada_flink_queries/main.tf` for examples.
