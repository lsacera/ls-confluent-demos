# SCADA Streaming Analytics Dashboard

Real-time grid monitoring dashboard for the SCADA demo, visualizing sensor telemetry data streaming through Confluent Cloud (Kafka + Flink) to PostgreSQL.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [SCADA Data Tables](#scada-data-tables)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)

## Architecture

```
SCADA Simulator ──> Kafka (scada-telemetry) ──> Flink SQL (5 queries) ──> PostgreSQL ──> Dashboard
                                                                              (4 tables)     (Web UI)
```

## Features

### 6 Interactive Views

1. **Overview Dashboard** - Real-time KPIs: total anomalies, critical alerts, grid stability, offline sensors
2. **Anomalies View** - Alert management with severity filters and detailed table
3. **Grid Health** - Status of 3 grid regions (ERCOT, WECC, EASTERN) with stability scores
4. **Sensor Health** - Sensor status monitoring and failing sensor alerts
5. **Geographic View** - USA map with sensor distribution and state health statistics
6. **Architecture Flow** - Live data pipeline visualization with activity monitor

### SCADA Data Sources (PostgreSQL Tables)

1. **scada_anomalies** - Sensor alerts with threshold violations
   - Fields: sensor_id, timestamp, alert_type, severity, measured_value, threshold_value, lat/lon, zone_id, state, grid_region

2. **scada_zone_stats** - 5-minute zone aggregations
   - Fields: window_start/end, zone_id, sensor_count, voltage/current/frequency metrics, power, anomaly_count

3. **scada_grid_region_stats** - 10-minute grid region statistics
   - Fields: window_start/end, grid_region, avg_frequency, grid_stability_score, total_power_mw, alerts

4. **scada_sensor_health** - 1-minute sensor health monitoring
   - Fields: window_start/end, sensor_id, reading_count, status, consecutive_failures, last_reading_time

## Prerequisites

### For Local Development
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL RDS instance (created by Terraform)
- SCADA simulator running
- Flink queries active and PostgreSQL sink connector configured

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Navigate to the project**
   ```bash
   cd scada-web-dashboard
   ```

2. **Configure environment variables**

   **Automated setup**:
   ```bash
   ./setup-env.sh
   ```

   **Manual setup**:
   ```bash
   cp .env.example .env
   nano .env  # Edit with your PostgreSQL credentials
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the dashboard**
   - Open http://localhost:5173 in your browser

5. **Stop the application**
   ```bash
   docker-compose down
   ```

### Option 2: Local Development

1. **Setup environment**
   ```bash
   ./setup-env.sh
   ```

2. **Backend** (Terminal 1)
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Backend runs on http://localhost:3000

3. **Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on http://localhost:5173

## SCADA Data Tables

All tables are created automatically by Flink SQL and PostgreSQL Sink connectors.

### Table Refresh Rates
- **scada_anomalies**: Real-time (as anomalies occur)
- **scada_zone_stats**: Every 5 minutes (tumbling window)
- **scada_grid_region_stats**: Every 10 minutes (tumbling window)
- **scada_sensor_health**: Every 1 minute (tumbling window)

### Verify Tables Exist

```bash
psql -h <POSTGRES_HOST> -U postgres -d onlinestoredb

# Inside psql:
\dt scada*

# Check row counts:
SELECT 'scada_anomalies' as table_name, COUNT(*) FROM scada_anomalies
UNION ALL
SELECT 'scada_zone_stats', COUNT(*) FROM scada_zone_stats
UNION ALL
SELECT 'scada_grid_region_stats', COUNT(*) FROM scada_grid_region_stats
UNION ALL
SELECT 'scada_sensor_health', COUNT(*) FROM scada_sensor_health;
```

## API Endpoints

### Overview
- `GET /api/overview/kpis` - Main KPIs (anomalies, critical alerts, grid stability, offline sensors)
- `GET /api/overview/hourly-anomalies` - Anomalies per hour (last 24h)
- `GET /api/overview/grid-health` - Current health of all grid regions

### Anomalies
- `GET /api/anomalies/recent?limit=100&offset=0` - Recent alerts with pagination
- `GET /api/anomalies/by-severity` - Count by severity (CRITICAL/WARNING/INFO)
- `GET /api/anomalies/by-type` - Count by alert type

### Grid
- `GET /api/grid/regions` - Stats for ERCOT, WECC, EASTERN (latest window)
- `GET /api/grid/stability-trend` - Grid stability over time (last 24h)
- `GET /api/grid/power-balance` - Power balance by region

### Sensors
- `GET /api/sensors/health-summary` - Count by status (OFFLINE/CRITICAL/WARNING/HEALTHY)
- `GET /api/sensors/failing?limit=50` - Sensors with status != HEALTHY
- `GET /api/sensors/by-zone` - Health grouped by zone_id

### Geographic
- `GET /api/geographic/sensors` - All sensors with latest coordinates and status
- `GET /api/geographic/anomalies-map?hours=1` - Recent anomalies with lat/lon for map

### Architecture
- `GET /api/architecture/stats` - Row counts from all SCADA tables (last 24h)
- `GET /api/architecture/activity` - Recent anomaly activity (last 5 minutes)

## Tech Stack

### Backend
- Node.js + Express
- pg - PostgreSQL client
- node-cache - Response caching (5s TTL)
- CORS enabled for local development

### Frontend
- React 18
- Vite - Build tool
- Tailwind CSS - Styling
- Recharts - Charts library
- Lucide React - Icons
- React Router - Navigation
- Axios - HTTP client
- react-simple-maps - USA map visualization

## Troubleshooting

### No Data in Dashboard

1. **Check backend is running**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Verify SCADA tables exist and have data**
   ```bash
   ./check-data.sh
   ```

3. **Check SCADA simulator is running**
   - Verify in ECS console or check logs
   - Should be generating telemetry to `scada-telemetry` topic

4. **Verify Flink queries are RUNNING**
   - Login to Confluent Cloud
   - Check all 5 Flink statements are active

5. **Check PostgreSQL sink connector**
   - Verify connector is RUNNING in Confluent Cloud
   - Check it's writing to correct database

### Backend Connection Errors

1. **Check .env file exists**
   ```bash
   cat .env | grep POSTGRES_HOST
   ```

2. **Test PostgreSQL connection**
   ```bash
   psql -h $POSTGRES_HOST -U postgres -d onlinestoredb -c "SELECT 1"
   ```

3. **Check security groups**
   - RDS security group should allow connections from your IP
   - For local development, may need to add your IP to inbound rules

### Frontend Shows "No data available"

1. **Check API is accessible**
   ```bash
   curl http://localhost:3000/api/overview/kpis
   ```

2. **Check browser console** for API errors

3. **Verify auto-refresh is enabled** in the dashboard header

### Performance Issues

1. **Increase cache TTL**
   ```bash
   # In .env
   CACHE_TTL=30  # Increase from 5 to 30 seconds
   ```

2. **Check table sizes**
   ```sql
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE tablename LIKE 'scada%'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

3. **Consider adding indexes** if queries are slow
   ```sql
   CREATE INDEX idx_anomalies_timestamp ON scada_anomalies(timestamp);
   CREATE INDEX idx_sensor_health_window ON scada_sensor_health(window_start, sensor_id);
   ```

## Project Structure

```
scada-web-dashboard/
├── backend/
│   ├── config/
│   │   └── postgres.js          # PostgreSQL connection
│   ├── routes/
│   │   ├── overview.js          # Overview KPIs & trends
│   │   ├── anomalies.js         # Anomaly management
│   │   ├── grid.js              # Grid region statistics
│   │   ├── sensors.js           # Sensor health monitoring
│   │   ├── geographic.js        # Geographic data
│   │   └── architecture.js      # Architecture stats
│   ├── server.js                # Express app
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── views/           # Dashboard views
│   │   │   ├── shared/          # Reusable components
│   │   │   └── Layout.jsx       # App layout
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   ├── utils/
│   │   │   ├── formatters.js    # Data formatting
│   │   │   └── hooks.js         # Custom React hooks
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .env.example                 # Environment template
├── Dockerfile                   # Multi-stage Docker build
├── nginx-combined.conf          # Nginx reverse proxy config
├── supervisord.conf             # Process manager config
├── entrypoint.sh               # Container startup script
├── setup-env.sh                # Environment setup script
├── check-data.sh               # Diagnostics script
└── README.md                   # This file
```

## Additional Features

### Auto-Refresh
- Dashboard auto-refreshes every 5-10 seconds
- Can be toggled on/off in the header
- Manual refresh button available

### Error Handling
- All API endpoints return graceful defaults on error
- Tables check for existence before querying
- Frontend shows loading states and error messages

### Caching
- API responses cached for 5 seconds (configurable)
- Reduces database load
- Improves dashboard responsiveness

## Grid Regions

The dashboard monitors 3 major US power grids:

1. **ERCOT** - Electric Reliability Council of Texas
2. **WECC** - Western Electricity Coordinating Council  
3. **EASTERN** - Eastern Interconnection

Each region has independent monitoring of:
- Grid stability score (0-100, where 100 = perfect)
- Power generation (MW)
- Frequency stability
- Alert counts

## License

Part of the SCADA streaming demo project.
