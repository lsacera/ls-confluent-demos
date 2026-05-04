#!/bin/bash
set -e

# Start timer
START_TIME=$SECONDS

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "🏙️  Smart City Madrid Demo Deployment"
echo "========================================="
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    echo ""

    local all_good=true

    # Check AWS CLI
    if command -v aws &> /dev/null; then
        AWS_VERSION=$(aws --version 2>&1 | cut -d' ' -f1 | cut -d'/' -f2)
        echo -e "  ${GREEN}✓${NC} AWS CLI installed (version $AWS_VERSION)"
    else
        echo -e "  ${RED}✗${NC} AWS CLI not found"
        echo "     Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        all_good=false
    fi

    # Check AWS credentials
    if command -v aws &> /dev/null; then
        if aws sts get-caller-identity &> /dev/null; then
            AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
            AWS_USER=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null | cut -d'/' -f2)
            echo -e "  ${GREEN}✓${NC} AWS credentials configured (Account: $AWS_ACCOUNT, User: $AWS_USER)"
        else
            echo -e "  ${RED}✗${NC} AWS credentials not configured"
            echo "     Configure: aws configure"
            all_good=false
        fi
    fi

    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        echo -e "  ${GREEN}✓${NC} Docker installed (version $DOCKER_VERSION)"

        # Check if Docker daemon is running
        if docker info &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} Docker daemon is running"
        else
            echo -e "  ${RED}✗${NC} Docker daemon is not running"
            echo "     Start Docker Desktop or Docker service"
            all_good=false
        fi
    else
        echo -e "  ${RED}✗${NC} Docker not found"
        echo "     Install: https://docs.docker.com/get-docker/"
        all_good=false
    fi

    # Check Terraform
    if command -v terraform &> /dev/null; then
        TERRAFORM_VERSION=$(terraform version -json 2>/dev/null | jq -r '.terraform_version' 2>/dev/null || terraform version | head -n1 | cut -d'v' -f2)
        echo -e "  ${GREEN}✓${NC} Terraform installed (version $TERRAFORM_VERSION)"
    else
        echo -e "  ${RED}✗${NC} Terraform not found"
        echo "     Install: https://developer.hashicorp.com/terraform/downloads"
        all_good=false
    fi

    # Check jq (for JSON parsing)
    if command -v jq &> /dev/null; then
        JQ_VERSION=$(jq --version | cut -d'-' -f2)
        echo -e "  ${GREEN}✓${NC} jq installed (version $JQ_VERSION)"
    else
        echo -e "  ${RED}✗${NC} jq not found"
        echo "     Install: brew install jq (macOS) or apt-get install jq (Linux)"
        all_good=false
    fi

    echo ""

    if [ "$all_good" = false ]; then
        echo -e "${RED}❌ Missing prerequisites. Please install the required tools and try again.${NC}"
        echo ""
        exit 1
    fi

    echo -e "${GREEN}✅ All prerequisites met!${NC}"
    echo ""
}

# Run prerequisite check
check_prerequisites

echo "This script deploys the Smart City Madrid Demo including:"
echo "  • Traffic sensors (17 sensors across Madrid)"
echo "  • Air quality stations (12 stations)"
echo "  • EMT buses (11 buses on active routes)"
echo "  • Citizen service requests (311-style reporting)"
echo "  • Confluent Cloud (Kafka + Flink queries)"
echo ""

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

# Check which demos are currently deployed
RETAIL_DEPLOYED=$(terraform output -json retail_stack_deployed 2>/dev/null | jq -r '.' 2>/dev/null || echo "false")
SCADA_DEPLOYED=$(terraform output -json scada_stack_deployed 2>/dev/null | jq -r '.' 2>/dev/null || echo "false")

echo "   Demo stacks to deploy:"
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

if [ "$SCADA_DEPLOYED" = "true" ]; then
    echo "     ✓ SCADA Demo (CURRENTLY DEPLOYED - will be preserved)"
    ENABLE_SCADA="true"
else
    SCADA_IN_TFVARS=$(grep -E "^\s*enable_scada_demo\s*=" terraform.tfvars | grep -q "true" && echo "true" || echo "false")
    if [ "$SCADA_IN_TFVARS" = "true" ]; then
        echo "     ✓ SCADA Demo (enabled in tfvars)"
        ENABLE_SCADA="true"
    else
        echo "     ✗ SCADA Demo (not deployed)"
        ENABLE_SCADA="false"
    fi
