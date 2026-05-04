# Dashboard Setup Guide - PostgreSQL Version

Este dashboard lee datos directamente desde PostgreSQL (RDS) donde el conector Flink sink escribe las tablas materializadas.

## Arquitectura

```
PostgreSQL (Source) ──> Flink ──> PostgreSQL Sink ──> Dashboard
                         ↓
                    Kafka Topics
```

## Requisitos Previos

1. ✅ Terraform aplicado correctamente
2. ✅ Conector PostgreSQL Sink activo para `thirty_day_customer_snapshot`
3. ✅ Las siguientes tablas existen en PostgreSQL:
   - `product_sales` (desde Flink query)
   - `completed_orders` (desde Flink query)
   - `thirty_day_customer_snapshot` (desde Flink query + PostgreSQL sink)

## Paso 1: Obtener credenciales de PostgreSQL

Ejecuta este comando para obtener el endpoint de RDS:

```bash
cd terraform
terraform output resource-ids
```

Busca la línea **RDS Endpoint** y copia el valor. Por ejemplo:
```
RDS Endpoint: ls-retail-onlinestoredb.xxxxx.us-east-1.rds.amazonaws.com:5432
```

## Paso 2: Configurar el Dashboard

1. **Navega al directorio del dashboard**:
```bash
cd retail-web-dashboard
```

2. **Crea el archivo `.env`**:
```bash
cp .env.example .env
```

3. **Edita `.env` con tus credenciales**:
```env
# PostgreSQL Configuration (from terraform output)
POSTGRES_HOST=ls-retail-onlinestoredb.xxxxx.us-east-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Admin123456!!
POSTGRES_DATABASE=onlinestoredb
POSTGRES_SSL=false
```

**Nota**: Si cambiaste las credenciales en `terraform.tfvars`, usa esos valores aquí.

## Paso 3: Verificar las tablas en PostgreSQL

Antes de lanzar el dashboard, verifica que las tablas existan:

```bash
psql -h <POSTGRES_HOST> -U postgres -d onlinestoredb -c "\dt"
```

Deberías ver:
- `product_sales` (auto-creada por Flink sink si configuraste auto.create=true)
- `completed_orders` (auto-creada por Flink sink si configuraste auto.create=true)
- `thirty_day_customer_snapshot` (creada por el conector PostgreSQL sink)

## Paso 4: Lanzar el Dashboard

### Opción A: Docker Compose (Recomendado)

```bash
docker-compose up -d
```

**Accede al dashboard**: http://localhost:5173

**Ver logs**:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Detener**:
```bash
docker-compose down
```

### Opción B: Desarrollo Local

**Terminal 1 - Backend**:
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Accede al dashboard**: http://localhost:5173

## Paso 5: Navegar por el Dashboard

El dashboard tiene 5 vistas:

1. **Architecture Flow** (inicio) - Muestra el flujo de datos en tiempo real
2. **Overview** - KPIs principales y tendencias horarias
3. **Product Analytics** - Top productos y marcas
4. **Customer 360** - Análisis de clientes (usa `thirty_day_customer_snapshot`)
5. **Geographic View** - Ventas por estado

## Troubleshooting

### Backend no conecta a PostgreSQL

**Problema**: `Error: connect ECONNREFUSED`

**Solución**:
- Verifica que el security group de RDS permite conexiones desde tu IP
- Comprueba que `POSTGRES_HOST` en `.env` sea correcto
- Verifica que RDS esté en estado "available"

```bash
# Test connection
psql -h <POSTGRES_HOST> -U postgres -d onlinestoredb -c "SELECT 1"
```

### Tablas no existen

**Problema**: `ERROR: relation "thirty_day_customer_snapshot" does not exist`

**Solución**:
- Verifica que el conector PostgreSQL sink esté activo en Confluent Cloud
- Comprueba que la query de Flink esté ejecutándose (estado: RUNNING)
- Espera unos minutos para que el sink cree las tablas

```bash
# Verificar tablas en PostgreSQL
psql -h <POSTGRES_HOST> -U postgres -d onlinestoredb -c "\dt"
```

### Dashboard muestra "No data"

**Problema**: Las queries devuelven 0 registros

**Solución**:
- Verifica que el data generator (ECS service) esté enviando datos
- Comprueba que Flink queries tengan datos:

```sql
SELECT COUNT(*) FROM product_sales;
SELECT COUNT(*) FROM completed_orders;
SELECT COUNT(*) FROM thirty_day_customer_snapshot;
```

### Error de SSL/TLS

**Problema**: `Error: SSL connection required`

**Solución**:
Cambia `POSTGRES_SSL=true` en `.env`

## Verificación de Salud

### 1. Backend Health Check
```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{"status":"ok","timestamp":"2026-03-19T18:30:00.000Z"}
```

### 2. Test API Endpoints
```bash
# Overview KPIs
curl http://localhost:3000/api/overview/kpis

# Top customers (usa thirty_day_customer_snapshot)
curl http://localhost:3000/api/customers/top

# Architecture stats
curl http://localhost:3000/api/architecture/stats
```

### 3. Verificar auto-refresh

El dashboard se actualiza automáticamente cada 5-10 segundos. Observa la vista "Architecture Flow" para ver actividad en tiempo real.

## Configuración Avanzada

### Ajustar Cache TTL

Para cambiar la duración del cache (por defecto 5 segundos):

```env
CACHE_TTL=10  # Cache por 10 segundos
```

### Cambiar puerto del backend

```env
PORT=4000
```

Y actualiza `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000/api
```

## Limpieza

```bash
# Detener contenedores
docker-compose down

# Eliminar volúmenes
docker-compose down -v

# Eliminar imágenes
docker rmi retail-web-dashboard-backend retail-web-dashboard-frontend
```

## Próximos Pasos

- Personalizar queries en `backend/routes/`
- Añadir más visualizaciones en `frontend/src/components/views/`
- Configurar alertas basadas en KPIs
- Exportar datos para análisis offline
