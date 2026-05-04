# Smart City Madrid Stack Module

Terraform module for deploying the **Smart City Madrid** demo infrastructure on AWS + Confluent Cloud.

## Overview

This module deploys a comprehensive urban monitoring system simulating Madrid's smart city infrastructure:
- **17 traffic sensors** across M-30 ring road, main avenues, intersections, and downtown areas
- **12 air quality monitoring stations** measuring NO2, PM2.5, PM10, O3, CO with real-time AQI calculation
- **11 EMT Madrid buses** with real-time telemetry (position, delays, occupancy) on major routes
- **Citizen service requests** (311-style reporting system: Avisos Madrid - línea 010)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Smart City Simulator (ECS Fargate)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Traffic    │  │ Air Quality  │  │  EMT Buses   │      │
│  │  (17 sensor) │  │ (12 stations)│  │  (11 buses)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         │  ┌──────────────┴───────┐          │              │
│         │  │  Citizen Services    │          │              │
│         │  │  (311 reporting)     │          │              │
│         │  └──────────┬───────────┘          │              │
└─────────┼─────────────┼──────────────────────┼──────────────┘
          │             │                      │
          ▼             ▼                      ▼
    ┌──────────────────────────────────────────────────┐
    │         Confluent Kafka (4 topics)               │
    │  • smartcity-traffic                             │
    │  • smartcity-airquality                          │
    │  • smartcity-emtbus                              │
    │  • smartcity-service                             │
    └───────────────────┬──────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Schema Registry│
              │  (5 Avro schemas│
              └─────────────────┘
```

## Resources Deployed

### Kafka Topics (5)
| Topic | Partitions | Retention | Description |
|-------|-----------|-----------|-------------|
| `smartcity-traffic` | 6 | 7 days | Traffic sensor readings (vehicle count, speed, occupancy) |
| `smartcity-airquality` | 3 | 7 days | Air quality measurements (NO2, PM2.5, PM10, O3, CO, AQI) |
| `smartcity-emtbus` | 3 | 7 days | EMT bus telemetry (position, delay, occupancy, next stop) |
| `smartcity-service` | 3 | 30 days | Citizen service requests (ticket lifecycle, SLA tracking) |
| `smartcity-alert` | 3 | 30 days | System alerts (traffic congestion, air quality warnings) |

### Avro Schemas (5)
- `smartcity-traffic-value` - TrafficSensor schema with Madrid districts enum
- `smartcity-airquality-value` - AirQualityStation schema with pollutant measurements
- `smartcity-emtbus-value` - EmtBus schema with real-time telemetry
- `smartcity-service-value` - CitizenService schema for 311-style requests
- `smartcity-alert-value` - SmartCityAlert schema for notifications

### ECS Infrastructure
- **ECR Repository**: `{prefix}-smartcity-simulator-repo`
- **Docker Image**: Java 17 application with Maven build
- **ECS Task**: Fargate task (256 CPU, 512 MB memory)
- **ECS Service**: Single container deployment with auto-restart
- **CloudWatch Logs**: `/ecs/smartcity-simulator-task-*`

## Data Generation

### Traffic Sensors (17 total)
**M-30 Ring Road (5 sensors)**
- Locations: M-30 Norte, M-30 Este, M-30 Sur, M-30 Suroeste, M-30 Oeste
- Metrics: High vehicle counts (1200/hr base), variable speeds (congestion patterns)

**Main Avenues (4 sensors)**
- Gran Vía - Callao, Paseo de la Castellana, Calle Alcalá, Paseo del Prado
- Metrics: Moderate traffic (800/hr), urban speed limits

**Highway Access (3 sensors)**
- A-1 Norte, M-40 Aeropuerto, A-4 Sur
- Metrics: High-speed zones, rush hour patterns

**Intersections (3 sensors)**
- Plaza de España, Glorieta de Atocha, Plaza de Castilla
- Metrics: Low speeds, high occupancy

**Downtown (2 sensors)**
- Puerta del Sol, Plaza Mayor
- Metrics: Pedestrian zones, very low speeds

**Simulation Features:**
- Rush hour patterns (7-10 AM, 5-8 PM): 1.5x vehicle count, 0.5x speed
- Midnight low traffic: 0.2x vehicle count, 1.3x speed
- Random variation: ±20% on all metrics
- Status classification: FLUID, MODERATE, CONGESTED, BLOCKED, OFFLINE (1% chance)

### Air Quality Stations (12 total)
**Urban Core (4 stations)** - High pollution (1.5x base)
- Centro: Plaza del Carmen, Plaza de España
- Salamanca: Serrano-Goya
- Chamberi: Paseo de la Castellana

**Green Areas (3 stations)** - Low pollution (1.0x base)
- Retiro: Parque del Retiro
- Moncloa-Aravaca: Casa de Campo
- Fuencarral-El Pardo: Monte de El Pardo

**Mid-Level (3 stations)** - Moderate pollution
- Arganzuela, Tetuan, Carabanchel

**Peripheral (2 stations)** - Lower pollution
- Barajas, Villaverde

**Pollution Metrics:**
- NO2: 20-40 µg/m³ normal (limit: 40, bad: >100)
- PM2.5: 15 µg/m³ base (good: <12, bad: >35)
- PM10: 25 µg/m³ base (good: <20, bad: >50)
- O3: 45 µg/m³ base (peaks 12-4 PM in sunlight)
- CO: 0.5 mg/m³ base
- AQI: Calculated from worst pollutant (0-100 good, >200 bad)

**Simulation Features:**
- Rush hour increase: 1.4x pollution
- Night decrease: 0.6x pollution
- Quality levels: GOOD, MODERATE, UNHEALTHY_SENSITIVE, UNHEALTHY, VERY_UNHEALTHY, HAZARDOUS
- Station status: 2% chance MAINTENANCE or ERROR

### EMT Buses (11 buses on 7 lines)
**Lines Simulated:**
- Line 1: Pinar de Chamartín - Portazgo (2 buses)
- Line 3: Puerta de Toledo - Villaverde Alto (1 bus)
- Line 6: Moncloa - Plaza Elíptica (2 buses, articulated)
- Line 27: Plaza Castilla - Embajadores (2 buses, electric)
- Line 74: Príncipe Pío - Barrio del Pilar (1 bus)
- Line 146: Cuatro Caminos - Orcasitas (2 buses, hybrid)
- Line N21: Cibeles - Aeropuerto T4 nocturno (1 bus)

**Telemetry:**
- Real-time GPS position (lat/lon within Madrid bounds: 40.3-40.5, -3.9 to -3.5)
- Speed: 0-40 km/h (30% chance stopped at bus stop)
- Heading: 0-360° with route-following simulation
- Occupancy: Rush hour 70-100%, night 10-25%, normal 30-65%
- Delays: -3 to +8 minutes (biased towards delays)
- Next stop ETA: 1-3 minutes
- Status: IN_SERVICE (main), AT_STOP (20%), OUT_OF_SERVICE (2%)

**Vehicle Types:**
- Standard (80 capacity), Articulated (120), Electric (90), Hybrid (85)

### Citizen Services (311-style)
**Categories (6 types):**
- ALUMBRADO_PUBLICO (street lighting): 4h SLA
- LIMPIEZA_BASURA (cleaning/trash): 24h SLA
- BACHES_PAVIMENTO (potholes/pavement): 72h SLA
- PARQUES_JARDINES (parks/gardens): 168h SLA
- MOBILIARIO_URBANO (urban furniture): 168h SLA
- OTROS (other): 168h SLA

**Priorities:**
- URGENTE: 4h SLA (safety hazards: socavón, árbol caído)
- ALTA: 24h SLA (high impact: baches, contenedor lleno)
- MEDIA: 72h SLA (moderate: alumbrado, limpieza)
- BAJA: 168h SLA (low priority: cosmetic issues)

**Ticket Workflow:**
- ABIERTO → EN_PROCESO → PENDIENTE_VALIDACION → RESUELTO → CERRADO
- 5% chance of RECHAZADO from ABIERTO
- Natural progression based on SLA age
- 30% of active tickets updated per interval
- Ticket format: AVM-YYYY-MMDD-#### (Avisos Madrid)

**Data Fields:**
- Location: Random Madrid district + address + coordinates
- Contact: 70% email, 60% phone (masked for privacy)
- SLA tracking: created_at, updated_at, resolved_at timestamps

## Environment Variables

The simulator container receives the following environment variables:

```bash
KAFKA_BOOTSTRAP_SERVERS      # Confluent Kafka bootstrap endpoint
KAFKA_SECURITY_PROTOCOL="SASL_SSL"
KAFKA_SASL_MECHANISM="PLAIN"
KAFKA_SASL_JAAS_CONFIG       # Kafka API credentials
SCHEMA_REGISTRY_URL          # Schema Registry endpoint
SCHEMA_REGISTRY_BASIC_AUTH_USER_INFO  # Schema Registry credentials
INTERVAL_SECONDS="5"         # Data generation interval
```

## Module Variables

See `variables.tf` for the complete list. Key inputs:

- `prefix` - Resource name prefix (default: "ls-demo")
- `cloud_region` - AWS region (default: "us-east-1")
- `cpu_architecture` - ECS task CPU arch (ARM64 or X86_64)
- Networking: `vpc_id`, `subnet_id`, `security_group_id`
- ECS: `ecs_cluster_id`, execution/container role ARNs
- Confluent: Kafka cluster ID, endpoints, API keys
- Schema Registry: cluster ID, endpoint, API keys

## Outputs

See `outputs.tf` for the complete list. Key outputs:

- Topic names: `smartcity_traffic_topic_name`, `smartcity_airquality_topic_name`, etc.
- Schema IDs: `smartcity_traffic_schema_id`, `smartcity_airquality_schema_id`, etc.
- Infrastructure: ECR URL, ECS service name, task ARN

## Usage

Deploy via the parent `demo-stacks.tf`:

```hcl
module "smartcity_stack" {
  count  = var.enable_smartcity_demo ? 1 : 0
  source = "./modules/smartcity_stack"

  # Configuration passed from root module
  prefix         = var.prefix
  vpc_id         = aws_vpc.ecs_vpc.id
  kafka_cluster_id = confluent_kafka_cluster.standard.id
  # ... other variables
}
```

Or deploy via the convenience script:

```bash
./deploy-smartcity-demo.sh
```

## Monitoring

**CloudWatch Logs:**
```bash
aws logs tail /ecs/smartcity-simulator-task-* --follow --region us-east-1
```

**Kafka Topic Consumption:**
```bash
# View traffic data
confluent kafka topic consume smartcity-traffic --from-beginning

# View air quality data
confluent kafka topic consume smartcity-airquality --from-beginning

# View EMT bus data
confluent kafka topic consume smartcity-emtbus --from-beginning

# View citizen services
confluent kafka topic consume smartcity-service --from-beginning
```

**ECS Service Status:**
```bash
aws ecs describe-services \
  --cluster <cluster-name> \
  --services smartcity-simulator-service \
  --region us-east-1
```

## Cleanup

Before destroying, stop Flink statements:

```bash
cd terraform
terraform apply -var="stop_flink_statements=true"
terraform destroy -var="enable_smartcity_demo=false"
```

## Related Modules

- `smartcity_flink_queries/` - 7 Flink SQL queries for processing the streams
- `retail_stack/` - E-commerce demo (retail analytics)
- `scada_stack/` - Energy grid demo (SCADA monitoring)

## License

Copyright Confluent Inc.
