# Deployment Scripts Guide

This repository includes several deployment scripts to manage different demo scenarios using the modular architecture.

## 📋 Available Scripts

### 🚀 Deployment Scripts

#### `./deploy-retail-demo.sh`
**Deploy Retail Demo Only**

Deploys the retail analytics demo including:
- DB Feeder (PostgreSQL data generator)
- Payments App (Kafka event producer)
- Confluent Cloud resources
- Web dashboard

```bash
./deploy-retail-demo.sh
```

**What it does:**
1. Validates configuration (terraform.tfvars)
2. Ensures `enable_retail_demo=true`
3. Initializes Terraform
4. Builds Docker images for retail apps
5. Deploys all infrastructure
6. Opens dashboard in browser
7. Shows service status and useful commands

**Estimated time:** 15-25 minutes

---

#### `./deploy-scada-demo.sh`
**Deploy SCADA Demo Only (Placeholder)**

Attempts to deploy the SCADA energy grid demo.

```bash
./deploy-scada-demo.sh
```

**Current status:** ⚠️ Placeholder only

This script will deploy the SCADA placeholder and show the roadmap for implementation. The SCADA simulator is not yet implemented.

See `terraform/modules/scada_stack/README.md` for implementation details.

---

#### `./deploy-both-demos.sh`
**Deploy Both Retail and SCADA Demos**

Deploys both demos simultaneously, sharing infrastructure.

```bash
./deploy-both-demos.sh
```

**What it deploys:**
- Retail Demo (fully functional)
- SCADA Demo (placeholder)
- Shared: Kafka cluster, RDS database, VPC, dashboard

**Estimated time:** 20-30 minutes

**Benefits:**
- Cost-effective (shares infrastructure)
- Unified dashboard
- Demonstrates versatility of the platform

---

### 🔄 Management Scripts

#### `./switch-demo.sh`
**Switch Between Demos Without Full Redeploy**

Interactively switch between demo configurations without destroying shared infrastructure.

```bash
./switch-demo.sh
```

**Options:**
1. Retail Demo only
2. SCADA Demo only
3. Both demos
4. Neither demo (infrastructure only)
5. Cancel

**What it preserves:**
- Confluent Cloud environment and Kafka cluster
- RDS PostgreSQL database
- AWS VPC and networking
- Dashboard service

**What it changes:**
- ECS services (apps)
- Kafka topics and schemas
- Application-specific resources

**Use case:** Quickly demonstrate different scenarios to stakeholders without waiting for full infrastructure rebuild.

**Estimated time:** 5-10 minutes

---

### 🗑️ Cleanup Scripts

#### `./destroy-retail-demo.sh`
**Destroy All Deployed Resources**

Completely removes all infrastructure and demos.

```bash
./destroy-retail-demo.sh
```

**What it destroys:**
- All deployed demos (retail, SCADA)
- Confluent Cloud resources
- AWS infrastructure (VPC, RDS, ECS)
- Dashboard
- CloudWatch logs

**Safety features:**
- Shows what will be destroyed
- Option to stop Flink statements first (recommended)
- Requires typing 'destroy' to confirm

**Estimated time:** 10-15 minutes

---

## 🎯 Common Workflows

### First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/confluentinc/online-retailer-flink-demo.git
cd online-retailer-flink-demo

# 2. Configure credentials
cp terraform/terraform.tfvars.modular_example terraform/terraform.tfvars
# Edit terraform.tfvars with your AWS and Confluent credentials

# 3. Deploy retail demo
./deploy-retail-demo.sh

# 4. Access dashboard at the URL shown
```

---

### Demo for Different Audiences

**Retail/E-commerce audience:**
```bash
./deploy-retail-demo.sh
# Show: Customer360, Product Analytics, Payment Processing
```

**Energy/Utilities audience:**
```bash
./deploy-scada-demo.sh
# Show: Energy Grid Monitoring (when implemented)
```

**Platform/Technology audience:**
```bash
./deploy-both-demos.sh
# Show: Same platform handling different industries
```

---

### Quick Demo Switching

Already have infrastructure deployed and want to switch demos?

```bash
./switch-demo.sh
# Select option 1 (Retail) or 2 (SCADA)
# Much faster than full redeploy (5-10 min vs 20-25 min)
```

---

### Cost Optimization

**Development/Testing:**
```bash
# During the day
./deploy-retail-demo.sh

