#!/bin/bash
set -e

# Start timer
START_TIME=$SECONDS

echo "========================================="
echo "🛒 Retail Demo Deployment Script"
echo "========================================="
echo ""
echo "This script deploys the Retail demo including:"
echo "  • DB Feeder (PostgreSQL data generator) - ECS Docker container"
echo "  • Payments App (Kafka producer) - ECS Docker container"
echo "  • Confluent Cloud (Kafka + Flink queries)"
echo "  • Web Dashboard (React + Node.js) - ECS Docker container"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to terraform directory
cd terraform

echo -e "${BLUE}📋 Checking configuration...${NC}"
echo ""

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}❌ Error: terraform.tfvars not found${NC}"
    echo ""
    echo "Please create terraform.tfvars with your configuration."
    echo "You can use terraform.tfvars.modular_example as a template:"
    echo ""
    echo "  cp terraform.tfvars.modular_example terraform.tfvars"
    echo "  # Then edit terraform.tfvars with your credentials"
    echo ""
    exit 1
fi

# Check if retail demo is enabled in terraform.tfvars
if grep -q "enable_retail_demo.*=.*false" terraform.tfvars 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: enable_retail_demo is set to false in terraform.tfvars${NC}"
    echo ""
    read -p "Do you want to enable it now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i.bak 's/enable_retail_demo.*=.*false/enable_retail_demo = true/' terraform.tfvars
        echo -e "${GREEN}✓ Enabled retail demo in terraform.tfvars${NC}"
        echo ""
    else
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Configuration validated${NC}"
echo ""

echo -e "${BLUE}1. Initializing Terraform...${NC}"
terraform init

echo ""
echo -e "${BLUE}2. Planning deployment...${NC}"

# Check if SCADA demo is currently enabled
SCADA_ENABLED=$(grep -E "^\s*enable_scada_demo\s*=" terraform.tfvars | grep -q "true" && echo "true" || echo "false")

if [ "$SCADA_ENABLED" = "true" ]; then
    echo "   Demo stacks to deploy:"
    echo "     ✓ Retail Demo (DB Feeder + Payments App + Dashboard)"
    echo "     ✓ SCADA Demo (preserving existing deployment)"
    echo ""
    echo -e "${YELLOW}ℹ️  SCADA demo is already deployed - will be preserved${NC}"
else
    echo "   Demo stacks to deploy:"
    echo "     ✓ Retail Demo (DB Feeder + Payments App + Dashboard)"
    echo ""
fi

# Create plan with retail demo enabled (preserve SCADA if enabled)
if [ "$SCADA_ENABLED" = "true" ]; then
    terraform plan \
        -var="enable_retail_demo=true" \
        -var="enable_scada_demo=true" \
        -out=tfplan
else
    terraform plan \
        -var="enable_retail_demo=true" \
        -out=tfplan
fi

echo ""
echo -e "${BLUE}3. Review the plan above and confirm deployment...${NC}"
echo ""
echo "This deployment will:"
echo "  • Build and push Docker images to AWS ECR"
echo "  • Create ECS Fargate tasks for:"
echo "    - DB Feeder (data generator)"
echo "    - Payments App (Kafka producer)"
echo "    - Web Dashboard (nginx + Node.js combined container)"
echo "  • Configure Confluent Cloud resources (topics, schemas, Flink queries)"
echo "  • Deploy infrastructure (VPC, RDS PostgreSQL, ECS Cluster)"
echo ""
echo "Docker containers deployed on ECS:"
echo "  • 3 containers total (DB Feeder, Payments App, Dashboard)"
echo "  • Dashboard combines frontend (nginx) + backend (Express) in single container"
echo ""
echo "Estimated time: 15-25 minutes"
echo ""
read -p "Do you want to proceed with the deployment? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo ""
    echo -e "${BLUE}Deployment cancelled.${NC}"
    rm -f tfplan
    exit 0
fi

echo ""
echo -e "${BLUE}Starting deployment...${NC}"
echo ""
terraform apply tfplan

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Retail Demo Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Get deployment information
echo -e "${BLUE}📊 Gathering deployment information...${NC}"
sleep 10

# Get ECS cluster info
CLUSTER_NAME=$(terraform output -json retail_dashboard_ecs_info | jq -r '.cluster' 2>/dev/null || echo "")

# Get Dashboard URL
DASHBOARD_TASK=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name retail-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

if [ ! -z "$DASHBOARD_TASK" ] && [ "$DASHBOARD_TASK" != "None" ]; then
    DASHBOARD_ENI=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $DASHBOARD_TASK --region us-east-1 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text 2>/dev/null || echo "")
    DASHBOARD_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $DASHBOARD_ENI --region us-east-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text 2>/dev/null || echo "")

    if [ ! -z "$DASHBOARD_IP" ] && [ "$DASHBOARD_IP" != "None" ]; then
        echo ""
        echo -e "${GREEN}📊 Dashboard URL: http://$DASHBOARD_IP${NC}"
        echo ""
        echo "Dashboard Architecture:"
        echo "  • ECS Fargate container running on port 80"
        echo "  • Combined nginx (frontend) + Node.js (backend) using supervisord"
        echo "  • React frontend built from retail-web-dashboard/"
        echo "  • Express API backend querying PostgreSQL"
        echo ""
        echo "Dashboard features available:"
        echo "  • Overview Dashboard - Real-time KPIs and sales trends"
        echo "  • Product Analytics - Top products and brand distribution"
        echo "  • Customer 360 - Customer insights and metrics"
        echo "  • Geographic View - Sales by state"
        echo "  • Payment Completion - Payment processing rates"
        echo "  • Architecture Flow - Live data flow visualization"
        echo ""
        echo "Note: It may take 1-2 minutes for the dashboard to be fully ready"
        echo ""
    fi
