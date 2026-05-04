# Smart City Madrid - Flink SQL Queries

This directory contains **7 Flink SQL queries** that process real-time data streams from Madrid's urban monitoring systems: traffic sensors, air quality stations, EMT buses, and citizen service requests.

## Query Overview

| # | Query | Description | Window | Output |
|---|-------|-------------|--------|--------|
| 01 | **traffic_stream** | Traffic sensor stream with watermarks | - | `smartcity_traffic_stream` |
| 02 | **airquality_stream** | Air quality monitoring stream | - | `smartcity_airquality_stream` |
| 03 | **traffic_congestion_alerts** | Real-time congestion detection | - | `smartcity_traffic_alerts` |
| 04 | **district_aggregations** | District-level metrics (traffic + air) | 5 min | `smartcity_district_stats` |
| 05 | **emt_bus_performance** | Bus line performance tracking | 5 min | `smartcity_emt_performance` |
| 06 | **citizen_services_sla** | Service request SLA monitoring | 1 hour | `smartcity_services_sla` |
| 07 | **city_health_score** | Overall city health dashboard | 10 min | `smartcity_health_dashboard` |

## Data Pipeline

```
┌─────────────────────┐
│  Kafka Topics       │
│  (Avro + SR)        │
└──────┬──────────────┘
       │
       ├─► smartcity-traffic ──────► [01] Traffic Stream ──┬──► [03] Congestion Alerts
       │                                                      │
       ├─► smartcity-airquality ───► [02] Air Quality ──────┼──► [04] District Aggregations (5min)
       │                                                      │
       ├─► smartcity-emtbus ────────────────────────────────┼──► [05] EMT Performance (5min)
       │                                                      │
       └─► smartcity-service ───────────────────────────────┼──► [06] Services SLA (1hr)
                                                              │
                                                              └──► [07] City Health Score (10min)
                                                                      ├─ Traffic Fluidity (30%)
                                                                      ├─ Air Quality (30%)
                                                                      ├─ EMT Reliability (20%)
                                                                      └─ Citizen Service (20%)
```

## Query Details

### 01. Traffic Stream (`smartcity_traffic_stream`)
- **Input**: `smartcity-traffic` topic
- **Processing**: Clean stream with watermarks (10s late arrivals)
- **Fields**: sensor_id, district, location_name, location_type, vehicle_count, avg_speed, occupancy_pct, traffic_status
- **Purpose**: Base stream for downstream traffic analytics

### 02. Air Quality Stream (`smartcity_airquality_stream`)
- **Input**: `smartcity-airquality` topic
- **Processing**: Structured view of pollution measurements
- **Fields**: station_id, district, NO2, PM2.5, PM10, O3, CO, AQI, quality_level
- **Purpose**: Environmental monitoring base stream

### 03. Traffic Congestion Alerts (`smartcity_traffic_alerts`)
- **Input**: `smartcity_traffic_stream`
- **Detection Logic**:
  - **CRITICAL**: BLOCKED status OR speed < 5 km/h + occupancy > 95%
  - **HIGH**: CONGESTED status OR speed < 15 km/h + occupancy > 85%
  - **MEDIUM**: MODERATE status OR speed < 30 km/h + occupancy > 70%
- **Alert Types**: TRAFFIC_BLOCKED, HEAVY_CONGESTION, MODERATE_CONGESTION, SENSOR_OFFLINE
- **Output**: Alerts with severity, message, location details

### 04. District Aggregations (`smartcity_district_stats`)
- **Input**: Traffic + Air Quality streams (FULL OUTER JOIN)
- **Window**: 5-minute tumbling windows
- **Metrics**:
  - Traffic: avg_speed, avg_occupancy, total_vehicles, congested_sensors
  - Air Quality: avg_aqi, avg_no2, avg_pm25, unhealthy_air_stations
- **Purpose**: District-level dashboards showing combined urban health

### 05. EMT Bus Performance (`smartcity_emt_performance`)
- **Input**: `smartcity-emtbus` topic
- **Window**: 5-minute tumbling windows
- **Metrics per Line**:
  - Delays: avg_delay_minutes, buses_delayed, buses_on_time
  - Capacity: avg_occupancy_pct, overcrowded_buses (>90%)
  - Status: buses_in_service, buses_at_stop, buses_out_of_service