# At night (to save costs)
./switch-demo.sh
# Select option 4: Neither demo (infrastructure only)

# Next morning
./switch-demo.sh
# Select option 1: Retail Demo only
```

This keeps Kafka cluster and RDS running (cheaper than recreating) but stops expensive ECS Fargate tasks.

**Complete cleanup:**
```bash
./destroy-retail-demo.sh
```

---

## 🛠️ Advanced Usage

### Custom Variable Override

All deployment scripts support explicit variable overrides:

```bash
cd terraform

# Deploy with custom settings
terraform plan \
    -var="enable_retail_demo=true" \
    -var="enable_scada_demo=false" \
    -var="cloud_region=eu-west-1" \
    -out=tfplan

terraform apply tfplan
```

---

### Partial Deployment

Deploy only infrastructure without apps:

```bash
cd terraform

terraform plan \
    -var="enable_retail_demo=false" \
    -var="enable_scada_demo=false" \
    -out=tfplan

terraform apply tfplan
```

This creates:
- Confluent Cloud environment
- Kafka cluster
- RDS PostgreSQL
- VPC and networking
- Dashboard

But no demo apps or topics.

---

### Manual Deployment

For more control:

```bash
cd terraform

# 1. Initialize
terraform init

# 2. Plan
terraform plan

# 3. Review the plan carefully

# 4. Apply
terraform apply

# 5. Get outputs
terraform output
```

---

## 🔍 Troubleshooting Scripts

### Script fails with "terraform.tfvars not found"

**Solution:**
```bash
cp terraform/terraform.tfvars.modular_example terraform/terraform.tfvars
# Edit with your credentials
```

---

### Script fails with "AWS credentials not configured"

**Solution:**
```bash
# Option 1: Configure AWS CLI
aws configure

# Option 2: Set environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_SESSION_TOKEN="your-token"  # if using temporary creds
```

---

### Script fails with "Module not installed"

**Solution:**
```bash
cd terraform
terraform init
```

---

### Script shows "enable_retail_demo is false" warning

**Solution:**
The script will prompt you to enable it. Choose 'y' to continue.

Or manually edit terraform/terraform.tfvars:
```hcl
enable_retail_demo = true
```

---

### Docker daemon not running

**Solution:**
Start Docker Desktop before running deployment scripts.

---

### Permission denied when running scripts

**Solution:**
```bash
chmod +x *.sh
```

---

## 📊 Script Comparison

| Script | Time | Cost Impact | Use Case |
|--------|------|-------------|----------|
| `deploy-retail-demo.sh` | 15-25 min | Full | First deploy or full rebuild |
| `deploy-scada-demo.sh` | 15-25 min | Full | SCADA only (when implemented) |
| `deploy-both-demos.sh` | 20-30 min | Full | Multi-demo showcase |
| `switch-demo.sh` | 5-10 min | Low | Quick demo changes |
| `destroy-retail-demo.sh` | 10-15 min | -Full | Complete cleanup |

---

## 🎓 Best Practices

### Before Deployment

✅ Check AWS credentials are configured  
✅ Verify Docker Desktop is running  
✅ Review terraform.tfvars configuration  
✅ Ensure sufficient AWS service limits  
✅ Have Confluent Cloud credentials ready  

### During Deployment

✅ Monitor script output for errors  
✅ Don't interrupt Terraform apply  
✅ Note the dashboard URL provided  
✅ Wait for "Deployment Complete" message  

### After Deployment

✅ Verify dashboard is accessible  
✅ Check ECS services are running  
✅ Review CloudWatch logs if issues  
✅ Test data is flowing (check dashboard)  
✅ Save dashboard URL for later  

### Cost Management

✅ Use `switch-demo.sh` instead of full redeploy  
✅ Run `destroy-retail-demo.sh` when done  
✅ Monitor AWS billing dashboard  
✅ Consider infrastructure-only mode for idle times  

---

## 📞 Support

For issues with deployment scripts:

1. Check script output for specific error messages
2. Review `terraform/MODULAR_ARCHITECTURE.md` for architecture details
3. Check AWS CloudWatch logs for service errors
4. Verify all prerequisites are met

Contact: Luis Sanchez (lsanchezacera@confluent.io)
