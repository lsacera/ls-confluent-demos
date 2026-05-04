# Modular Architecture Guide

## Overview

The Terraform configuration has been refactored to support multiple demo scenarios (Retail and SCADA) that can be deployed independently or together using feature flags.

## Architecture Structure

```
terraform/
├── demo-stacks.tf              # Conditional module invocation based on feature flags
├── variables.tf                # Global variables including enable_retail_demo and enable_scada_demo
├── confluent.tf                # Shared Confluent resources (Environment, Cluster, Service Accounts)
├── aws.tf                      # Shared AWS resources (VPC, RDS, Security Groups)
├── dashboard-ecs.tf            # Dashboard deployment
├── providers.tf                # Terraform providers
├── outputs.tf                  # Global outputs
│
├── modules/
│   ├── retail_stack/           # Retail demo module
│   │   ├── main.tf            # Retail-specific resources (apps, topics, schemas)
│   │   ├── variables.tf       # Module input variables
│   │   ├── outputs.tf         # Module outputs
│   │   └── README.md          # Module documentation
│   │
│   └── scada_stack/            # SCADA demo module (placeholder)
│       ├── main.tf            # SCADA-specific resources (placeholder)
│       ├── variables.tf       # Module input variables
│       ├── outputs.tf         # Module outputs
│       └── README.md          # Module documentation and roadmap
│
└── apps.tf.original            # Original monolithic apps config (kept for reference)
```

## Feature Flags

Control which demos to deploy using these variables in `terraform.tfvars`:

```hcl
# Deploy only Retail demo (default)
enable_retail_demo = true
enable_scada_demo  = false

# Deploy only SCADA demo
enable_retail_demo = false
enable_scada_demo  = true

# Deploy both demos
enable_retail_demo = true
enable_scada_demo  = true

# Deploy neither (just shared infrastructure)
enable_retail_demo = false
enable_scada_demo  = false
```

## What's Shared vs. What's Modular

### Shared Resources (Always Deployed)
- **Confluent Cloud**: Environment, Kafka Cluster, Service Accounts, API Keys, Flink Compute Pool
- **AWS Infrastructure**: VPC, Subnets, Security Groups, RDS PostgreSQL, ECS Cluster, IAM Roles
- **Connectors**: PostgreSQL CDC Source Connector
- **Dashboard**: Web dashboard (can display data from active demos)

### Retail Stack Module (`modules/retail_stack/`)
- **Applications**: DB Feeder, Payments App
- **ECR Repositories**: Payment app, DB feeder app
- **ECS Services**: Fargate tasks for both apps
- **Kafka Topics**: `payments`, `error-payments`
- **Avro Schemas**: Payment event schema
- **IAM Resources**: KMS encryption for payment app
- **Configuration Files**: App properties, data quality rules

### SCADA Stack Module (`modules/scada_stack/`) - Placeholder
Currently a placeholder for future implementation. See `modules/scada_stack/README.md` for planned features.

## Deployment Scenarios

### Scenario 1: Deploy Only Retail Demo

```bash
cd terraform

# Edit terraform.tfvars
cat > terraform.tfvars <<EOF
enable_retail_demo = true
enable_scada_demo  = false

email = "your-email@example.com"
prefix = "demo"
cloud_region = "us-east-1"
# ... other required variables
EOF

# Deploy
terraform init
terraform plan
terraform apply
```

**Result**: Retail demo fully functional with DB feeder and payments apps running.

### Scenario 2: Deploy Only SCADA Demo (When Implemented)

```bash
cd terraform

# Edit terraform.tfvars
cat > terraform.tfvars <<EOF
enable_retail_demo = false
enable_scada_demo  = true

email = "your-email@example.com"
# ... other required variables
EOF

# Deploy
terraform init
terraform plan
terraform apply
```

**Result**: Only SCADA simulator and energy grid analytics running.

### Scenario 3: Deploy Both Demos

```bash
cd terraform

# Edit terraform.tfvars
cat > terraform.tfvars <<EOF
enable_retail_demo = true
enable_scada_demo  = true

email = "your-email@example.com"
# ... other required variables
EOF

# Deploy
terraform init
terraform plan
terraform apply
```

