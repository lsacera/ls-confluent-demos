# Real-Time Stream Processing Demos using Confluent Cloud + Apache Flink

This repository contains **two independent streaming demos** showcasing real-time data processing with Confluent Cloud and Apache Flink:

## 🛒 **Retail Demo** - E-commerce Analytics
Processes sales orders in real-time for **Customer360**, **Product Sales Analysis**, and **Daily Sales Trends**. Demonstrates how retailers can leverage a Data Streaming Platform (DSP) to clean and govern data at creation time, delivering fresh trustworthy data to warehouses and lakes.

[![Watch the demo video](https://raw.githubusercontent.com/lsacera/ls-confluent-demos/main/assets/ls-retail-demo.jpg)](https://raw.githubusercontent.com/lsacera/ls-confluent-demos/main/assets/ls-retail-demo.mp4)

## ⚡ **SCADA Demo** - Energy Grid Monitoring
Simulates a USA energy grid with real-time telemetry from 180 electrical and gas network sensors across 18 locations. Demonstrates **anomaly detection**, **grid stability monitoring**, and **predictive maintenance** using Flink SQL for critical infrastructure monitoring. Includes a real-time web dashboard for operations teams.

Both demos can be deployed **independently** or **together**, thanks to a modular Terraform architecture with feature flags.

## What's Included

### Shared Infrastructure (Always Deployed)
- **Confluent Cloud**: Apache Kafka cluster with Apache Flink for stream processing
- **AWS Infrastructure**:
  - RDS PostgreSQL database for materialized views
  - ECS Fargate cluster for containerized applications
  - VPC, Security Groups, and networking
  - ECR repositories for Docker image storage
  - S3 bucket for Tableflow (Iceberg data storage)
  - IAM roles and policies for Confluent Cloud integration
- **Confluent Cloud Provider Integration**: Secure connection between Confluent Cloud and AWS S3 for Tableflow capabilities

### 🛒 Retail Demo Components (Optional - via `enable_retail_demo=true`)
- **Applications**:
  - DB Feeder: Generates synthetic order data → PostgreSQL
  - Payments App: Publishes payment events → Kafka
- **Kafka Topics**: `payments`, `error-payments`
- **Avro Schemas**: Payment schema with CSFLE (Client-Side Field Level Encryption)
- **Flink Queries**: 6 queries for Customer360, Product Sales, Daily Trends
- **Real-time Dashboard**: Web UI for retail analytics

### ⚡ SCADA Demo Components (Optional - via `enable_scada_demo=true`)
- **Applications**:
  - SCADA Simulator: Generates telemetry from 180 sensors (10 per location) across USA grid regions → Kafka
  - SCADA Dashboard: Real-time web UI for grid monitoring and anomaly analysis
- **Kafka Topics**: `scada-telemetry`, `scada-alerts`, `error-scada-telemetry`
- **Avro Schemas**: Telemetry and Alert schemas with geographic data
- **Flink Queries**: 5 queries for anomaly detection, zone aggregations, grid stability, sensor health
- **Measurement Types**: VOLTAGE, CURRENT, FREQUENCY (60 Hz), POWER, PRESSURE, FLOW, TEMPERATURE
- **Grid Regions**: ERCOT (Texas), WECC (West), EASTERN (East USA)
- **Dashboard Pages**: Overview, Anomalies, Grid Health, Sensor Health, Geographic, Architecture

## Prerequisites

### Required Accounts

* **Confluent Cloud Account**

   [![Sign up for Confluent Cloud](https://img.shields.io/badge/Sign%20up%20for%20Confluent%20Cloud-007BFF?style=for-the-badge&logo=apachekafka&logoColor=white)](https://www.confluent.io/get-started/?utm_campaign=tm.pmm_cd.q4fy25-quickstart-streaming-agents&utm_source=github&utm_medium=demo)

   * **Confluent Cloud API Keys** - [Cloud resource management API Keys](https://docs.confluent.io/cloud/current/security/authenticate/workload-identities/service-accounts/api-keys/overview.html#resource-scopes) with Organisation Admin permissions.

* **AWS Account** with appropriate permissions to create:
  - VPC, Subnets, Security Groups
  - RDS PostgreSQL instances
  - ECS Fargate services
  - ECR repositories
  - S3 buckets
  - IAM roles and policies

### Required Tools

* **Terraform** (>= 1.0) - Infrastructure as Code tool
* **Docker Desktop** - For building containers (and running containers locally optionally)
* **AWS CLI** - For AWS authentication and resource management
* **Confluent CLI** - Used by cleanup scripts to remove items created outside Terraform
* **jq** - JSON processor for parsing outputs

#### Installing on macOS

```bash
# Install dependencies
brew install git terraform confluent-cli docker jq

# Configure AWS credentials
aws configure
```

Or export credentials as environment variables:

```bash
export AWS_ACCESS_KEY_ID="YOUR_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"   # only if using temporary creds
```

#### Installing on Windows

Run the following in Windows Terminal or PowerShell (winget required):

```powershell
# Install dependencies
winget install -e --id Git.Git
winget install -e --id Hashicorp.Terraform
winget install -e --id Docker.DockerDesktop
winget install -e --id ConfluentInc.Confluent-CLI
winget install -e --id Amazon.AWSCLI
winget install -e --id jqlang.jq

# Configure AWS credentials
aws configure
```

Or set environment variables in PowerShell:

```powershell
$env:AWS_ACCESS_KEY_ID="YOUR_KEY_ID"
$env:AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
$env:AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"   # only if using temporary creds
```

**Note for Windows users:** If Docker Desktop shows a virtualization error, install WSL and restart:

```powershell
wsl.exe --install
```

## Quick Start - Automated Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/confluentinc/ls-confluent-demos.git
cd ls-confluent-demos
```

### 2. Configure Variables

Edit `terraform/terraform.tfvars` and set your configuration:

```hcl
# Required: Confluent Cloud credentials
confluent_cloud_api_key    = "YOUR_KEY"
confluent_cloud_api_secret = "YOUR_SECRET"

# Required: AWS region
cloud_region = "us-east-1"

# Optional: Feature flags - Choose which demo(s) to deploy
enable_retail_demo = false   # 🛒 Retail demo
enable_scada_demo  = false  # ⚡ SCADA demo (or true to deploy both)

Both variables are set false by default and are set in the deployment scripts

# Optional: Data warehouse integration
data_warehouse = "none"  # Options: "none", "redshift", "snowflake"
```

**For Snowflake integration:**
```hcl
data_warehouse = "snowflake"
snowflake_account = "<ORGANIZATION_ID-ACCOUNT_NAME>"
snowflake_username = "<SNOWFLAKE_USERNAME>"
snowflake_password = "<SNOWFLAKE_PASSWORD>"
```

See `terraform/terraform.tfvars.modular_example` for complete configuration examples.

**⚠️ IMPORTANT: About the `prefix` Variable**

The `prefix` variable (default: `"ls-demo"`) is **critical** for resource naming and is used throughout the infrastructure:
- AWS resources: `{prefix}-ecs-cluster`, `{prefix}-rds-instance`, etc.
- Flink table names: `{prefix}_enriched_customers`, `{prefix}_scada_sensor_health`, etc.
- PostgreSQL tables created by Flink: `{prefix}_enriched_customers`, `{prefix}_product_sales`, etc.

**If you change the prefix from the default `"ls-demo"`**, you **MUST** update all Flink query files to reference the new table names:

**Retail queries** (`queries/retail/*.sql`):
- Update all references in JOIN statements and SELECT queries

**SCADA queries** (`queries/scada/*.sql`):
- Update all references in window functions and aggregations

**Recommendation:** Keep the default `prefix = "ls-demo"` unless you have specific naming requirements.

### 3. Deploy Your Demo(s)

Choose the deployment script based on which demo you want:

#### 🛒 Deploy Retail Demo Only

```bash
chmod +x deploy-retail-demo.sh
./deploy-retail-demo.sh
```

This deploys:
- DB Feeder + Payments App
- Retail Kafka topics and schemas
- Retail Flink queries
- Web dashboard for retail analytics

**Estimated time:** 20-25 minutes

#### ⚡ Deploy SCADA Demo Only

```bash
chmod +x deploy-scada-demo.sh
./deploy-scada-demo.sh
```

This deploys:
- SCADA Simulator (180 sensors across 18 locations)
- SCADA Kafka topics and schemas
- SCADA Flink queries (anomaly detection, grid stats, sensor health)
- SCADA web dashboard for real-time monitoring

**Estimated time:** 20-25 minutes

#### 🛒⚡ Deploy Both Demos Together

```bash
chmod +x deploy-both-demos.sh
./deploy-both-demos.sh
```

This deploys both retail and SCADA demos sharing the same infrastructure.

**Estimated time:** 30-40 minutes

## Important consideration 

As the data is syntetic and there some windowing in Flink, let the demo resources run for 5 or 10 minutes to start seeing results.
For instance, in the retail demo the payment will be computed 5 minutes after the orders, so no payment will be completed in the first 5 minutes.

## Manual Deployment (Alternative)

If you prefer more control over the deployment process you can try the manual alternative, but be careful with variables.

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

After deployment, get the dashboard URL:

```bash
cd terraform
CLUSTER=$(terraform output -json dashboard_ecs_info | jq -r '.cluster')
TASK=$(aws ecs list-tasks --cluster $CLUSTER --service-name dashboard-service --region us-east-1 --query 'taskArns[0]' --output text)
ENI=$(aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK --region us-east-1 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI --region us-east-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text)
echo "Dashboard URL: http://$IP"
```

## Demo Use Cases

### 🛒 Retail Demo - E-commerce Real-Time Analytics

**Applications:**
- **DB Feeder**: Generates synthetic customer orders → PostgreSQL (every 5 seconds)
- **Payments App**: Publishes payment events → Kafka `payments` topic (every 5 seconds)

**Flink Queries** ([queries/](queries/)):
1. `01_enriched_customers.sql` - Customer360 with addresses
2. `02_products_with_pk.sql` - Product catalog normalization
3. `03_product_sales.sql` - Product sales aggregation
4. `04_thirty_day_customer_snapshot.sql` - Customer activity trends
5. `05_unique_payments.sql` - Deduplication and payment validation
6. `06_completed_orders.sql` - Order completion tracking

**Dashboard**: Real-time visualization of Customer360, Product Sales, Daily Trends

**Data Flow**: PostgreSQL → Debezium CDC → Kafka → Flink → PostgreSQL → Dashboard

---

### ⚡ SCADA Demo - Energy Grid Monitoring

**Application:**
- **SCADA Simulator**: Generates telemetry from 180 sensors (10 per location) across USA grid regions (every 5 seconds)
  - Uses Gaussian distribution for realistic, stable sensor values
  - 2% anomaly rate with 15-25% deviations from normal ranges
  - Sensors have fixed IDs for consistent health tracking

**Sensors Locations (18 locations, 10 sensors each = 180 total):**
- **ERCOT** (Texas): Houston, Dallas, Austin, San Antonio
- **WECC** (West): Los Angeles, San Francisco, San Diego, Phoenix, Seattle, Portland, Denver
- **EASTERN** (East): New York, Boston, Philadelphia, Miami, Atlanta, Chicago, Detroit

**Measurement Types:**
- **Electrical Grid**: VOLTAGE (132-765 kV), CURRENT (100-3000 A), FREQUENCY (59.95-60.05 Hz), POWER (50-500 MW)
- **Gas Network**: PRESSURE (40-70 bar), FLOW (1000-50000 m³/h), TEMPERATURE (5-25°C)

**Flink Queries** ([queries/scada/](queries/scada/)):
1. `01_scada_telemetry_stream.sql` - Structured telemetry stream with watermarks
2. `02_anomaly_detection.sql` - Real-time anomaly detection with severity classification
   - WARNING: 15% deviation from normal range
   - CRITICAL: 25% deviation from normal range
3. `03_zone_aggregations.sql` - Zone-level statistics (5-minute windows)
4. `04_grid_region_stats.sql` - Grid region monitoring with stability score (10-minute windows)
5. `05_sensor_health.sql` - Sensor availability tracking (1-minute windows, expects 12 readings/min)

**Key Metrics:**
- **Grid Stability Score**: 0-100 calculated as `100 - (ABS(avg_frequency - 60.0) * 100)`, bounded [0,100]
- **Power Balance**: Generation vs Consumption in MW (positive = exporting, negative = importing)
- **Anomaly Detection**: Tiered alerting system (WARNING for early detection, CRITICAL for immediate action)
- **Sensor Health**: Tracks consecutive missed readings to detect failing sensors

**Real-time Dashboard:**
- Overview: KPIs, recent alerts, grid health summary
- Anomalies: Severity breakdown, type analysis, filterable alert table
- Grid Health: Regional stability scores, power metrics, 24-hour trends
- Sensor Health: Status distribution, failing sensors requiring maintenance
- Geographic: Anomaly heat map by state, regional alert distribution
- Architecture: Data pipeline visualization, Flink statements, topic metrics

**Data Flow**: SCADA Simulator → Kafka → Flink (Stream Processing) → PostgreSQL Sink → Web Dashboard


## Clean-up - Destroy Resources

To avoid incurring charges, destroy resources when finished.

```bash
chmod +x destroy-all.sh
./destroy-all.sh
```

Destroys all infrastructure (shared + all demos).

### Manual Destruction

```bash
cd terraform
terraform destroy -var="enable_retail_demo=false" -var="enable_scada_demo=false"
```

## Architecture Overview

### Modular Architecture with Feature Flags

This demo uses **Terraform modules** with feature flags for flexible deployment:

```
terraform/
├── ecs-infrastructure.tf       # Shared: VPC, ECS Cluster, IAM roles
├── aws.tf                      # Shared: RDS, S3, networking
├── confluent.tf                # Shared: Kafka cluster, Flink pool
├── demo-stacks.tf              # Orchestration with feature flags
└── modules/
    ├── retail_stack/           # 🛒 Retail demo resources
    │   └── main.tf            # Topics, apps, schemas (conditionally deployed)
    └── scada_stack/            # ⚡ SCADA demo resources
        └── main.tf            # Topics, simulator, schemas (conditionally deployed)
```

**Optional Feature Flags (in `terraform.tfvars`):**
```hcl
enable_retail_demo = true   # Deploy retail demo
enable_scada_demo  = false  # Deploy SCADA demo
```

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Confluent Cloud                               │
│  ┌────────────┐  ┌──────────────────┐  ┌──────────────────────┐     │
│  │   Kafka    │  │  Flink Compute   │  │  Schema Registry     │     │
│  │  Cluster   │──│  Pool (Stream    │──│  (Avro Schemas)      │     │
│  │            │  │   Processing)    │  │                      │     │
│  └────────────┘  └──────────────────┘  └──────────────────────┘     │
│       │ │                                                           │
│       │ │   Topics (conditionally created based on feature flags):  │
│       │ │   • payments, error-payments (Retail)                     │
│       │ │   • scada-telemetry, scada-alerts (SCADA)                 │
│       │ │                                                           │
│  ┌────┴─┴──────────────────────────────────────────────────────┐    │
│  │      Provider Integration (S3 Tableflow - Iceberg)          │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
         │                           │                      │
         │                           ▼                      │
         │                  ┌─────────────────┐             │
         │                  │ RDS PostgreSQL  │             │
         │                  │ (Materialized   │             │
         │                  │   Views)        │             │
         │                  └─────────────────┘             │
         │                           │                      │
         ▼                           ▼                      ▼
┌──────────────────┐       ┌──────────────────┐   ┌─────────────────┐
│ Fargate (retail) │       │  Fargate (scada) │   │   S3 Bucket     │
│    DB Feeder     │       │   SCADA sim.     │   │  (Tableflow/    │
│   Payments App   │       │   Dashboard.     │   │   Iceberg)      │
│    Dashboard     │       │                  │   │                 │
└──────────────────┘       └──────────────────┘   └─────────────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │  Amazon Athena  │
                                                   │  Snowflake      │
                                                   │  Databricks     │
                                                   │  (optional)     │
                                                   └─────────────────┘
```

**About Tableflow**: S3 bucket and Confluent Cloud Provider Integration enable [Tableflow](https://docs.confluent.io/cloud/current/flink/operate-and-deploy/tableflow.html), which materializes Kafka topics as Apache Iceberg tables in S3 for querying with Athena, Snowflake, or other analytics engines. 
Tableflow can be set in any topic and the S3 bucket will be ready for that matter.

## Estimated Costs

### Confluent Cloud
- Basic cluster: ~$1-2/day for demo usage
- Flink compute pools: Varies based on usage (~$0.50-1/hour when running)

### AWS (Shared Infrastructure)
- RDS PostgreSQL (db.t3.micro): ~$15/month
- VPC, Networking, Security Groups: ~$5/month
- S3 bucket (Tableflow storage): ~$1-5/month (depends on data volume)
- **Shared Total:** ~$20-25/month

### AWS (Per Demo)
- **Retail Demo** (3 ECS tasks):
  - DB Feeder (0.25 vCPU, 512MB): ~$8/month
  - Payments App (0.25 vCPU, 512MB): ~$8/month
  - Dashboard (0.5 vCPU, 1GB): ~$15/month
  - ECR + Data Transfer: ~$2/month
  - **Retail Total:** ~$33/month

- **SCADA Demo** (1 ECS task):
  - SCADA Simulator (0.25 vCPU, 512MB): ~$8/month
  - ECR + Data Transfer: ~$1/month
  - **SCADA Total:** ~$9/month

### Total Costs
- **Retail Demo Only:** ~$53-58/month (shared + retail)
- **SCADA Demo Only:** ~$29-34/month (shared + SCADA)
- **Both Demos:** ~$62-67/month (shared + both)

### Data Warehouse (Optional)
- Snowflake: Pay-per-use (minimal for demo)
- Redshift: Serverless or on-demand
- Databricks: check with Databricks.

**Tip:** Always destroy resources after demos to avoid ongoing charges. Use `./destroy-all.sh` to clean up everything.

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "AWS credentials not configured" | Run `aws configure` or set environment variables |
| "Docker daemon not running" | Start Docker Desktop |
| "Terraform init failed" | Ensure you're in the `terraform/` directory |
| "ECR repository not found" | Wait for `terraform apply` to create resources |
| "Dashboard shows no data" | Verify Flink queries are running in Confluent Cloud |
| "Cannot connect to RDS" | Check security group allows your IP |
| "Feature flag error" | Ensure `enable_retail_demo` or `enable_scada_demo` is `true` in `terraform.tfvars` |

### Viewing Logs

**Retail apps logs:**
```bash
# DB Feeder
aws logs tail /ecs/db-feeder-task-* --follow --region us-east-1

# Payments App
aws logs tail /ecs/payments-task-* --follow --region us-east-1

# Dashboard
aws logs tail /ecs/dashboard-task-* --follow --region us-east-1
```

**SCADA app logs:**
```bash
# SCADA Simulator
aws logs tail /ecs/scada-simulator-task-* --follow --region us-east-1
```

**Local dashboard logs:**
```bash
docker logs -f dashboard-test
```

### Verify Deployment

```bash
cd terraform

# Check which demos are deployed
terraform output

# Verify ECS services
aws ecs list-services --cluster $(terraform output -raw ecs_cluster_name) --region us-east-1

# Check Kafka topics
confluent kafka topic list --cluster $(terraform output -raw kafka_cluster_id)
```

## Support

For issues or questions contact Luis Sanchez (lsanchezacera@confluent.io)

## License

This project is licensed under the Apache License 2.0.
