#!/bin/bash
set -e

# Start timer
START_TIME=$SECONDS

echo "========================================="
echo "⚡ SCADA Demo Deployment Script"
echo "========================================="
echo ""
echo "This script deploys the SCADA Energy Grid Demo including:"
echo "  • SCADA Simulator (18 sensors) - ECS Docker container"
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

echo ""
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
echo ""
echo "NOTE: Docker images will be built automatically by Terraform using build-and-push-scada-images.sh"
echo "      This avoids the Docker provider timeout issue and shows build progress"
echo ""

# Check which demos are currently deployed (check Terraform state, not just tfvars)
RETAIL_DEPLOYED=$(terraform output -json retail_stack_deployed 2>/dev/null | jq -r '.' 2>/dev/null || echo "false")
SMARTCITY_DEPLOYED=$(terraform output -json smartcity_stack_deployed 2>/dev/null | jq -r '.' 2>/dev/null || echo "false")

echo "   Demo stacks to deploy:"

# Check Retail
if [ "$RETAIL_DEPLOYED" = "true" ]; then
    echo "     ✓ Retail Demo (CURRENTLY DEPLOYED - will be preserved)"
    ENABLE_RETAIL="true"
else
    RETAIL_IN_TFVARS=$(grep -E "^\s*enable_retail_demo\s*=" terraform.tfvars | grep -q "true" && echo "true" || echo "false")
    if [ "$RETAIL_IN_TFVARS" = "true" ]; then
        echo "     ✓ Retail Demo (enabled in tfvars)"
        ENABLE_RETAIL="true"
    else
        echo "     ✗ Retail Demo (not deployed)"
        ENABLE_RETAIL="false"
    fi
fi

echo "     ✓ SCADA Demo (will be deployed)"

# Check SmartCity
if [ "$SMARTCITY_DEPLOYED" = "true" ]; then
    echo "     ✓ Smart City Demo (CURRENTLY DEPLOYED - will be preserved)"
    ENABLE_SMARTCITY="true"
else
    SMARTCITY_IN_TFVARS=$(grep -E "^\s*enable_smartcity_demo\s*=" terraform.tfvars | grep -q "true" && echo "true" || echo "false")
    if [ "$SMARTCITY_IN_TFVARS" = "true" ]; then
        echo "     ✓ Smart City Demo (enabled in tfvars)"
        ENABLE_SMARTCITY="true"
    else
        echo "     ✗ Smart City Demo (not deployed)"
        ENABLE_SMARTCITY="false"
    fi
fi

echo ""

# Build terraform plan command
PLAN_CMD="terraform plan -var=\"enable_scada_demo=true\""

if [ "$ENABLE_RETAIL" = "true" ]; then
    PLAN_CMD="$PLAN_CMD -var=\"enable_retail_demo=true\""
fi

if [ "$ENABLE_SMARTCITY" = "true" ]; then
    PLAN_CMD="$PLAN_CMD -var=\"enable_smartcity_demo=true\""
fi

PLAN_CMD="$PLAN_CMD -out=tfplan"

eval $PLAN_CMD

echo ""
echo -e "${BLUE}3. Review the plan above and confirm deployment...${NC}"
echo ""
echo "This deployment will:"
echo "  • Build and push Docker images to AWS ECR"
echo "  • Create ECS Fargate tasks for:"
echo "    - SCADA Simulator (18 virtual sensors)"
echo "    - Web Dashboard (nginx + Node.js combined container)"
echo "  • Configure Kafka topics (scada-telemetry, scada-alerts)"
echo "  • Register Avro schemas in Schema Registry"
echo "  • Deploy 5 Flink SQL queries for real-time anomaly detection"
echo "  • Deploy shared infrastructure (VPC, RDS, Kafka if not exists)"
echo ""
echo "Docker containers deployed on ECS:"
echo "  • 2 containers (SCADA Simulator, Dashboard)"
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
echo -e "${GREEN}✅ SCADA Demo Deployed Successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Get deployment information
echo -e "${BLUE}📊 Gathering deployment information...${NC}"
sleep 10

# Get ECS cluster info
CLUSTER_NAME=$(terraform output -json scada_dashboard_ecs_info 2>/dev/null | jq -r '.cluster' 2>/dev/null || echo "")

