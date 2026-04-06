#!/bin/bash
# Script to diagnose SCADA dashboard data issues

echo "======================================"
echo "   SCADA DASHBOARD DIAGNOSTICS"
echo "======================================"
echo ""

# 1. Verify .env
echo "1️⃣  Verifying .env configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "   POSTGRES_HOST=$(grep POSTGRES_HOST .env | cut -d'=' -f2)"
    echo "   POSTGRES_PORT=$(grep POSTGRES_PORT .env | cut -d'=' -f2)"
    echo "   POSTGRES_DATABASE=$(grep POSTGRES_DATABASE .env | cut -d'=' -f2)"
else
    echo "❌ .env file NOT found!"
    exit 1
fi
echo ""

# 2. Test backend connection
echo "2️⃣  Verifying backend..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
    curl -s http://localhost:3000/health | jq '.'
else
    echo "❌ Backend NOT running"
    echo "   Run: cd backend && npm run dev"
    exit 1
fi
echo ""

# 3. Test APIs
echo "3️⃣  Testing APIs..."
echo "GET /api/overview/kpis"
KPIS=$(curl -s http://localhost:3000/api/overview/kpis)
ANOMALIES=$(echo $KPIS | jq '.total_anomalies_24h' 2>/dev/null || echo "error")
if [ "$ANOMALIES" = "error" ]; then
    echo "❌ API error"
    echo "   Response: $KPIS"
else
    echo "✅ API returns data: $ANOMALIES anomalies"
fi
echo ""

# 4. Get RDS endpoint
echo "4️⃣  Getting RDS endpoint..."
cd ../terraform 2>/dev/null
if [ -f "terraform.tfstate" ]; then
    ENDPOINT=$(terraform output -json 2>/dev/null | jq -r '."resource-ids".value' | grep "RDS Endpoint" | cut -d':' -f1 | awk '{print $3}')
    if [ ! -z "$ENDPOINT" ]; then
        echo "✅ RDS Endpoint: $ENDPOINT"
    else
        echo "⚠️  Could not get endpoint automatically"
        echo "   Run manually: terraform output resource-ids"
    fi
else
    echo "⚠️  terraform.tfstate not found"
fi
cd ../scada-web-dashboard
echo ""

# 5. Instructions for PostgreSQL verification
echo "5️⃣  Verify SCADA tables in PostgreSQL manually:"
echo ""
echo "psql -h <ENDPOINT> -U postgres -d onlinestoredb"
echo ""
echo "Then run in psql:"
echo "  \\dt"
echo "  SELECT COUNT(*) FROM scada_anomalies;"
echo "  SELECT COUNT(*) FROM scada_zone_stats;"
echo "  SELECT COUNT(*) FROM scada_grid_region_stats;"
echo "  SELECT COUNT(*) FROM scada_sensor_health;"
echo ""
echo "======================================"
echo "If tables are empty, verify:"
echo "  1. SCADA Simulator is running"
echo "  2. Flink Statements are RUNNING"
echo "  3. PostgreSQL Sink Connector is RUNNING"
echo "======================================"
