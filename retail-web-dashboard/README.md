# Retail Streaming Analytics Dashboard

Real-time analytics dashboard for the online retailer demo, visualizing data streaming from PostgreSQL through Confluent Cloud (Kafka + Flink) back to PostgreSQL.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [Option 1: Docker Compose (Local)](#option-1-docker-compose-recommended)
  - [Option 2: Local Development (Node.js)](#option-2-local-development)
  - [Option 3: AWS Production Deployment](#option-3-aws-production-deployment)
- [Getting PostgreSQL Credentials](#getting-postgresql-credentials)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)
- [Deployment Comparison](#deployment-comparison)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Adding New Tables from Flink](#adding-new-tables-from-flink)
- [AWS Cost Management](#aws-cost-management)
- [Quick Reference](#quick-reference)

## Architecture

```
PostgreSQL (RDS) ──┐
                   │ CDC Source
Payments App ──────┤──> Confluent Cloud ──> PostgreSQL Sink ──> Dashboard
                   │     (Kafka + Flink)       (RDS)              (Web UI)
```

## Features

### 5 Interactive Views

1. **Overview Dashboard** - KPIs and hourly sales trends
2. **Product Analytics** - Top products and brands performance
3. **Customer 360** - Customer insights and rankings
4. **Geographic View** - Sales by state and payment completion rates
5. **Architecture Flow** - Live data flow visualization with activity monitor

### Data Sources (PostgreSQL Tables)

- `product_sales` - Detailed product-level sales data (auto-created by Flink sink)
- `completed_orders` - Orders with validated payments (auto-created by Flink sink)
- `thirty_day_customer_snapshot` - Customer aggregated metrics (created by PostgreSQL sink connector)

## Prerequisites

### For Local Development
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL RDS instance (created by Terraform)
- Flink queries running and PostgreSQL sink connector active

### For AWS Production Deployment
- All local development prerequisites
- AWS CLI configured (`aws configure`)
- Terraform (infrastructure already applied)
- `jq` command-line JSON processor
- Docker (for building images)

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone and navigate to the project**
   ```bash
   cd retail-web-dashboard
   ```

2. **Configure environment variables**

   **Automated setup** (recommended):
   ```bash
   ./setup-env.sh
   ```
   This script will copy `.env.example` to `.env` and attempt to get PostgreSQL credentials from Terraform.

   **Manual setup**:
   ```bash
   cp .env.example .env
   nano .env  # or code .env
   ```

   Edit `.env` and set your PostgreSQL credentials (get endpoint from `terraform output resource-ids`):
   ```
   POSTGRES_HOST=your-rds-endpoint.region.rds.amazonaws.com
   POSTGRES_PORT=5432
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=Admin123456!!
   POSTGRES_DATABASE=onlinestoredb
   POSTGRES_SSL=false
   ```

   **Note**: This single `.env` file is used by both backend and frontend. See `ENV-CONFIGURATION.md` for details.

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

#### Prerequisites

First, ensure environment variables are configured:

```bash
cd retail-web-dashboard
./setup-env.sh  # Or manually: cp .env.example .env && nano .env
```

**Note**: Both backend and frontend use the same `.env` file in the `retail-web-dashboard/` directory.

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```
   Backend will run on http://localhost:3000

   The backend automatically loads `.env` from the parent directory (`retail-web-dashboard/.env`)

#### Frontend Setup

1. **Navigate to frontend directory** (in a new terminal)
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

   The frontend uses `VITE_API_URL` from `retail-web-dashboard/.env`

### Option 3: AWS Production Deployment

Deploy the dashboard to AWS App Runner for a production-ready, publicly accessible deployment.

#### Prerequisites for AWS Deployment

1. **Terraform infrastructure must be applied first**
   ```bash
   cd ../terraform
   terraform apply
   ```
   This creates:
   - ECR repositories for Docker images
   - App Runner services (backend & frontend)
   - VPC Connector for RDS access
   - Security groups and IAM roles

2. **Verify deployment is enabled**

   Check that `deploy_dashboard = true` in `terraform/terraform.tfvars`

#### Automated Deployment (Recommended)

```bash
cd retail-web-dashboard
./deploy.sh
```

This script will:
1. Authenticate with AWS ECR
2. Build backend Docker image
3. Push backend to ECR
4. Build frontend Docker image
5. Push frontend to ECR
6. Display deployment URLs

**Estimated time**: 5-10 minutes

#### Verify Deployment

```bash
./verify-deployment.sh
```

This checks:
- ✅ Backend API is responding
- ✅ Frontend is accessible
- ✅ Frontend can connect to backend
- ✅ Runtime configuration is correct

#### Access Your Dashboard

After deployment, get the URLs:

```bash
cd ../terraform
terraform output dashboard_urls
```

**Frontend URL**: `https://xxxxx.us-east-1.awsapprunner.com` (open this in browser)
**Backend URL**: `https://yyyyy.us-east-1.awsapprunner.com/api`

#### Manual Deployment Steps

If you prefer manual control:

1. **Get ECR repository URLs**
   ```bash
   cd ../terraform
   terraform output dashboard_urls
   ```

2. **Authenticate to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   ```

3. **Build and push backend**
   ```bash
   cd retail-web-dashboard/backend
   docker build -t dashboard-backend .
   docker tag dashboard-backend:latest <ECR_BACKEND_URL>:latest
   docker push <ECR_BACKEND_URL>:latest
   ```

4. **Build and push frontend**
   ```bash
   cd ../frontend
   docker build -f Dockerfile.apprunner -t dashboard-frontend .
   docker tag dashboard-frontend:latest <ECR_FRONTEND_URL>:latest
   docker push <ECR_FRONTEND_URL>:latest
   ```

5. **Wait for App Runner auto-deployment** (2-3 minutes)

#### AWS Deployment Architecture

```
┌─────────────────────────────────────────┐
│          AWS App Runner                 │
│                                         │
│  Frontend (Nginx)  →  Backend (Node.js)│
│  Port 80               Port 3000        │
│      ↓                     ↓            │
│  ECR Repo              ECR Repo         │
│                            ↓            │
│                     VPC Connector       │
└─────────────────────────────────────────┘
                     ↓
              RDS PostgreSQL

- HTTPS: Automatic (managed by App Runner)
- Auto-scaling: 1-2 instances (configurable)
- Auto-deploy: Enabled (pushes to ECR trigger redeployment)
```

#### Configuration & Costs

**Resources** (defined in `terraform/variables.tf`):
- CPU: 0.25 vCPU (minimum for demo)
- Memory: 0.5 GB
- Min instances: 1
- Max instances: 2

**Estimated monthly costs**: ~$25-30 USD

**To reduce costs**:
- Set `deploy_dashboard = false` in `terraform/terraform.tfvars`
- Run `terraform apply` to destroy dashboard resources
- Or manually delete App Runner services in AWS Console

#### Redeployment After Code Changes

```bash
cd retail-web-dashboard
./deploy.sh
```

App Runner will automatically detect new images and redeploy.

#### Troubleshooting AWS Deployment

**Backend returns 503**
- Wait 2-3 minutes for App Runner to complete deployment
- Check status: `aws apprunner list-services --region us-east-1`

**Frontend shows connection errors**
- Verify backend is healthy: `curl https://<BACKEND_URL>/api/overview/kpis`
- Check runtime config: `curl https://<FRONTEND_URL>/config.js`

**No data in dashboard**
- Verify Flink queries are running in Confluent Cloud
- Check tables have data (see "Verify Tables Exist" below)

**ECR authentication fails**
- Re-run: `aws ecr get-login-password --region us-east-1 | docker login ...`
- Verify AWS CLI credentials: `aws sts get-caller-identity`

For detailed troubleshooting, see `DEPLOYMENT.md`

#### Additional Documentation

- **Quick Start**: `QUICKSTART-DEPLOYMENT.md` - Fast deployment guide
- **Complete Guide**: `DEPLOYMENT.md` - Comprehensive deployment documentation
- **Technical Details**: `CAMBIOS-DEPLOYMENT.md` - Architecture and implementation details

## Getting PostgreSQL Credentials

### 1. RDS Endpoint

Get your RDS endpoint from Terraform:

```bash
cd terraform
terraform output resource-ids
```

Look for the **RDS Endpoint** line. Example:
```
RDS Endpoint: ls-retail-onlinestoredb.xxxxx.us-east-1.rds.amazonaws.com:5432
```

Use the hostname part (before the colon) as `POSTGRES_HOST`.

### 2. Verify Tables Exist

Connect to PostgreSQL and verify tables:

```bash
psql -h <POSTGRES_HOST> -U postgres -d onlinestoredb

# Inside psql:
\dt

# Or check row counts:
SELECT 'product_sales' as table_name, COUNT(*) FROM product_sales
UNION ALL
SELECT 'completed_orders', COUNT(*) FROM completed_orders
UNION ALL
SELECT 'thirty_day_customer_snapshot', COUNT(*) FROM thirty_day_customer_snapshot;
```

You should see all three tables with data.

## Project Structure

```
retail-web-dashboard/
├── backend/
│   ├── config/
│   │   └── postgres.js          # PostgreSQL connection (loads ../env)
│   ├── routes/
│   │   ├── overview.js          # Overview KPIs & trends
│   │   ├── products.js          # Product analytics
│   │   ├── customers.js         # Customer 360
│   │   ├── geographic.js        # Geographic & payments
│   │   └── architecture.js      # Architecture stats
│   ├── server.js                # Express app (loads ../env)
│   ├── package.json
│   └── Dockerfile               # Docker build for local & AWS
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── views/           # Main dashboard views
│   │   │   ├── shared/          # Reusable components
│   │   │   └── Layout.jsx       # App layout
│   │   ├── services/
│   │   │   └── api.js           # API client (runtime config support)
│   │   ├── utils/
│   │   │   ├── formatters.js    # Data formatting
│   │   │   └── hooks.js         # Custom React hooks
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── public/
│   │   └── config.js            # Runtime configuration for local dev
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile               # Docker build for local (docker-compose)
│   ├── Dockerfile.apprunner     # Optimized build for AWS App Runner
│   ├── docker-entrypoint.sh     # Runtime config injection for AWS
│   ├── nginx.conf               # Nginx config for local
│   └── nginx.apprunner.conf     # Nginx config for AWS (with /health)
│
├── docker-compose.yml           # Local development orchestration
├── .env.example                 # ⭐ Single env template (backend + frontend)
├── .env                         # Your config (git-ignored, created from .env.example)
├── setup-env.sh                 # ⭐ Automated environment setup script
├── deploy.sh                    # ⭐ AWS deployment automation script
├── verify-deployment.sh         # ⭐ Verify AWS deployment health
├── ENV-CONFIGURATION.md         # ⭐ Complete environment variable guide
├── DEPLOYMENT.md                # Complete AWS deployment guide
├── QUICKSTART-DEPLOYMENT.md     # Quick start for AWS deployment
├── CAMBIOS-DEPLOYMENT.md        # Technical implementation details
└── README.md                    # This file
```

## API Endpoints

### Overview
- `GET /api/overview/kpis` - Main KPIs (revenue, orders, customers)
- `GET /api/overview/hourly-sales` - Sales by hour (last 24h)
- `GET /api/overview/comparison` - Compare with previous day

### Products
- `GET /api/products/top?days=7` - Top 10 products
- `GET /api/products/brands?days=7` - Top brands
- `GET /api/products/distribution?days=7` - Brand distribution

### Customers
- `GET /api/customers/top` - Top 10 customers (30 day window)
- `GET /api/customers/metrics` - Average ticket & frequency
- `GET /api/customers/recent-activity` - Recent customer activity

### Geographic
- `GET /api/geographic/by-state?days=7` - Sales by state
- `GET /api/geographic/payment-completion?days=1` - Payment stats

### Architecture
- `GET /api/architecture/stats` - Row counts from tables
- `GET /api/architecture/activity` - Recent activity log

## Tech Stack

### Backend
- Node.js + Express
- pg - PostgreSQL client
- node-cache - Response caching (5s TTL)

### Frontend
- React 18
- Vite - Build tool
- Tailwind CSS - Styling
- Recharts - Charts library
- Lucide React - Icons
- React Router - Navigation
- Axios - HTTP client

## Deployment Comparison

| Feature | Local (Docker Compose) | Local (Node.js Dev) | AWS (App Runner) |
|---------|------------------------|---------------------|------------------|
| **Cost** | Free | Free | ~$25-30/month |
| **Setup Time** | 5 minutes | 10 minutes | 10-15 minutes |
| **URL** | localhost:5173 | localhost:5173 | Public HTTPS URL |
| **HTTPS** | No | No | Yes (automatic) |
| **Hot Reload** | No | Yes | No |
| **Scaling** | Manual | Manual | Auto (1-2 instances) |
| **Use Case** | Local testing | Development | Production/Demo |
| **Persistence** | Manual restart | Manual restart | Always available |

**Recommended Workflow**:
1. Develop locally with Node.js (hot-reload)
2. Test with Docker Compose (production-like)
3. Deploy to AWS for demos/production

## Performance

- **Caching**: API responses cached for 5 seconds
- **Auto-refresh**: Main views refresh every 5-10 seconds
- **Lazy loading**: Components load on demand
- **Optimized queries**: Aggregations done in PostgreSQL (via Flink)

## Troubleshooting

### Local Development Issues

#### Backend won't start
- Check `.env` file exists and has valid credentials
- Verify PostgreSQL RDS is accessible (security groups)
- Test connection: `curl http://localhost:3000/health`
- Test PostgreSQL: `psql -h <POSTGRES_HOST> -U postgres -d onlinestoredb -c "SELECT 1"`

#### Frontend shows "No data"
- Verify backend is running on port 3000
- Check browser console for API errors
- Verify tables have data in PostgreSQL:
  ```bash
  psql -h <POSTGRES_HOST> -U postgres -d onlinestoredb -c "SELECT COUNT(*) FROM product_sales"
  ```

#### Docker container errors
- Ensure `.env` file is in root `retail-web-dashboard/` directory
- Check logs: `docker-compose logs backend`
- Rebuild: `docker-compose up --build`

#### Slow queries
- Check RDS instance performance (CloudWatch metrics)
- Increase cache TTL in backend `.env`: `CACHE_TTL=30`
- Verify table row counts are reasonable
- Consider adding indexes if tables grow large

### AWS Deployment Issues

#### "ECR repository not found"
```bash
# Verify Terraform created the infrastructure
cd terraform
terraform output dashboard_urls

# If empty, apply Terraform
terraform apply
```

#### Backend returns 503 on AWS
- App Runner is still deploying (wait 2-3 minutes)
- Check deployment status:
  ```bash
  aws apprunner list-services --region us-east-1
  ```
- View service details:
  ```bash
  aws apprunner describe-service --service-arn <ARN>
  ```

#### Frontend can't connect to backend on AWS
1. Verify backend is healthy:
   ```bash
   curl https://<BACKEND_URL>/api/overview/kpis
   ```

2. Check frontend runtime config:
   ```bash
   curl https://<FRONTEND_URL>/config.js
   ```
   Should show: `VITE_API_URL: 'https://<BACKEND_URL>/api'`

3. Check browser console for CORS errors

#### Docker build fails for AWS
- Clear Docker cache: `docker system prune -a`
- Ensure using correct Dockerfile:
  - Backend: `Dockerfile`
  - Frontend: `Dockerfile.apprunner`

#### App Runner deployment failed
1. Check App Runner logs in AWS Console
2. Verify VPC Connector is attached (backend only)
3. Check security group allows RDS access
4. Verify IAM roles are properly configured

#### "No data" in AWS dashboard
Same as local - verify Flink queries are running:
```bash
psql -h <POSTGRES_HOST> -U postgres -d onlinestoredb -c "
SELECT 'product_sales' as table_name, COUNT(*) FROM product_sales
UNION ALL
SELECT 'completed_orders', COUNT(*) FROM completed_orders
UNION ALL
SELECT 'thirty_day_customer_snapshot', COUNT(*) FROM thirty_day_customer_snapshot;"
```

#### ECR authentication expires
Re-authenticate:
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
```

For more AWS troubleshooting, see `DEPLOYMENT.md`

## Adding New Tables from Flink

To add more Flink-materialized tables to the dashboard:

1. **Create Flink query** that outputs to a topic
   - Define in `terraform/queries/`
   - Apply with Terraform

2. **Create PostgreSQL Sink connector** (optional)
   - Add connector resource in `terraform/confluent.tf`
   - Set `auto.create = true` to auto-create the table
   - Or Flink can write directly with JDBC sink

3. **Add backend route** (`backend/routes/`)
   - Create new route file or extend existing
   - Add queries using the table name
   - Use `executeQuery()` from `config/postgres.js`

4. **Create API function** (`frontend/src/services/api.js`)
   ```javascript
   export const getNewData = () => api.get('/new-endpoint');
   ```

5. **Add component** (`frontend/src/components/views/`)
   - Use `useFetch` hook to fetch data
   - Use shared components for visualization

6. **Update navigation** (`frontend/src/components/Layout.jsx`)

## AWS Cost Management

The dashboard deployment on AWS incurs costs (~$25-30/month with minimum configuration).

### To minimize costs:

1. **Disable when not in use**:
   ```bash
   # In terraform/terraform.tfvars
   deploy_dashboard = false

   cd terraform
   terraform apply
   ```

2. **Use smaller instances** (slower performance):
   ```hcl
   # In terraform/terraform.tfvars
   apprunner_min_instances = 0  # Adds cold-start delay
   ```

3. **Delete specific resources**:
   ```bash
   cd terraform
   terraform destroy -target=aws_apprunner_service.frontend
   terraform destroy -target=aws_apprunner_service.backend
   ```

### Cost breakdown:
- Backend App Runner: ~$12-15/month (0.25 vCPU, 0.5 GB)
- Frontend App Runner: ~$12-15/month (0.25 vCPU, 0.5 GB)
- ECR Storage: ~$0.10/month (< 1 GB)
- Data Transfer: ~$1-2/month

## Quick Reference

### Common Commands

```bash
# Environment setup
./setup-env.sh                # Setup .env file (automated)
cp .env.example .env          # Setup .env file (manual)

# Local development
npm run dev                   # Start with hot-reload
docker-compose up -d          # Start with Docker
docker-compose logs -f        # View logs
docker-compose down           # Stop all services

# AWS deployment
./deploy.sh                   # Deploy to AWS
./verify-deployment.sh        # Check deployment health
terraform output dashboard_urls  # Get AWS URLs

# Database verification
psql -h <HOST> -U postgres -d onlinestoredb -c "\dt"  # List tables
```

### Useful Links

- [Confluent Cloud Console](https://confluent.cloud) - Manage Kafka & Flink
- [AWS App Runner Console](https://console.aws.amazon.com/apprunner) - Monitor services
- [AWS ECR Console](https://console.aws.amazon.com/ecr) - View Docker images

## Additional Documentation

- **`ENV-CONFIGURATION.md`** ⭐ - Complete guide to environment variables and `.env` setup
- **`DEPLOYMENT.md`** - Complete AWS deployment guide with detailed troubleshooting
- **`QUICKSTART-DEPLOYMENT.md`** - Fast-track AWS deployment instructions
- **`CAMBIOS-DEPLOYMENT.md`** - Technical architecture and implementation details
- **`SETUP.md`** - Initial project setup and configuration
- **`QUICKSTART.md`** - Quick start for local development

## License

Part of the online-retailer-flink-demo project.
