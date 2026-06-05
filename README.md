# Real-Time Stream Processing Demos using Confluent Cloud + Apache Flink

This repository contains **three independent streaming demos** showcasing real-time data processing with Confluent Cloud and Apache Flink:

## 🛒 **Retail Demo** - E-commerce Analytics
Processes sales orders in real-time for **Customer360**, **Product Sales Analysis**, and **Daily Sales Trends**. Demonstrates how retailers can leverage a Data Streaming Platform (DSP) to clean and govern data at creation time, delivering fresh trustworthy data to warehouses and lakes.

<a href="https://www.youtube.com/watch?v=1jZfAmXH_4g" target="_blank">🎥 Watch Retail Demo on YouTube</a>

## ⚡ **SCADA Demo** - Energy Grid Monitoring
Simulates a USA energy grid with real-time telemetry from 180 electrical and gas network sensors across 18 locations. Demonstrates **anomaly detection**, **grid stability monitoring**, and **predictive maintenance** using Flink SQL for critical infrastructure monitoring. Includes a real-time web dashboard for operations teams.

<a href="https://www.youtube.com/watch?v=3aAs8vcjKqU" target="_blank">🎥 Watch SCADA Demo on YouTube</a>

## 🏙️ **Smart City Madrid Demo** - Urban Intelligence Platform
Simulates Madrid's urban systems with real-time data from **17 traffic sensors**, **12 air quality stations**, **10 EMT buses**, and **citizen service requests**. Demonstrates **traffic management**, **air quality monitoring**, **public transport optimization**, and **citizen engagement** using Flink SQL for smart city operations. Features an integrated **City Health Score** dashboard combining multiple urban metrics.

<a href="https://www.youtube.com/watch?v=msJXtzAlj90" target="_blank">🎥 Watch Smart City Demo on YouTube</a>

All demos can be deployed **independently** or **together**, thanks to a modular Terraform architecture with feature flags.

## What's Included

### Shared Infrastructure (Always Deployed)
- **Confluent Cloud**: Apache Kafka cluster with Apache Flink for stream processing
- **AWS Infrastructure**:
  - **Dedicated VPC** (10.0.0.0/16) with DNS support for isolated networking
  - **RDS PostgreSQL database** for materialized views (secured within VPC)
  - **Multi-AZ subnets** across availability zones for high availability
  - **Security Groups** with restricted access (VPC, Confluent Cloud egress IPs, authorized IPs only)
  - ECS Fargate cluster for containerized applications
  - ECR repositories for Docker image storage
  - S3 bucket for Tableflow (Iceberg data storage)
  - IAM roles and policies for Confluent Cloud integration
- **Confluent Cloud Provider Integration**: Secure connection between Confluent Cloud and AWS S3 for Tableflow capabilities

### Network Security
The infrastructure implements **defense-in-depth** security:
- **Dedicated VPC**: Isolated network (10.0.0.0/16) separate from default VPC
- **PostgreSQL RDS Security**:
  - Accessible **only from**:
    - **Your current public IP** (automatically detected during deployment)
    - ECS VPC CIDR block (10.0.0.0/16) for containerized applications
    - Confluent Cloud egress IPs (27 static IPs for us-east-1 connectors)
    - Optional Twingate/VPN IP (if configured via `twingate_ip` variable)
  - **NOT** publicly accessible from internet (0.0.0.0/0)
- **DNS Enabled**: VPC has DNS hostnames and resolution for RDS endpoint resolution
- **Multi-AZ Deployment**: Subnets span multiple availability zones for redundancy

### 🛒 Retail Demo Components (Optional - via `enable_retail_demo=true`)
- **Applications**:
  - DB Feeder: Generates synthetic order data → PostgreSQL
  - Payments App: Publishes payment events → Kafka