fi

echo "     ✓ Smart City Madrid Demo (will be deployed)"

echo ""

# Build terraform plan command
PLAN_CMD="terraform plan"
PLAN_CMD="$PLAN_CMD -var=\"enable_smartcity_demo=true\""

if [ "$ENABLE_RETAIL" = "true" ]; then
    PLAN_CMD="$PLAN_CMD -var=\"enable_retail_demo=true\""
fi

if [ "$ENABLE_SCADA" = "true" ]; then
    PLAN_CMD="$PLAN_CMD -var=\"enable_scada_demo=true\""
fi

PLAN_CMD="$PLAN_CMD -out=tfplan"

eval $PLAN_CMD

echo ""
echo -e "${BLUE}3. Review the plan above and confirm deployment...${NC}"
echo ""
echo "This deployment will:"
echo "  • Build and push Smart City Docker image to AWS ECR"
echo "  • Create ECS Fargate task for:"
echo "    - Smart City Simulator (17 traffic sensors, 12 air quality stations, 11 EMT buses, citizen services)"
echo "  • Configure Kafka topics (smartcity-traffic, smartcity-airquality, smartcity-emtbus, smartcity-service, smartcity-alert)"
echo "  • Register 5 Avro schemas in Schema Registry"
echo "  • Deploy 7 Flink SQL queries for real-time urban monitoring"
echo "  • Deploy shared infrastructure (VPC, RDS, Kafka if not exists)"
echo ""
echo -e "${YELLOW}Note:${NC} Smart City demo publishes directly to Kafka (NO CDC connector used)"
echo ""
echo "Data streams:"
echo "  • Traffic sensors: M-30 ring road, main avenues, intersections, downtown areas"
echo "  • Air quality: NO2, PM2.5, PM10, O3, CO measurements with AQI calculation"
echo "  • EMT buses: Real-time position, delays, occupancy (lines 1, 3, 6, 27, 74, 146, N21)"
echo "  • Citizen services: 311-style requests (lighting, cleaning, potholes, parks, urban furniture)"
echo ""
echo "Flink queries:"
echo "  • Traffic and air quality stream processing"
echo "  • Congestion alert detection"
echo "  • District-level aggregations (5-min windows)"
echo "  • EMT bus performance tracking (5-min windows)"
echo "  • Citizen service SLA monitoring (1-hour windows)"
echo "  • Overall city health score (10-min windows)"
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

# Build Smart City dashboard frontend
echo -e "${BLUE}Building Smart City dashboard frontend...${NC}"
cd ../smartcity-web-dashboard/frontend
npm run build
cd ../../terraform

terraform apply tfplan

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Smart City Madrid Demo Deployed!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Get deployment information
echo -e "${BLUE}📊 Gathering deployment information...${NC}"
sleep 15

# Get ECS cluster name
CLUSTER_NAME=$(terraform output -json ecs_cluster_name 2>/dev/null | jq -r '.' 2>/dev/null || echo "")

# Get Dashboard URL
if [ ! -z "$CLUSTER_NAME" ]; then
    DASHBOARD_TASK=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name smartcity-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

    if [ ! -z "$DASHBOARD_TASK" ] && [ "$DASHBOARD_TASK" != "None" ]; then
        DASHBOARD_ENI=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $DASHBOARD_TASK --region us-east-1 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text 2>/dev/null || echo "")
        DASHBOARD_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $DASHBOARD_ENI --region us-east-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text 2>/dev/null || echo "")

        if [ ! -z "$DASHBOARD_IP" ] && [ "$DASHBOARD_IP" != "None" ]; then
            echo ""
            echo -e "${GREEN}📊 Smart City Madrid Dashboard URL: http://$DASHBOARD_IP${NC}"
            echo ""
            echo "Dashboard pages available:"
            echo "  • Overview - City health score and key metrics"
            echo "  • Traffic - 17 sensors (M-30, avenues, intersections, downtown)"
            echo "  • Air Quality - 12 stations with pollutant measurements"
            echo "  • EMT Buses - 11 buses on 7 routes with real-time telemetry"
            echo "  • Services - Citizen service requests (311-style)"
            echo "  • Districts - Aggregated metrics by Madrid district"
            echo "  • Architecture - Data pipeline visualization"
            echo ""
            echo "Note: It may take 1-2 minutes for the dashboard to be fully ready"
            echo ""
        fi
    fi
