# SCADA Stack Module (Placeholder)

This is a placeholder module for the future SCADA energy grid demo.

## Planned Implementation

### Overview
The SCADA (Supervisory Control and Data Acquisition) stack will simulate an energy distribution network similar to those operated by companies like Naturgy, demonstrating real-time monitoring and analytics capabilities.

### Planned Components

#### 1. SCADA Simulator Application
- **Language**: Java (consistency with existing apps) or Python (rapid prototyping)
- **Functionality**:
  - Generate synthetic telemetry data from 50-100 virtual sensors
  - Simulate realistic patterns (daily/seasonal demand curves)
  - Inject anomalies and fault scenarios
  - Geographic distribution across regions

#### 2. Data Types

**Electrical Grid Measurements**:
- Voltage (kV): 132, 220, 400 kV levels
- Current (A): Load measurements
- Frequency (Hz): Grid stability (target ~50 Hz in Europe)
- Power (MW/MVAr): Active and reactive power
- Power factor

**Gas Network Measurements**:
- Pressure (bar): 4-70 bar in transmission networks
- Flow rate (m³/h): 1,000 - 50,000 per station
- Temperature (°C): 5-25°C typical range
- Valve status: Open/Closed/Partial

**Events and Alerts**:
- Overload conditions
- Pressure drops
- Equipment failures
- Protection activations

#### 3. Kafka Topics
- `scada-telemetry`: Raw sensor readings (2-10 second intervals)
- `scada-alerts`: Real-time anomaly alerts
- `scada-aggregated`: Pre-aggregated metrics by zone/hour

#### 4. Flink Stream Processing
- Real-time aggregation by geographic zone
- Anomaly detection (>5% deviation from expected)
- Power balance calculations (generation vs consumption)
- Alert correlation and de-duplication
- Quality of service metrics (SAIDI, SAIFI)

#### 5. PostgreSQL Tables
```sql
-- Time-series sensor readings
CREATE TABLE scada_readings (
  reading_id BIGSERIAL PRIMARY KEY,
  sensor_id VARCHAR(50),
  timestamp TIMESTAMPTZ,
  measurement_type VARCHAR(50),
  value DECIMAL(12,4),
  unit VARCHAR(20),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  zone_id VARCHAR(50),
  status VARCHAR(20)
);

-- Alert tracking
CREATE TABLE scada_alerts (
  alert_id BIGSERIAL PRIMARY KEY,
  sensor_id VARCHAR(50),
  severity VARCHAR(20),
  alert_type VARCHAR(50),
  message TEXT,
  timestamp TIMESTAMPTZ,
  resolved BOOLEAN,
  resolved_at TIMESTAMPTZ
);

-- Aggregated zone statistics
CREATE TABLE network_zones_stats (
  zone_id VARCHAR(50) PRIMARY KEY,
  zone_name VARCHAR(100),
  total_sensors INTEGER,
  avg_voltage DECIMAL(10,2),
  avg_current DECIMAL(10,2),
  total_power_mw DECIMAL(12,2),
  alert_count INTEGER,
  last_updated TIMESTAMPTZ
);

-- Hourly power balance
CREATE TABLE power_balance_hourly (
  timestamp TIMESTAMPTZ PRIMARY KEY,
  total_generation_mw DECIMAL(12,2),
  total_consumption_mw DECIMAL(12,2),
  balance_mw DECIMAL(12,2),
  frequency_avg_hz DECIMAL(6,3)
);
```

#### 6. Dashboard Visualizations
- **Network Map**: Interactive map showing sensor locations with color-coded status
- **Real-time Metrics**: Demand curves, frequency stability, voltage levels
- **Alert Dashboard**: Active alerts with severity filtering and acknowledgment
- **Zone Comparison**: Performance metrics across different regions
- **Predictive Analytics**: ML-based demand forecasting

### Integration Points
- Shares Confluent Cloud infrastructure (Kafka, Schema Registry, Flink)
- Shares AWS infrastructure (VPC, RDS, ECS)
- Separate topics, schemas, and database tables from retail demo
- Dashboard can show both demos or individually

### Complexity Estimates
- **Development Time**: 30-40% more than retail demo
- **Message Rate**: ~10 messages/second (100 sensors × 10s interval)
- **Data Volume**: Medium (time-series data with geographic coordinates)
- **Query Complexity**: Higher (anomaly detection, aggregations, correlations)

## Current Status
**Status**: Placeholder created, ready for implementation
**Next Steps**: 
1. Design detailed Avro schemas for telemetry data
2. Implement SCADA simulator application
3. Create Flink SQL queries for stream processing
4. Build dashboard components for energy grid visualization

## Usage (When Implemented)
```hcl
module "scada_stack" {
  count  = var.enable_scada_demo ? 1 : 0
  source = "./modules/scada_stack"

  # Same variables as retail_stack
  # ...
}
```
