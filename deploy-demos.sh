#!/bin/bash
set -e

# Start timer
START_TIME=$SECONDS

echo "========================================="
echo "🚀 Deploy Both Demos Script"
echo "========================================="
echo ""
echo "This script deploys BOTH demos simultaneously:"
echo ""
echo "  🛒 Retail Demo:"
echo "     • DB Feeder (PostgreSQL data generator) - ECS Docker container"
echo "     • Payments App (Kafka producer) - ECS Docker container"
echo "     • Web Dashboard (React + Node.js) - ECS Docker container"
echo ""
echo "  ⚡ SCADA Demo:"
echo "     • SCADA Simulator (18 sensors) - ECS Docker container"
echo "     • Web Dashboard (React + Node.js) - ECS Docker container"
echo ""
echo "Both demos share the same infrastructure:"
echo "  • Confluent Cloud (Kafka cluster + Flink compute pool)"
echo "  • AWS RDS PostgreSQL (same DB, different tables)"
echo "  • ECS Cluster, VPC, Security Groups"
echo ""
echo "Total Docker containers: 5 (3 retail + 2 SCADA)"
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

echo -e "${GREEN}✓ Configuration validated${NC}"
echo ""

echo -e "${BLUE}1. Initializing Terraform...${NC}"
terraform init

echo ""
echo -e "${BLUE}2. Planning deployment...${NC}"
echo "   Demo stacks to deploy:"
echo "     ✓ Retail Demo (DB Feeder + Payments App + Dashboard)"
echo "     ✓ SCADA Demo (SCADA Simulator + Dashboard)"
echo ""

# Create plan with both demos enabled
terraform plan \
    -var="enable_retail_demo=true" \
    -var="enable_scada_demo=true" \
    -out=tfplan

echo ""
echo -e "${BLUE}3. Review the plan above and confirm deployment...${NC}"
echo ""
echo "This deployment will:"
echo "  • Build and push 5 Docker images to AWS ECR"
echo "  • Create ECS Fargate tasks for all containers"
echo "  • Configure Confluent Cloud (topics, schemas, Flink queries)"
echo "  • Deploy shared infrastructure (VPC, RDS, Kafka, Flink pool)"
echo ""
echo "Docker containers deployed on ECS:"
echo "  • Retail: DB Feeder, Payments App, Web Dashboard"
echo "  • SCADA: SCADA Simulator, Web Dashboard"
echo ""
echo "Flink queries deployed:"
echo "  • 6 Retail queries + 5 SCADA queries = 11 total"
echo ""
echo "Estimated time: 20-30 minutes"
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
echo -e "${GREEN}✅ Both Demos Deployed Successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Get deployment information
echo -e "${BLUE}📊 Gathering deployment information...${NC}"
sleep 10

# Get ECS cluster info
CLUSTER_NAME=$(terraform output -json retail_dashboard_ecs_info 2>/dev/null | jq -r '.cluster' 2>/dev/null || echo "")

# Get Retail Dashboard URL
RETAIL_DASHBOARD_TASK=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name retail-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

if [ ! -z "$RETAIL_DASHBOARD_TASK" ] && [ "$RETAIL_DASHBOARD_TASK" != "None" ]; then
    RETAIL_DASHBOARD_ENI=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $RETAIL_DASHBOARD_TASK --region us-east-1 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text 2>/dev/null || echo "")
    RETAIL_DASHBOARD_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $RETAIL_DASHBOARD_ENI --region us-east-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text 2>/dev/null || echo "")

    if [ ! -z "$RETAIL_DASHBOARD_IP" ] && [ "$RETAIL_DASHBOARD_IP" != "None" ]; then
        echo ""
        echo -e "${GREEN}🛒 Retail Dashboard URL: http://$RETAIL_DASHBOARD_IP${NC}"
        echo ""
        echo "Features: Overview, Products, Customers, Geographic, Payments, Architecture"
        echo ""
    fi
fi

# Get SCADA Dashboard URL
SCADA_DASHBOARD_TASK=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name scada-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

if [ ! -z "$SCADA_DASHBOARD_TASK" ] && [ "$SCADA_DASHBOARD_TASK" != "None" ]; then
    SCADA_DASHBOARD_ENI=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $SCADA_DASHBOARD_TASK --region us-east-1 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text 2>/dev/null || echo "")
    SCADA_DASHBOARD_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $SCADA_DASHBOARD_ENI --region us-east-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text 2>/dev/null || echo "")

    if [ ! -z "$SCADA_DASHBOARD_IP" ] && [ "$SCADA_DASHBOARD_IP" != "None" ]; then
        echo -e "${GREEN}⚡ SCADA Dashboard URL: http://$SCADA_DASHBOARD_IP${NC}"
        echo ""
        echo "Features: Grid Health, Anomalies, Sensors, Geographic, Architecture"
        echo ""
    fi