- **Purpose**: Public transport reliability monitoring

### 06. Citizen Services SLA (`smartcity_services_sla`)
- **Input**: `smartcity-service` topic
- **Window**: 1-hour tumbling windows
- **Grouping**: By category (ALUMBRADO_PUBLICO, LIMPIEZA_BASURA, etc.) + priority (URGENTE, ALTA, MEDIA, BAJA)
- **Metrics**:
  - Status breakdown: open, in_progress, resolved, closed, rejected
  - SLA compliance: tickets_within_sla, tickets_overdue
- **Purpose**: Track 311-style service request resolution

### 07. City Health Score (`smartcity_health_dashboard`)
- **Input**: All 4 streams (Traffic, Air Quality, EMT, Services) - FULL OUTER JOIN
- **Window**: 10-minute tumbling windows
- **Scoring Formula** (0-100 scale):
  - **Traffic Fluidity Score**: `(avg_speed / 50) * 100` (optimal at 50 km/h)
  - **Air Quality Score**: `100 - (avg_aqi / 2)` (0 at AQI=200+)
  - **EMT Reliability Score**: `100 - (|avg_delay| * 10)`
  - **Citizen Service Score**: `resolution_rate * 100`
  - **Overall Health Score**: Weighted average (30% + 30% + 20% + 20%)
- **Health Status**:
  - EXCELLENT: score ≥ 80
  - GOOD: score ≥ 60
  - MODERATE: score ≥ 40
  - POOR: score < 40
- **Purpose**: Single KPI for overall city operational health

## Deployment

These queries are deployed via Terraform module `modules/smartcity_flink_queries/`:

```hcl
module "smartcity_flink_queries" {
  source     = "./modules/smartcity_flink_queries"
  count      = var.enable_smartcity_demo ? 1 : 0
  
  queries_dir          = "${path.module}/../queries/smartcity"
  catalog_name         = confluent_flink_compute_pool.main.catalog_name
  database_name        = "public"
  stop_flink_statements = var.stop_flink_statements
}
```

## Execution Order

Queries must run in numbered order due to dependencies:
1. **01** → Base traffic stream
2. **02** → Base air quality stream
3. **03** → Uses traffic stream
4. **04** → Uses traffic + air quality streams
5. **05** → Independent (EMT buses)
6. **06** → Independent (Citizen services)
7. **07** → Uses all streams

## Data Sources

### Traffic Sensors (17 sensors)
- M-30 ring road: 5 sensors
- Main avenues: 4 sensors (Gran Vía, Castellana, Alcalá, Prado)
- Highway access: 3 sensors (A-1, M-40, A-4)
- Intersections: 3 sensors
- Downtown: 2 sensors

### Air Quality Stations (12 stations)
- Urban core: 4 stations (Centro, Salamanca, Chamberi)
- Mid-level: 3 stations
- Parks: 3 stations (Retiro, Casa de Campo, El Pardo)
- Peripheral: 2 stations

### EMT Buses (11 buses)
- Lines: 1, 3, 6, 27, 74, 146, N21
- Vehicle types: Standard, Articulated, Electric, Hybrid

### Citizen Services
- Categories: ALUMBRADO_PUBLICO, LIMPIEZA_BASURA, BACHES_PAVIMENTO, PARQUES_JARDINES, MOBILIARIO_URBANO, OTROS
- Priorities: URGENTE (4h SLA), ALTA (24h), MEDIA (72h), BAJA (168h)

## Expected Dashboard Metrics

From these queries, the Smart City dashboard can show:
- Real-time traffic map with congestion alerts
- Air quality heat map by district
- EMT bus line performance (delays, occupancy)
- Citizen service request backlog and SLA compliance
- Overall city health score trend (10-min resolution)
- District comparisons (traffic vs air quality correlation)

## Notes

- All queries use watermarks with 10-second late arrival tolerance
- Enums (MadridDistrict, TrafficStatus, etc.) are CAST to STRING for flexibility
- FULL OUTER JOIN ensures metrics are calculated even when one stream has no data
- Time windows align for efficient joins (5min, 10min, 1hr)
- Primary keys are NOT ENFORCED (standard Flink pattern for Kafka-backed tables)
