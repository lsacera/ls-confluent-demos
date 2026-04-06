#!/bin/bash
# Script para diagnosticar por qué el dashboard está vacío

echo "======================================"
echo "   DIAGNÓSTICO DEL DASHBOARD"
echo "======================================"
echo ""

# 1. Verificar .env
echo "1️⃣  Verificando configuración .env..."
if [ -f ".env" ]; then
    echo "✅ Archivo .env existe"
    echo "   POSTGRES_HOST=$(grep POSTGRES_HOST .env | cut -d'=' -f2)"
    echo "   POSTGRES_PORT=$(grep POSTGRES_PORT .env | cut -d'=' -f2)"
    echo "   POSTGRES_DATABASE=$(grep POSTGRES_DATABASE .env | cut -d'=' -f2)"
else
    echo "❌ Archivo .env NO existe!"
    exit 1
fi
echo ""

# 2. Test de conexión al backend
echo "2️⃣  Verificando backend..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend está corriendo"
    curl -s http://localhost:3000/health | jq '.'
else
    echo "❌ Backend NO está corriendo"
    echo "   Ejecuta: cd backend && npm run dev"
    exit 1
fi
echo ""

# 3. Test de APIs
echo "3️⃣  Probando APIs..."
echo "GET /api/customers/top"
CUSTOMERS=$(curl -s http://localhost:3000/api/customers/top)
COUNT=$(echo $CUSTOMERS | jq 'length' 2>/dev/null || echo "error")
if [ "$COUNT" = "error" ] || [ "$COUNT" = "0" ]; then
    echo "❌ API no devuelve datos"
    echo "   Respuesta: $CUSTOMERS"
else
    echo "✅ API devuelve $COUNT clientes"
fi
echo ""

# 4. Obtener endpoint de RDS
echo "4️⃣  Obteniendo endpoint de RDS..."
cd ../terraform 2>/dev/null
if [ -f "terraform.tfstate" ]; then
    ENDPOINT=$(terraform output -json 2>/dev/null | jq -r '."resource-ids".value' | grep "RDS Endpoint" | cut -d':' -f1 | awk '{print $3}')
    if [ ! -z "$ENDPOINT" ]; then
        echo "✅ RDS Endpoint: $ENDPOINT"
    else
        echo "⚠️  No se pudo obtener el endpoint automáticamente"
        echo "   Ejecútalo manualmente: terraform output resource-ids"
    fi
else
    echo "⚠️  No se encontró terraform.tfstate"
fi
cd ../retail-web-dashboard
echo ""

# 5. Instrucciones para verificar PostgreSQL
echo "5️⃣  Verifica las tablas en PostgreSQL manualmente:"
echo ""
echo "psql -h <ENDPOINT> -U postgres -d onlinestoredb"
echo ""
echo "Luego ejecuta dentro de psql:"
echo "  \\dt"
echo "  SELECT COUNT(*) FROM product_sales;"
echo "  SELECT COUNT(*) FROM completed_orders;"
echo "  SELECT COUNT(*) FROM thirty_day_customer_snapshot;"
echo ""
echo "======================================"
echo "Si las tablas están vacías, verifica:"
echo "  1. CDC Connector está RUNNING en Confluent Cloud"
echo "  2. Flink Statements están RUNNING"
echo "  3. PostgreSQL Sink Connector está RUNNING"
echo "======================================"