fi

echo -e "${BLUE}🛒 Retail Demo Services (ECS Docker Containers):${NC}"
echo ""

# Check Retail services
PAYMENT_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name payment-app-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")
DBFEEDER_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name dbfeeder-app-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")
RETAIL_DASH_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name retail-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

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

if [ ! -z "$RETAIL_DASH_SERVICE" ] && [ "$RETAIL_DASH_SERVICE" != "None" ]; then
    echo -e "  ${GREEN}✓${NC} Web Dashboard (Docker) - Running (nginx + Node.js combined)"
else
    echo -e "  ${YELLOW}⏳${NC} Web Dashboard (Docker) - Starting..."
fi

echo ""
echo "Retail Kafka Topics:"
echo "  • payments, error-payments"
echo ""
echo "Retail Flink Queries: 6 SQL statements"
echo ""

echo -e "${BLUE}⚡ SCADA Demo Services (ECS Docker Containers):${NC}"
echo ""

SCADA_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name scada-simulator-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")
SCADA_DASH_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name scada-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

if [ ! -z "$SCADA_SERVICE" ] && [ "$SCADA_SERVICE" != "None" ]; then
    echo -e "  ${GREEN}✓${NC} SCADA Simulator (Docker) - Running (18 sensors, telemetry every 5s)"
else
    echo -e "  ${YELLOW}⏳${NC} SCADA Simulator (Docker) - Starting..."
fi

if [ ! -z "$SCADA_DASH_SERVICE" ] && [ "$SCADA_DASH_SERVICE" != "None" ]; then
    echo -e "  ${GREEN}✓${NC} Web Dashboard (Docker) - Running (nginx + Node.js combined)"
else
    echo -e "  ${YELLOW}⏳${NC} Web Dashboard (Docker) - Starting..."
fi

echo ""
echo "SCADA Kafka Topics:"
echo "  • scada-telemetry, scada-alerts, error-scada-telemetry"
echo ""
echo "SCADA Flink Queries: 5 SQL statements (anomaly detection)"
echo ""

echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo ""
echo "View Retail Dashboard logs:"
echo "  aws logs tail \$(terraform output -json retail_dashboard_ecs_info | jq -r '.log_group') --follow --region us-east-1"
echo ""
echo "View SCADA Dashboard logs:"
echo "  aws logs tail \$(terraform output -json scada_dashboard_ecs_info | jq -r '.log_group') --follow --region us-east-1"
echo ""
echo "Check all ECS containers:"
echo "  aws ecs list-tasks --cluster $CLUSTER_NAME --region us-east-1"
echo ""
echo "Access PostgreSQL database:"
echo "  psql -h \$(terraform output -json | jq -r '.postgres_endpoint.value | split(\":\")[0]') -U postgres -d onlinestoredb"
echo ""
echo "Confluent Cloud Console:"
echo "  https://confluent.cloud/"
echo ""

# Open dashboards in browser
if [ ! -z "$RETAIL_DASHBOARD_IP" ] && [ "$RETAIL_DASHBOARD_IP" != "None" ]; then
    echo -e "${BLUE}🌐 Opening Retail dashboard in browser...${NC}"

    # Open browser (macOS/Linux/Windows compatible)
    if command -v open &> /dev/null; then
        open "http://$RETAIL_DASHBOARD_IP"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://$RETAIL_DASHBOARD_IP"
    elif command -v start &> /dev/null; then
        start "http://$RETAIL_DASHBOARD_IP"
    fi
fi

if [ ! -z "$SCADA_DASHBOARD_IP" ] && [ "$SCADA_DASHBOARD_IP" != "None" ]; then
    echo -e "${BLUE}🌐 Opening SCADA dashboard in browser...${NC}"

    # Open browser
    if command -v open &> /dev/null; then
        open "http://$SCADA_DASHBOARD_IP"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://$SCADA_DASHBOARD_IP"
    elif command -v start &> /dev/null; then
        start "http://$SCADA_DASHBOARD_IP"
    fi
fi

# Calculate elapsed time
ELAPSED_TIME=$((SECONDS - START_TIME))
MINUTES=$((ELAPSED_TIME / 60))
SECONDS_REMAINING=$((ELAPSED_TIME % 60))

echo ""
echo -e "${GREEN}⏱️  Total deployment time: ${MINUTES}m ${SECONDS_REMAINING}s${NC}"
echo ""
echo -e "${GREEN}🎉 Both demos are ready to use!${NC}"
echo ""
echo "Total infrastructure deployed:"
echo "  ✓ 5 Docker containers on ECS Fargate"
echo "  ✓ 11 Flink SQL queries running"
echo "  ✓ 2 Web dashboards accessible"
echo "  ✓ Shared Confluent Cloud and AWS infrastructure"
echo ""

# Clean up plan file
rm -f tfplan
