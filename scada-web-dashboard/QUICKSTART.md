# SCADA Dashboard Quick Start

## 1. Setup (First Time)

```bash
cd scada-web-dashboard
./setup-env.sh
```

This will:
- Create `.env` from `.env.example`
- Auto-detect RDS endpoint from Terraform
- Guide you through configuration

## 2. Start the Dashboard

### Option A: Docker Compose (Recommended)
```bash
docker-compose up -d
```
Access: http://localhost:5173

### Option B: Local Development
Terminal 1 (Backend):
```bash
cd backend
npm install
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
```
Access: http://localhost:5173

## 3. Verify Data

```bash
./check-data.sh
```

This checks:
- Backend is running
- APIs are responding
- PostgreSQL tables exist

## 4. View the Dashboard

Open http://localhost:5173 in your browser

### Navigation
- **Overview** - Main KPIs and grid health summary
- **Anomalies** - Alert management with filters
- **Grid Health** - ERCOT, WECC, EASTERN region status
- **Sensor Health** - Sensor monitoring and failing sensors
- **Geographic** - USA map with sensor distribution
- **Architecture** - Data pipeline visualization

## 5. Troubleshooting

### No data showing?
```bash
# Check if SCADA simulator is running
# Check Flink queries are RUNNING
# Verify PostgreSQL tables:
psql -h $POSTGRES_HOST -U postgres -d onlinestoredb -c "\dt scada*"
```

### Backend not connecting?
```bash
# Verify .env file
cat .env | grep POSTGRES_HOST

# Test PostgreSQL connection
psql -h $POSTGRES_HOST -U postgres -d onlinestoredb -c "SELECT 1"
```

### Frontend errors?
```bash
# Check backend is running
curl http://localhost:3000/health

# Check API
curl http://localhost:3000/api/overview/kpis
```

## SCADA Tables Required

The dashboard expects these 4 tables in PostgreSQL:
1. `scada_anomalies` - Alert data
2. `scada_zone_stats` - Zone aggregations (5-min)
3. `scada_grid_region_stats` - Grid stats (10-min)
4. `scada_sensor_health` - Sensor health (1-min)

These are created automatically by Flink SQL and PostgreSQL Sink connectors.

## Quick Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up --build

# Check diagnostics
./check-data.sh
```

## Environment Variables

Key variables in `.env`:
```
POSTGRES_HOST=your-rds-endpoint.us-east-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Admin123456!!
POSTGRES_DATABASE=onlinestoredb
```

## Grid Regions

The dashboard monitors 3 US power grids:
- **ERCOT** - Texas
- **WECC** - Western US
- **EASTERN** - Eastern US

## Key Metrics

- **Grid Stability Score**: 0-100 (100 = perfect)
- **Anomaly Severity**: CRITICAL, WARNING, INFO
- **Sensor Status**: OFFLINE, CRITICAL, WARNING, HEALTHY

## Auto-Refresh

Dashboard auto-refreshes every 5-10 seconds. Toggle in header to disable.

## Need Help?

See `README.md` for comprehensive documentation.
