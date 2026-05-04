# SCADA Flink SQL Queries

This directory contains Flink SQL queries for real-time processing of SCADA telemetry data from the USA energy grid simulation.

## Query Overview

### 01_scada_telemetry_stream.sql
**Purpose**: Clean and structure raw telemetry data  
**Input**: `scada-telemetry` Kafka topic  
**Output**: `scada_telemetry_stream` table  
**Window**: None (streaming)  
**Description**: Parses sensor readings, converts timestamps, and creates a structured stream for downstream processing.

### 02_anomaly_detection.sql
**Purpose**: Real-time anomaly detection and alert generation  
**Input**: `scada_telemetry_stream`  
**Output**: `scada_anomalies` table  
**Window**: None (event-based)  
**Description**: Detects values outside normal operating ranges and generates alerts with severity classification:
- **CRITICAL**: >20% outside normal range (VOLTAGE, FREQUENCY, PRESSURE)
- **WARNING**: 10-20% outside normal range (all measurement types)
- **INFO**: Minor deviations

**Alert Types**:
- `VOLTAGE_HIGH` / `VOLTAGE_LOW` (132-765 kV range)
- `FREQUENCY_DEVIATION` (59.95-60.05 Hz range, critical for grid stability)
- `OVERLOAD` (current >3000 A)
- `PRESSURE_DROP` (pressure <40 bar)
- `TEMPERATURE_HIGH` (temperature >25°C)
- `POWER_IMBALANCE` (active/reactive power anomalies)

### 03_zone_aggregations.sql
**Purpose**: Geographic zone-level statistics  
**Input**: `scada_telemetry_stream`  
**Output**: `scada_zone_stats` table  
**Window**: 5-minute tumbling windows  
**Description**: Aggregates sensor readings by geographic zone for dashboard visualization:
- Voltage statistics (avg, min, max)
- Current and frequency averages
- Total power generation per zone
- Gas network metrics (pressure, temperature)
- Anomaly counts per zone

### 04_grid_region_stats.sql
**Purpose**: Major grid interconnection region monitoring  
**Input**: `scada_telemetry_stream`  
**Output**: `scada_grid_region_stats` table  
**Window**: 10-minute tumbling windows  
**Description**: Monitors USA grid regions (ERCOT, WECC, EASTERN) for:
- Grid frequency stability (critical metric)
- Power balance (generation vs consumption)
- Grid stability score (0-100 based on frequency deviation from 60 Hz)
- Alert counts by severity

**Grid Regions**:
- **ERCOT**: Texas (isolated grid)
- **WECC**: Western USA
- **EASTERN**: Eastern USA
- **TEXAS**: Texas interconnection
- **QUEBEC**: Quebec (not in this demo but schema supports)

### 05_sensor_health.sql
**Purpose**: Sensor availability and health monitoring  
**Input**: `scada_telemetry_stream`  
**Output**: `scada_sensor_health` table  
**Window**: 1-minute tumbling windows  
**Description**: Monitors sensor health based on expected reading frequency:
- **HEALTHY**: ≥9 readings per minute (75%+)
- **WARNING**: 6-8 readings per minute (50-75%)
- **CRITICAL**: <6 readings per minute (<50%)
- **OFFLINE**: 0 readings

## Deployment Order

Execute queries in Confluent Cloud Flink in this order:

```bash
# 1. Base stream
flink sql -f 01_scada_telemetry_stream.sql

# 2. Anomaly detection (depends on #1)
flink sql -f 02_anomaly_detection.sql

# 3. Zone aggregations (depends on #1)
flink sql -f 03_zone_aggregations.sql

# 4. Grid region stats (depends on #1)
flink sql -f 04_grid_region_stats.sql

# 5. Sensor health (depends on #1)
flink sql -f 05_sensor_health.sql
```

## Monitoring Use Cases

### Real-time Operations Dashboard
- **Zone Stats**: Overall health by geographic zone
- **Grid Region Stats**: Frequency stability, power balance
- **Anomaly Detection**: Active alerts requiring attention

### Predictive Maintenance
- **Sensor Health**: Identify failing sensors before complete failure
- **Historical Anomalies**: Pattern analysis for equipment degradation

### Grid Stability Monitoring
- **Frequency Deviation**: Critical metric for grid stability (target: 60 Hz ±0.05 Hz)
- **Power Balance**: Generation vs consumption tracking
- **Regional Comparison**: ERCOT vs WECC vs EASTERN grid performance

## Expected Data Volumes

With 18 sensors generating data every 5 seconds:

- **Telemetry Stream**: ~3.6 messages/sec (~13,000/hour)
- **Anomalies**: ~0.36 messages/sec (~1,300/hour at 10% anomaly rate)
- **Zone Stats**: ~12 aggregates/5min (~144/hour for 6 zones)
- **Grid Region Stats**: ~3 aggregates/10min (~18/hour for 3 regions)
- **Sensor Health**: ~18 health records/min (~1,080/hour)

## Normal Operating Ranges

| Measurement Type | Min | Max | Unit | Critical For |
|-----------------|-----|-----|------|--------------|
| VOLTAGE | 132 | 765 | kV | Grid transmission |
| CURRENT | 100 | 3000 | A | Load management |
| FREQUENCY | 59.95 | 60.05 | Hz | Grid stability |
| POWER_ACTIVE | 50 | 500 | MW | Power balance |
| POWER_REACTIVE | 10 | 100 | MVAr | Voltage control |
| PRESSURE | 40 | 70 | bar | Gas network |
| FLOW | 1000 | 50000 | m³/h | Gas distribution |
| TEMPERATURE | 5 | 25 | °C | Equipment safety |

## Future Enhancements

- Time-series forecasting for demand prediction
- Correlation analysis between zones
- Machine learning anomaly detection (vs rule-based)
- Integration with weather data
- Historical trend analysis
