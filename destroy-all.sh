#!/bin/bash
# Don't use set -e to avoid unexpected exits on terraform output errors
# We'll handle errors explicitly where needed

# Start timer
START_TIME=$SECONDS

echo "========================================="
echo "🗑️  Demo Destruction Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to terraform directory
cd terraform

# Check which demos are currently deployed
echo -e "${BLUE}Checking deployed resources...${NC}"
echo ""

RETAIL_DEPLOYED=$(terraform output -json retail_stack_deployed 2>/dev/null | jq -r '.' 2>/dev/null || echo "unknown")
SCADA_DEPLOYED=$(terraform output -json scada_stack_deployed 2>/dev/null | jq -r '.' 2>/dev/null || echo "unknown")

echo "Currently deployed demo stacks:"
if [ "$RETAIL_DEPLOYED" = "true" ]; then
    echo -e "  ${GREEN}✓${NC} Retail Demo (DB Feeder + Payments App)"
elif [ "$RETAIL_DEPLOYED" = "false" ]; then
    echo "  ✗ Retail Demo (not deployed)"
fi

if [ "$SCADA_DEPLOYED" = "true" ]; then
    echo -e "  ${GREEN}✓${NC} SCADA Demo (Energy Grid)"
elif [ "$SCADA_DEPLOYED" = "false" ]; then
    echo "  ✗ SCADA Demo (not deployed)"
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will destroy ALL resources:${NC}"
echo ""
echo "Shared Infrastructure:"
echo "   • Confluent Cloud (Environment, Kafka Cluster, Flink Pool)"
echo "   • AWS VPC, Subnets, Security Groups"
echo "   • RDS PostgreSQL database"
echo "   • ECS Cluster"
echo ""

if [ "$RETAIL_DEPLOYED" = "true" ]; then
    echo "Retail Demo Resources:"
    echo "   • DB Feeder App (ECS service + ECR repository)"
    echo "   • Payments App (ECS service + ECR repository)"
    echo "   • Kafka topics: payments, error-payments"
    echo "   • Avro schemas: payments-value"
    echo "   • CloudWatch Log Groups"
    echo ""
fi

if [ "$SCADA_DEPLOYED" = "true" ]; then
    echo "SCADA Demo Resources:"
    echo "   • SCADA Simulator (ECS service + ECR repository)"
    echo "   • Kafka topics: scada-telemetry, scada-alerts"
    echo "   • Avro schemas (SCADA-specific)"
    echo "   • CloudWatch Log Groups"
    echo ""
fi

echo "Common Resources:"
echo "   • Dashboard (ECS service)"
echo "   • Flink queries and statements"
echo ""
echo -e "${RED}All data will be PERMANENTLY deleted!${NC}"
echo ""

# Check if Flink statements need to be stopped first
echo -e "${YELLOW}Note: Flink statements should be stopped before destroying resources.${NC}"
echo "This prevents orphaned Flink statements that can cause issues."
echo ""
read -p "Do you want to stop Flink statements first? (recommended: yes/no): " stop_flink

if [ "$stop_flink" = "yes" ]; then
    echo ""
    echo -e "${BLUE}Planning Flink statement stop...${NC}"
    echo ""

    # Check if Flink modules exist in state before trying to stop them
    RETAIL_FLINK_EXISTS=$(terraform state list 2>/dev/null | grep -c "module.retail_flink_queries" || echo "0")
    SCADA_FLINK_EXISTS=$(terraform state list 2>/dev/null | grep -c "module.scada_flink_queries" || echo "0")

    if [ "$RETAIL_FLINK_EXISTS" -eq "0" ] && [ "$SCADA_FLINK_EXISTS" -eq "0" ]; then
        echo -e "${YELLOW}No Flink modules found in Terraform state. Skipping Flink statement stop.${NC}"
        echo ""
    else
        # Build target list based on existing modules
        TARGETS=""
        if [ "$RETAIL_FLINK_EXISTS" -gt "0" ]; then
            TARGETS="$TARGETS -target=module.retail_flink_queries"
        fi
        if [ "$SCADA_FLINK_EXISTS" -gt "0" ]; then
            TARGETS="$TARGETS -target=module.scada_flink_queries"
        fi

        # Show plan first so user can review
        echo "Running: terraform plan -var=\"stop_flink_statements=true\" $TARGETS"
        echo ""
        terraform plan -var="stop_flink_statements=true" $TARGETS

        echo ""
        echo -e "${YELLOW}The above plan will ONLY stop Flink statements, no resources will be destroyed.${NC}"
        echo ""
        read -p "Proceed with stopping Flink statements? (yes/no): " confirm_stop

        if [ "$confirm_stop" = "yes" ]; then
            terraform apply -var="stop_flink_statements=true" $TARGETS -auto-approve

            echo ""
            echo -e "${GREEN}✓ Flink statements stopped${NC}"
            echo ""
            sleep 5
        else
            echo ""
            echo -e "${YELLOW}Skipping Flink statement stop. Proceeding to destruction confirmation...${NC}"
            echo ""
        fi
    fi
fi

echo ""
read -p "Are you ABSOLUTELY SURE you want to destroy all resources? (type 'destroy' to confirm): " confirmation

if [ "$confirmation" != "destroy" ]; then
    echo ""
    echo -e "${BLUE}Destruction cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Destroying all infrastructure...${NC}"
echo "This may take 10-15 minutes..."
echo ""

terraform destroy -auto-approve

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ All resources destroyed!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Resources removed:"
if [ "$RETAIL_DEPLOYED" = "true" ]; then
    echo "  ✓ Retail Demo (DB Feeder, Payments App)"
fi
if [ "$SCADA_DEPLOYED" = "true" ]; then
    echo "  ✓ SCADA Demo"
fi
echo "  ✓ Confluent Cloud resources"
echo "  ✓ AWS infrastructure (VPC, RDS, ECS)"
echo "  ✓ Dashboard"
echo ""
echo "You will no longer be charged for these services."
echo ""

# Calculate elapsed time
ELAPSED_TIME=$((SECONDS - START_TIME))
MINUTES=$((ELAPSED_TIME / 60))
SECONDS_REMAINING=$((ELAPSED_TIME % 60))

echo -e "${GREEN}⏱️  Total destruction time: ${MINUTES}m ${SECONDS_REMAINING}s${NC}"
echo ""
echo -e "${BLUE}💡 Tip: To deploy again, run ./deploy-retail-demo.sh or ./deploy-scada-demo.sh or ./deploy-all.sh${NC}"
echo ""