- **PostgreSQL CDC Source Connector** (Debezium): Reads from RDS PostgreSQL → Kafka topics (customers, addresses, products, orders)
- **Kafka Topics**: `payments`, `error-payments` (+ CDC topics: customers, addresses, products, orders)
- **Avro Schemas**: Payment schema with CSFLE (Client-Side Field Level Encryption)
- **Flink Queries**: 6 queries for Customer360, Product Sales, Daily Trends
- **Real-time Dashboard**: Web UI for retail analytics

### ⚡ SCADA Demo Components (Optional - via `enable_scada_demo=true`)
- **Applications**:
  - SCADA Simulator: Generates telemetry from 180 sensors (10 per location) across USA grid regions → **Kafka (direct publish, no CDC)**
  - SCADA Dashboard: Real-time web UI for grid monitoring and anomaly analysis
- **Kafka Topics**: `scada-telemetry`, `scada-alerts`, `error-scada-telemetry`
- **Avro Schemas**: Telemetry and Alert schemas with geographic data
- **Flink Queries**: 5 queries for anomaly detection, zone aggregations, grid stability, sensor health
- **Measurement Types**: VOLTAGE, CURRENT, FREQUENCY (60 Hz), POWER, PRESSURE, FLOW, TEMPERATURE
- **Grid Regions**: ERCOT (Texas), WECC (West), EASTERN (East USA)
- **Dashboard Pages**: Overview, Anomalies, Grid Health, Sensor Health, Geographic, Architecture

### 🏙️ Smart City Madrid Demo Components (Optional - via `enable_smartcity_demo=true`)
- **Applications**:
  - Smart City Simulator (Java): Generates urban telemetry from 40 sensors/services → **Kafka (direct publish, no CDC)**
  - Smart City Dashboard: Real-time web UI for urban operations and city health monitoring
- **Kafka Topics**: `smartcity-traffic`, `smartcity-airquality`, `smartcity-emtbus`, `smartcity-service`, `smartcity-alert`
- **Avro Schemas**: 5 schemas for Traffic, AirQuality, EMTBus, Service, and Alert data
- **Flink Queries**: 7 queries for traffic analysis, air quality monitoring, EMT performance, service SLA tracking, city health score
- **Data Sources**:
  - **Traffic Sensors** (17): M-30 ring road (5), Major avenues (4), Highway access (3), Downtown intersections (3), Smart parking (2)
  - **Air Quality Stations** (12): Urban core stations (4), Park locations (4), Peripheral areas (4)
  - **EMT Buses** (10): Lines 1, 3, 6, 27, 74, 146 with real-time telemetry
  - **Citizen Services**: 311-style requests (lighting, cleaning, potholes, parks, urban furniture)
- **Dashboard Pages**: Overview, Traffic, Air Quality, EMT Buses, Services, Districts, Architecture

## Prerequisites

### Required Accounts

