#!/bin/bash
# Build and push all retail demo Docker images to ECR
# This script is called by Terraform after creating configuration files

set -e

# Set PATH to include common locations for docker and other commands
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Building and pushing Docker images to ECR...${NC}"
echo ""

# Get parameters
AWS_REGION="${1:-us-east-1}"
PAYMENT_REPO="$2"
DBFEEDER_REPO="$3"
DASHBOARD_REPO="$4"

if [ -z "$PAYMENT_REPO" ] || [ -z "$DBFEEDER_REPO" ] || [ -z "$DASHBOARD_REPO" ]; then
    echo -e "${RED}Error: Missing repository names${NC}"
    echo "Usage: $0 <aws-region> <payment-repo> <dbfeeder-repo> <dashboard-repo>"
    exit 1
fi

# Get AWS account and login to ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "ECR Registry: $ECR_REGISTRY"
echo "Payment Repo: $PAYMENT_REPO"
echo "DBFeeder Repo: $DBFEEDER_REPO"
echo "Dashboard Repo: $DASHBOARD_REPO"
echo ""

# Login to ECR
echo -e "${BLUE}Authenticating with ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY >/dev/null 2>&1
echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Function to build and push
build_and_push() {
    local NAME=$1
    local BUILD_PATH=$2
    local REPO=$3

    echo -e "${BLUE}Building $NAME...${NC}"
    echo "  Path: $BUILD_PATH"
    echo "  Target: $REPO"

    cd "$BUILD_PATH" || exit 1

    # Build with visible output for debugging
    echo -e "${BLUE}  Running docker build...${NC}"
    if docker build --platform linux/amd64 -t "$NAME:latest" . > /tmp/build-$NAME.log 2>&1; then
        echo -e "${GREEN}  ✓ Build successful${NC}"
    else
        echo -e "${RED}  ✗ Build failed${NC}"
        echo "Last 20 lines of build log:"
        tail -20 /tmp/build-$NAME.log
        exit 1
    fi

    docker tag "$NAME:latest" "${ECR_REGISTRY}/${REPO}:latest"

    echo -e "${BLUE}  Pushing to ECR...${NC}"
    if docker push "${ECR_REGISTRY}/${REPO}:latest" > /tmp/push-$NAME.log 2>&1; then
        echo -e "${GREEN}  ✓ Pushed to ECR${NC}"
    else
        echo -e "${RED}  ✗ Push failed${NC}"
        echo "Last 20 lines of push log:"
        tail -20 /tmp/push-$NAME.log
        exit 1
    fi

    cd - >/dev/null
    echo ""
}

# Build all images
BASE_DIR="/Users/lsanchezacera/ls-confluent-demos"

build_and_push "payment-app" "$BASE_DIR/code/payments-app" "$PAYMENT_REPO"
build_and_push "dbfeeder-app" "$BASE_DIR/code/postgresql-data-feeder" "$DBFEEDER_REPO"
build_and_push "retail-dashboard" "$BASE_DIR/retail-web-dashboard" "$DASHBOARD_REPO"

echo -e "${GREEN}✅ All images built and pushed successfully!${NC}"