fi

echo -e "${BLUE}🏙️  Smart City Madrid Services (ECS Docker Containers):${NC}"
echo ""

SMARTCITY_DEPLOYED=$(terraform output -json smartcity_stack_deployed 2>/dev/null | jq -r '.' || echo "false")

if [ "$SMARTCITY_DEPLOYED" = "true" ]; then
    if [ ! -z "$CLUSTER_NAME" ]; then
        SMARTCITY_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name smartcity-simulator-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")
        DASHBOARD_SERVICE=$(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name smartcity-dashboard-service --region us-east-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")

        if [ ! -z "$SMARTCITY_SERVICE" ] && [ "$SMARTCITY_SERVICE" != "None" ]; then
            echo -e "  ${GREEN}✓${NC} Smart City Simulator (Docker) - Running"
        else
            echo -e "  ${YELLOW}⏳${NC} Smart City Simulator (Docker) - Starting..."
        fi

        if [ ! -z "$DASHBOARD_SERVICE" ] && [ "$DASHBOARD_SERVICE" != "None" ]; then
            echo -e "  ${GREEN}✓${NC} Web Dashboard (Docker) - Running (nginx + Node.js combined)"
        else
            echo -e "  ${YELLOW}⏳${NC} Web Dashboard (Docker) - Starting..."
        fi
    fi

    echo ""
    echo "Smart City Simulator Details:"
    echo "  • 17 traffic sensors (M-30, avenues, intersections, downtown)"
    echo "  • 12 air quality stations (urban core, parks, peripheral areas)"
    echo "  • 11 EMT buses (lines 1, 3, 6, 27, 74, 146, N21)"
    echo "  • Citizen service requests (ALUMBRADO_PUBLICO, LIMPIEZA_BASURA, BACHES_PAVIMENTO, etc.)"
    echo "  • Data generation every 5 seconds"
    echo "  • Publishes directly to Kafka (NO CDC - Change Data Capture)"
    echo ""
    echo "Kafka Topics created:"
    echo "  • smartcity-traffic (6 partitions)"
    echo "  • smartcity-airquality (3 partitions)"
    echo "  • smartcity-emtbus (3 partitions)"
    echo "  • smartcity-service (3 partitions)"
    echo "  • smartcity-alert (3 partitions)"
    echo ""
    echo "Flink Queries deployed:"
    echo "  • 7 Flink SQL statements processing urban data streams"
    echo "  • Traffic congestion alerts (CRITICAL/HIGH/MEDIUM)"
    echo "  • District-level aggregations (traffic + air quality)"
    echo "  • EMT bus performance metrics"
    echo "  • Citizen service SLA tracking"
    echo "  • City health score (weighted metric: 30% traffic + 30% air + 20% transport + 20% services)"
    echo ""
fi

echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo ""
echo "View Smart City Simulator logs:"
echo "  aws logs tail /ecs/smartcity-simulator-task-* --follow --region us-east-1"
echo ""
echo "Restart simulator:"
if [ ! -z "$CLUSTER_NAME" ]; then
    echo "  aws ecs update-service --cluster $CLUSTER_NAME --service smartcity-simulator-service --force-new-deployment --region us-east-1"
fi
echo ""
echo "Check Flink statements:"
echo "  confluent flink statement list --cloud aws --region us-east-1 --environment \$(terraform output -raw confluent_environment_id)"
echo ""
echo "Access PostgreSQL database:"
echo "  psql -h \$(terraform output -json | jq -r '.postgres_endpoint.value | split(\":\")[0]') -U postgres -d onlinestoredb"
echo ""
echo "Confluent Cloud Console:"
echo "  https://confluent.cloud/"
echo ""

# Open dashboard in browser
if [ ! -z "$DASHBOARD_IP" ] && [ "$DASHBOARD_IP" != "None" ]; then
    echo -e "${BLUE}🌐 Opening Smart City dashboard in browser...${NC}"
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
echo -e "${GREEN}🎉 Smart City Madrid demo is ready!${NC}"
echo ""

# Display Dashboard URL prominently at the end
if [ ! -z "$DASHBOARD_IP" ] && [ "$DASHBOARD_IP" != "None" ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Smart City Dashboard URL: ${BLUE}http://$DASHBOARD_IP${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
fi

echo ""

# Clean up plan file
rm -f tfplan