* **Confluent Cloud Account**

   [![Sign up for Confluent Cloud](https://img.shields.io/badge/Sign%20up%20for%20Confluent%20Cloud-007BFF?style=for-the-badge&logo=apachekafka&logoColor=white)](https://www.confluent.io/get-started/?utm_campaign=tm.pmm_cd.q4fy25-quickstart-streaming-agents&utm_source=github&utm_medium=demo)

   * **Confluent Cloud API Keys** - [Cloud resource management API Keys](https://docs.confluent.io/cloud/current/security/authenticate/workload-identities/service-accounts/api-keys/overview.html#resource-scopes) with Organisation Admin permissions.

* **AWS Account** with appropriate permissions to create:
  - VPC, Subnets, Security Groups (dedicated VPC will be created)
  - RDS PostgreSQL instances (multi-AZ with restricted access)
  - ECS Fargate services
  - ECR repositories
  - S3 buckets
  - IAM roles and policies

> **Security Note**: This deployment creates a **dedicated VPC** with **restricted database access**. The RDS PostgreSQL database is **NOT** publicly accessible from the internet. Access is limited to:
> - **Your current public IP** (automatically detected during deployment - no configuration needed)
> - Applications running in the ECS VPC (10.0.0.0/16)
> - Confluent Cloud connector egress IPs (automatically configured for us-east-1)
> - **Optional**: Twingate/VPN IP address (configure `twingate_ip` variable in `terraform.tfvars` for persistent remote access)

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

> [!CAUTION]
> **🚨 CRITICAL: The `prefix` Variable 🚨**
> 
> The `prefix` variable (default: `"ls-demo"`) is **CRITICAL** for resource naming across the entire infrastructure:
> - AWS resources: `{prefix}-ecs-cluster`, `{prefix}-rds-instance`, etc.
> - Flink catalog: `{prefix}.public.table_name`
> - PostgreSQL tables created by Flink use this prefix
> 
> **⚠️ WARNING:** If you change the prefix from default `"ls-demo"`, you **MUST** manually update ALL Flink query files in:
> - `queries/retail/*.sql` - Update all catalog references (e.g., `ls-demo.public.orders`)
> - `queries/scada/*.sql` - Update all catalog references
> - `queries/smartcity/*.sql` - Update all catalog references
> 
> **💡 STRONGLY RECOMMENDED:** Keep the default `prefix = "ls-demo"` unless absolutely necessary.

Edit `terraform/terraform.tfvars` and set your configuration:

```hcl
# Required: Confluent Cloud credentials
confluent_cloud_api_key    = "YOUR_KEY"
confluent_cloud_api_secret = "YOUR_SECRET"

# Required: AWS region
cloud_region = "us-east-1"

# CRITICAL: Resource naming prefix (see warning above)
prefix = "ls-demo"  # ⚠️ DO NOT CHANGE unless you update all Flink queries

# Optional: Feature flags - Choose which demo(s) to deploy
# Note: All flags are set to false by default and configured by deployment scripts
enable_retail_demo    = false   # 🛒 Retail demo
enable_scada_demo     = false   # ⚡ SCADA demo
enable_smartcity_demo = false   # 🏙️ Smart City Madrid demo

# Optional: Persistent remote database access via Twingate/VPN
# Your current public IP is automatically detected and allowed during deployment
# Only configure this if you need persistent access from a specific VPN/Twingate IP
# twingate_ip = "203.0.113.1"  # Uncomment and set your Twingate/VPN IP if needed

# Optional: Data warehouse integration (COMPLETELY OPTIONAL - demos work without it)
data_warehouse = "none"  # Options: "none", "redshift", "snowflake"
```

**For Snowflake integration (OPTIONAL - only if you want to query Iceberg tables from Snowflake):**
```hcl
data_warehouse = "snowflake"
snowflake_account = "<ORGANIZATION_ID-ACCOUNT_NAME>"
snowflake_username = "<SNOWFLAKE_USERNAME>"
snowflake_password = "<SNOWFLAKE_PASSWORD>"
```

> **Note:** Snowflake integration is **completely optional**. The demos work fully without it. Only configure if you want to query Kafka data via Snowflake using Tableflow/Iceberg.

See `terraform/terraform.tfvars.modular_example` for complete configuration examples.

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

#### 🏙️ Deploy Smart City Madrid Demo Only

```bash
chmod +x deploy-smartcity-demo.sh
./deploy-smartcity-demo.sh
```

This deploys:
- Smart City Simulator (17 traffic sensors, 12 air quality stations, 10 EMT buses, citizen services)
- Smart City Kafka topics and schemas
- Smart City Flink queries (traffic analysis, air quality, EMT performance, city health)
- Smart City web dashboard with integrated city health score

**Estimated time:** 15-25 minutes

## Important Considerations

**Data Generation:**
- As the data is synthetic and there is some windowing in Flink, let the demo resources run for 5 or 10 minutes to start seeing results.
- For instance, in the retail demo the payment will be computed 5 minutes after the orders, so no payment will be completed in the first 5 minutes.

**PostgreSQL CDC Source Connector:**
- **Only deployed with Retail Demo** (`enable_retail_demo=true`)
- SCADA and Smart City demos do **NOT** use CDC - they publish directly to Kafka
- When deploying Retail Demo, expect a 120-second wait for CDC topics to be created (customers, addresses, products, orders)

**Network Architecture Change (Important):**
This demo now uses a **dedicated VPC** with enhanced security instead of the AWS default VPC:
- ✅ **Dedicated VPC** (10.0.0.0/16) isolated from other AWS resources
- ✅ **Multi-AZ subnets** for high availability
- ✅ **DNS enabled** (required for RDS with public accessibility)
- ✅ **Restricted database access** via Security Groups:
  - ECS applications within VPC can access RDS
  - Confluent Cloud connectors can access RDS (27 whitelisted egress IPs)
  - External access requires explicit IP whitelisting (see Troubleshooting section)
- ❌ Database is **NOT** open to the internet (0.0.0.0/0)

**Why this matters**: The previous architecture used the default VPC with public access (0.0.0.0/0), which was convenient but insecure. The current architecture follows AWS best practices for production-ready deployments.

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

**Flink Queries** ([queries/retail/](queries/retail/)):
1. `01_enriched_customers.sql` - Customer360 with addresses
2. `02_products_with_pk.sql` - Product catalog normalization
3. `03_product_sales.sql` - Product sales aggregation
4. `04_thirty_day_customer_snapshot.sql` - Customer activity trends
5. `05_unique_payments.sql` - Deduplication and payment validation
6. `06_completed_orders.sql` - Order completion tracking

**Dashboard**: Real-time visualization of Customer360, Product Sales, Daily Trends

**Data Flow**: 
- PostgreSQL (orders) → **PostgreSQL CDC Source Connector (Debezium)** → Kafka → Flink → PostgreSQL → Dashboard
- Payments App → Kafka → Flink → PostgreSQL → Dashboard

**Note**: PostgreSQL CDC Source Connector is **only deployed with Retail Demo** (`enable_retail_demo=true`)

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

**Data Flow**: SCADA Simulator → Kafka (direct publish) → Flink (Stream Processing) → PostgreSQL Sink → Web Dashboard

**Note**: SCADA demo does **NOT** use CDC - simulator publishes directly to Kafka

---

### 🏙️ Smart City Madrid Demo - Urban Intelligence Platform

**Application:**
- **Smart City Simulator** (Java): Generates urban telemetry from 40 sensors/services across Madrid (every 5 seconds)
  - 17 traffic sensors with rush hour patterns (7-10 AM, 5-8 PM)
  - 12 air quality stations with pollutant measurements (NO2, PM2.5, PM10, O3, CO)
  - 10 EMT buses on 6 real Madrid bus lines with real-time position simulation
  - Citizen service requests with SLA tracking and workflow states

**Data Sources:**
- **Traffic Sensors** (17 locations):
  - M-30 Ring Road: M30-Norte, M30-Sur, M30-Este, M30-Oeste, M30-Nudo-Sur
  - Major Avenues: Gran Vía, Paseo de la Castellana, Calle de Alcalá, Paseo del Prado
  - Highway Access: A1-Acceso-Norte, A2-Acceso-Este, A6-Acceso-Noroeste
  - Downtown Intersections: Puerta del Sol, Plaza de Cibeles, Plaza de España
  - Smart Parking: Parking-Centro, Parking-Retiro
- **Air Quality Stations** (12 locations): Plaza de España, Retiro, Casa de Campo, Barajas, etc.
- **EMT Bus Lines**: 1, 3, 6, 27, 74, 146
- **Citizen Services**: ALUMBRADO_PUBLICO, LIMPIEZA_BASURA, BACHES_PAVIMENTO, PARQUES_JARDINES, MOBILIARIO_URBANO

**Flink Queries** ([queries/smartcity/](queries/smartcity/)):
1. `01_traffic_stream.sql` - Traffic sensor data stream with watermarks
2. `02_airquality_stream.sql` - Air quality measurements with AQI calculation
3. `03_traffic_alerts.sql` - Real-time traffic congestion detection (CRITICAL/HIGH/MEDIUM alerts)
4. `04_district_stats.sql` - District-level aggregations (5-minute windows) for traffic + air quality
5. `05_emt_performance.sql` - EMT bus performance metrics (5-minute windows)
6. `06_services_sla.sql` - Citizen service SLA monitoring (1-hour windows)
7. `07_city_health_score.sql` - Integrated city health dashboard (10-minute windows)
   - Weighted scoring: 30% traffic + 30% air quality + 20% transport + 20% services
   - Health status: EXCELLENT (≥80), GOOD (≥60), MODERATE (≥40), POOR (<40)

**Key Metrics:**
- **City Health Score**: 0-100 composite metric from all urban systems
- **Traffic Status**: FLUID, MODERATE, CONGESTED, BLOCKED, OFFLINE
- **Air Quality Index (AQI)**: GOOD, MODERATE, UNHEALTHY_SENSITIVE, UNHEALTHY, VERY_UNHEALTHY, HAZARDOUS
- **EMT Performance**: Delay tracking, occupancy patterns, schedule adherence
- **Service SLA**: Response time compliance by priority (URGENTE: 4h, ALTA: 24h, MEDIA: 72h, BAJA: 168h)

**Real-time Dashboard:**
- Overview: City health score, KPIs, recent alerts, critical incidents
- Traffic: 17 sensors with status, speed, occupancy, congestion patterns
- Air Quality: 12 stations with pollutant levels, AQI trends, health recommendations
- EMT Buses: 10 buses with real-time position, delays, occupancy levels
- Services: Citizen requests with SLA compliance, category breakdown, response times
- Districts: Aggregated metrics by Madrid district, trends, rankings
- Architecture: Data pipeline visualization, Flink statements, topic metrics

**Data Flow**: Smart City Simulator (Java) → Kafka (direct publish) → Flink (Stream Processing) → PostgreSQL Sink → Web Dashboard

**Note**: Smart City demo does **NOT** use CDC - simulator publishes directly to Kafka


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
terraform destroy -var="enable_retail_demo=false" -var="enable_scada_demo=false" -var="enable_smartcity_demo=false"
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
    ├── scada_stack/            # ⚡ SCADA demo resources
    │   └── main.tf            # Topics, simulator, schemas (conditionally deployed)
    └── smartcity_stack/        # 🏙️ Smart City demo resources
        └── main.tf            # Topics, simulator, schemas (conditionally deployed)
```

**Optional Feature Flags (in `terraform.tfvars`):**
```hcl
enable_retail_demo    = true   # Deploy retail demo
enable_scada_demo     = false  # Deploy SCADA demo
enable_smartcity_demo = false  # Deploy Smart City Madrid demo
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
│       │ │   • smartcity-traffic, airquality, emtbus, service,       │
│       │ │     alert (Smart City Madrid)                             │
│       │ │                                                           │
│  ┌────┴─┴──────────────────────────────────────────────────────┐    │
│  │      Provider Integration (S3 Tableflow - Iceberg)          │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
         │                                                   │
         │   Confluent Egress IPs                            │
         │   (27 whitelisted IPs)                            │
         │                                                   │
         ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AWS Dedicated VPC (10.0.0.0/16)                 │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │              Security Groups (Restricted Access)           │     │
│  │  • ECS VPC CIDR: 10.0.0.0/16                              │     │
│  │  • Confluent Cloud egress IPs (27 IPs for connectors)     │     │
│  │  • Authorized external IP (optional for remote access)    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                              │                                      │
│                              ▼                                      │
│                  ┌─────────────────────┐                            │
│                  │   RDS PostgreSQL    │                            │
│                  │   (Multi-AZ)        │                            │
│                  │ ✓ DNS enabled       │                            │
│                  │ ✓ Secured in VPC    │                            │
│                  │ ✓ Private access    │                            │
│                  └─────────────────────┘                            │
│                           │                                         │
│  ┌────────────────────────┴──────────────────────────┐              │
│  │                 ECS Fargate Cluster               │              │
│  │  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐           │
│  │  │ Retail Apps  │ │  SCADA Apps   │ │ SmartCity    │           │
│  │  │ • DB Feeder  │ │ • Simulator   │ │ • Simulator  │           │
│  │  │ • Payments   │ │ • Dashboard   │ │ • Dashboard  │           │
│  │  │ • Dashboard  │ │               │ │              │           │
│  │  └──────────────┘ └───────────────┘ └──────────────┘           │
│  └───────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌──────────────────────┐
                  │     S3 Bucket        │
                  │  (Tableflow/Iceberg) │
                  └──────────────────────┘
                              │
                              ▼
                  ┌──────────────────────┐
                  │  Amazon Athena       │
                  │  Snowflake           │
                  │  Databricks          │
                  │  (optional)          │
                  └──────────────────────┘
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

- **SCADA Demo** (2 ECS tasks):
  - SCADA Simulator (0.25 vCPU, 512MB): ~$8/month
  - SCADA Dashboard (0.5 vCPU, 1GB): ~$15/month
  - ECR + Data Transfer: ~$2/month
  - **SCADA Total:** ~$25/month

- **Smart City Madrid Demo** (2 ECS tasks):
  - Smart City Simulator (0.25 vCPU, 512MB): ~$8/month
  - Smart City Dashboard (0.5 vCPU, 1GB): ~$15/month
  - ECR + Data Transfer: ~$2/month
  - **Smart City Total:** ~$25/month

### Total Costs (Per Demo)
- **Retail Demo Only:** ~$53-58/month (shared infrastructure + retail)
- **SCADA Demo Only:** ~$45-50/month (shared infrastructure + SCADA)
- **Smart City Demo Only:** ~$45-50/month (shared infrastructure + Smart City)

**Note:** Deploy only one demo at a time to minimize costs.

### Data Warehouse Integration (COMPLETELY OPTIONAL)
**Note:** These integrations are **entirely optional**. All demos work fully without them. Only needed if you want to query Kafka data from external warehouses via Tableflow/Iceberg.

- Snowflake: Pay-per-use (minimal for demo if configured)
- Redshift: Serverless or on-demand
- Databricks: Check with Databricks

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
| "Cannot connect to RDS from local machine" | RDS is secured within VPC. To access externally, add your IP to `aws.tf` security group rules (see below) |
| "Connector failed: connection attempt failed" | Ensure Confluent Cloud egress IPs are whitelisted in RDS security group (already configured for us-east-1) |
| "DB subnet group AZ coverage error" | Ensure `aws_availability_zones` data source filters for standard AZs only (already configured) |
| "VPC network state fault" | Ensure VPC has `enable_dns_hostnames` and `enable_dns_support` set to true (already configured) |
| "Feature flag error" | Use the corresponding deployment script (e.g., `./deploy-retail-demo.sh`) which sets the feature flags automatically |

### Adding Your IP to RDS Security Group (Optional)

If you need direct access to PostgreSQL from your local machine:

1. Get your public IP:
   ```bash
   curl -4 ifconfig.me
   ```

2. Edit `terraform/aws.tf` and add a new security group rule:
   ```hcl
   resource "aws_security_group_rule" "allow_postgres_from_my_ip" {
     type              = "ingress"
     from_port         = 5432
     to_port           = 5432
     protocol          = "tcp"
     security_group_id = aws_security_group.db_security_group.id
     cidr_blocks       = ["YOUR_IP/32"]  # Replace with your IP
     description       = "Allow PostgreSQL from my IP"
   }
   ```

3. Apply the change:
   ```bash
   cd terraform
   terraform apply
   ```

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

# SCADA Dashboard
aws logs tail /ecs/scada-dashboard-task-* --follow --region us-east-1
```

**Smart City app logs:**
```bash
# Smart City Simulator
aws logs tail /ecs/smartcity-simulator-task-* --follow --region us-east-1

# Smart City Dashboard
aws logs tail /ecs/smartcity-dashboard-task-* --follow --region us-east-1
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