# Get Dashboard URL
if [ ! -z "$CLUSTER_NAME" ]; then
    DASHBOARD_TASK=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name scada-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

    if [ ! -z "$DASHBOARD_TASK" ] && [ "$DASHBOARD_TASK" != "None" ]; then
        DASHBOARD_ENI=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $DASHBOARD_TASK --region us-east-1 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text 2>/dev/null || echo "")
        DASHBOARD_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $DASHBOARD_ENI --region us-east-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text 2>/dev/null || echo "")

        if [ ! -z "$DASHBOARD_IP" ] && [ "$DASHBOARD_IP" != "None" ]; then
            echo ""
            echo -e "${GREEN}📊 SCADA Dashboard URL: http://$DASHBOARD_IP${NC}"
            echo ""
            echo "Dashboard Architecture:"
            echo "  • ECS Fargate container running on port 80"
            echo "  • Combined nginx (frontend) + Node.js (backend) using supervisord"
            echo "  • React frontend built from scada-web-dashboard/"
            echo "  • Express API backend querying PostgreSQL"
            echo ""
            echo "Dashboard features available:"
            echo "  • Overview Dashboard - Grid health KPIs and anomaly trends"
            echo "  • Anomalies View - Real-time alerts with severity filters"
            echo "  • Grid Health - ERCOT, WECC, EASTERN grid statistics"
            echo "  • Sensor Health - 18 sensor status monitoring"
            echo "  • Geographic View - USA map with sensor locations"
            echo "  • Architecture Flow - Live data pipeline visualization"
            echo ""
            echo "Note: It may take 1-2 minutes for the dashboard to be fully ready"
            echo ""
        fi
    fi
fi

echo -e "${BLUE}⚡ SCADA Demo Services (ECS Docker Containers):${NC}"
echo ""

# Check if SCADA stack outputs are available
SCADA_DEPLOYED=$(terraform output -json scada_stack_deployed 2>/dev/null | jq -r '.' || echo "false")

if [ "$SCADA_DEPLOYED" = "true" ]; then
    # Get ECS service information
    SCADA_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name scada-simulator-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")
    DASHBOARD_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name scada-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

    if [ ! -z "$SCADA_SERVICE" ] && [ "$SCADA_SERVICE" != "None" ]; then
        echo -e "  ${GREEN}✓${NC} SCADA Simulator (Docker) - Running (18 sensors, telemetry every 5s)"
    else
        echo -e "  ${YELLOW}⏳${NC} SCADA Simulator (Docker) - Starting..."
    fi

    if [ ! -z "$DASHBOARD_SERVICE" ] && [ "$DASHBOARD_SERVICE" != "None" ]; then
        echo -e "  ${GREEN}✓${NC} Web Dashboard (Docker) - Running (nginx + Node.js combined)"
    else
        echo -e "  ${YELLOW}⏳${NC} Web Dashboard (Docker) - Starting..."
    fi

    echo ""
    echo "SCADA Simulator Details:"
    echo "  • 18 virtual sensors across USA grid regions (ERCOT, WECC, EASTERN)"
    echo "  • Measurement types: VOLTAGE, CURRENT, FREQUENCY, POWER, PRESSURE, FLOW, TEMPERATURE"
    echo "  • Publishing to 'scada-telemetry' topic"
    echo ""
    echo "Kafka Topics created:"
    echo "  • scada-telemetry (6 partitions)"
    echo "  • scada-alerts (3 partitions)"
    echo "  • error-scada-telemetry (DLQ)"
    echo ""
    echo "Flink Queries deployed:"
    echo "  • 5 Flink SQL statements for real-time anomaly detection"
    echo ""
fi

echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo ""
echo "View SCADA Dashboard logs (Docker container):"
echo "  aws logs tail \$(terraform output -json scada_dashboard_ecs_info | jq -r '.log_group') --follow --region us-east-1"
echo ""
echo "Restart Dashboard container:"
echo "  aws ecs update-service --cluster $CLUSTER_NAME --service scada-dashboard-service --force-new-deployment --region us-east-1"
echo ""
echo "View SCADA Simulator logs:"
echo "  aws logs tail /ecs/scada-simulator-task-* --follow --region us-east-1"
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
    echo -e "${BLUE}🌐 Opening SCADA dashboard in browser...${NC}"
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
echo ""

# Calculate elapsed time
ELAPSED_TIME=$((SECONDS - START_TIME))
MINUTES=$((ELAPSED_TIME / 60))
SECONDS_REMAINING=$((ELAPSED_TIME % 60))

echo ""
echo -e "${GREEN}⏱️  Total deployment time: ${MINUTES}m ${SECONDS_REMAINING}s${NC}"
echo ""
echo -e "${GREEN}🎉 SCADA Energy Grid demo is ready to use!${NC}"
echo ""

# Display Dashboard URL prominently at the end
if [ ! -z "$DASHBOARD_IP" ] && [ "$DASHBOARD_IP" != "None" ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 SCADA Dashboard URL: ${BLUE}http://$DASHBOARD_IP${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
fi

# Clean up plan file
rm -f tfplan