**Result**: Both demos running side-by-side, sharing Kafka cluster, RDS database, and dashboard.

### Scenario 4: Toggle Between Demos

```bash
# Start with retail
terraform apply -var="enable_retail_demo=true" -var="enable_scada_demo=false"

# Switch to SCADA (retail apps will be destroyed)
terraform apply -var="enable_retail_demo=false" -var="enable_scada_demo=true"

# Enable both
terraform apply -var="enable_retail_demo=true" -var="enable_scada_demo=true"
```

## Benefits of Modular Architecture

### 1. **Flexibility**
- Deploy one or both demos without code changes
- Easy to showcase different use cases to different audiences
- Test modules independently

### 2. **Cost Optimization**
- Only pay for resources you're actively using
- Shared infrastructure (VPC, RDS, Kafka) maximizes efficiency
- Can disable expensive components when not needed

### 3. **Maintainability**
- Clear separation of concerns
- Each module is self-contained and documented
- Easier to debug and troubleshoot

### 4. **Scalability**
- Easy to add new demo modules in the future
- Modules can be versioned independently
- Reusable components across projects

### 5. **CI/CD Ready**
- Different pipelines for different demos
- Can test retail changes without affecting SCADA
- Feature flags enable gradual rollouts

## Migration Notes

### For Existing Deployments

If you have an existing deployment from before the modular refactor:

1. **Backup your state**:
   ```bash
   cp terraform.tfstate terraform.tfstate.backup
   ```

2. **The configuration is backward compatible**. By default:
   - `enable_retail_demo = true`
   - `enable_scada_demo = false`

3. **Resources have been moved, not recreated**. The module creates the exact same resources as before, just organized differently.

4. **Original files preserved**:
   - `apps.tf` → `apps.tf.original` (for reference)
   - Retail topics/schemas in `confluent.tf` are commented out with notes

### State Migration (If Needed)

If Terraform detects resources need to be moved in state:

```bash
# Example: Move payment app ECR repo to module
terraform state mv \
  aws_ecr_repository.payment_app_repo \
  module.retail_stack[0].aws_ecr_repository.payment_app_repo

# List all moves needed
terraform plan
# Look for resources being destroyed and recreated
# Use terraform state mv for each one
```

Alternatively, you can do a fresh deployment:
```bash
# Destroy old deployment
terraform destroy

# Deploy with modular config
terraform apply
```

## Dashboard Integration

The dashboard automatically detects which demos are active by querying the database:

- **Retail data present** → Shows retail analytics tabs
- **SCADA data present** → Shows energy grid tabs  
- **Both present** → Shows all tabs

No dashboard configuration changes needed when toggling demos.

## Flink Queries

Flink queries are managed by the `modules/flink_queries` module, which is shared across demos. Each demo's queries are defined separately within that module.

When retail is disabled, retail-specific Flink queries should also be disabled (future enhancement).

## Adding a New Demo Module

To add a new demo module (e.g., `iot_fleet`):

1. Create module directory:
   ```bash
   mkdir -p modules/iot_fleet
   ```

2. Create module files:
   - `main.tf` - Resources for the demo
   - `variables.tf` - Input variables
   - `outputs.tf` - Output values
   - `README.md` - Documentation

3. Add feature flag to `variables.tf`:
   ```hcl
   variable "enable_iot_fleet_demo" {
     description = "Enable IoT fleet demo"
     type        = bool
     default     = false
   }
   ```

4. Add module invocation to `demo-stacks.tf`:
   ```hcl
   module "iot_fleet_stack" {
     count  = var.enable_iot_fleet_demo ? 1 : 0
     source = "./modules/iot_fleet"
     # ... pass variables
   }
   ```

## Troubleshooting

### Module not found
```
Error: Module not installed
```
**Solution**: Run `terraform init` to install modules.

### Resources already exist
```
Error: A resource with the ID "xyz" already exists
```
**Solution**: You may need to import or move existing resources to the module state.

### Count cannot be computed
```
Error: Invalid count argument
```
**Solution**: Ensure feature flag variables are defined in `terraform.tfvars` or via `-var` flags.

## Support

For questions or issues with the modular architecture, contact:
- Luis Sanchez (lsanchezacera@confluent.io)