fi

# Get Retail Stack information
echo -e "${BLUE}🛒 Retail Demo Services (ECS Docker Containers):${NC}"
echo ""

# Check if retail stack outputs are available
RETAIL_DEPLOYED=$(terraform output -json retail_stack_deployed 2>/dev/null | jq -r '.' || echo "false")

if [ "$RETAIL_DEPLOYED" = "true" ]; then
    # Get ECS service information
    PAYMENT_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name payment-app-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")
    DBFEEDER_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name dbfeeder-app-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")
    DASHBOARD_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name retail-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

    if [ ! -z "$PAYMENT_SERVICE" ] && [ "$PAYMENT_SERVICE" != "None" ]; then
        echo -e "  ${GREEN}✓${NC} Payments App (Docker) - Running (generating payment events every 5s)"
    else
        echo -e "  ${YELLOW}⏳${NC} Payments App (Docker) - Starting..."
    fi

    if [ ! -z "$DBFEEDER_SERVICE" ] && [ "$DBFEEDER_SERVICE" != "None" ]; then
        echo -e "  ${GREEN}✓${NC} DB Feeder (Docker) - Running (inserting orders every 5s)"
    else
        echo -e "  ${YELLOW}⏳${NC} DB Feeder (Docker) - Starting..."
    fi

    if [ ! -z "$DASHBOARD_SERVICE" ] && [ "$DASHBOARD_SERVICE" != "None" ]; then
        echo -e "  ${GREEN}✓${NC} Web Dashboard (Docker) - Running (nginx + Node.js combined)"
    else
        echo -e "  ${YELLOW}⏳${NC} Web Dashboard (Docker) - Starting..."
    fi

    echo ""
    echo "Kafka Topics created:"
    echo "  • payments - Payment event stream"
    echo "  • error-payments - Failed payment events (DLQ)"
    echo ""
    echo "Flink Queries deployed:"
    echo "  • 6 Flink SQL statements processing data in real-time"
    echo ""
fi

echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo ""
echo "View Dashboard logs (Docker container):"
echo "  aws logs tail \$(terraform output -json retail_dashboard_ecs_info | jq -r '.log_group') --follow --region us-east-1"
echo ""
echo "Restart Dashboard container:"
echo "  aws ecs update-service --cluster $CLUSTER_NAME --service retail-dashboard-service --force-new-deployment --region us-east-1"
echo ""
echo "View Payments App logs:"
echo "  aws logs tail /ecs/payments-task-* --follow --region us-east-1"
echo ""
echo "View DB Feeder logs:"
echo "  aws logs tail /ecs/db-feeder-task-* --follow --region us-east-1"
echo ""
echo "Access PostgreSQL database:"
echo "  psql -h \$(terraform output -json | jq -r '.postgres_endpoint.value | split(\":\")[0]') -U postgres -d onlinestoredb"
echo ""
echo "Check ECS containers status:"
echo "  aws ecs list-tasks --cluster $CLUSTER_NAME --region us-east-1"
echo ""
echo "Confluent Cloud Console:"
echo "  https://confluent.cloud/"
echo ""

# Open dashboard in browser
if [ ! -z "$DASHBOARD_IP" ] && [ "$DASHBOARD_IP" != "None" ]; then
    echo -e "${BLUE}🌐 Opening dashboard in browser...${NC}"
    echo ""

    # Open browser (macOS/Linux/Windows compatible)
    if command -v open &> /dev/null; then
        open "http://$DASHBOARD_IP"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://$DASHBOARD_IP"
    elif command -v start &> /dev/null; then
        start "http://$DASHBOARD_IP"
    else
        echo "Could not detect browser command. Please open http://$DASHBOARD_IP manually."
    fi
fi

# Calculate elapsed time
ELAPSED_TIME=$((SECONDS - START_TIME))
MINUTES=$((ELAPSED_TIME / 60))
SECONDS_REMAINING=$((ELAPSED_TIME % 60))

echo ""
echo -e "${GREEN}⏱️  Total deployment time: ${MINUTES}m ${SECONDS_REMAINING}s${NC}"
echo ""
echo -e "${GREEN}🎉 Retail demo is ready to use!${NC}"
echo ""

# Display Dashboard URL prominently at the end
if [ ! -z "$DASHBOARD_IP" ] && [ "$DASHBOARD_IP" != "None" ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Dashboard URL: ${BLUE}http://$DASHBOARD_IP${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
fi

# Clean up plan file
rm -f tfplan
