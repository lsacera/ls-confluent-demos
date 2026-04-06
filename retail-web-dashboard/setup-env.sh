#!/bin/bash
# Setup environment configuration for Web Dashboard
# This script copies .env.example to .env and provides setup instructions

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Web Dashboard - Environment Setup${NC}"
echo -e "${BLUE}=================================${NC}\n"

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Keeping existing .env file${NC}"
        exit 0
    fi
fi

# Copy .env.example to .env
if [ ! -f ".env.example" ]; then
    echo -e "${YELLOW}❌ .env.example not found!${NC}"
    exit 1
fi

cp .env.example .env
echo -e "${GREEN}✓ Created .env file from .env.example${NC}\n"

# Get RDS endpoint from Terraform if possible
echo -e "${BLUE}Attempting to get PostgreSQL credentials from Terraform...${NC}"
if [ -d "../terraform" ]; then
    cd ../terraform
    RDS_ENDPOINT=$(terraform output -raw resource-ids 2>/dev/null | grep "RDS Endpoint:" | awk '{print $3}' | cut -d':' -f1)
    cd ../web-dashboard

    if [ -n "$RDS_ENDPOINT" ]; then
        echo -e "${GREEN}✓ Found RDS endpoint: $RDS_ENDPOINT${NC}"
        # Update .env with RDS endpoint
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|POSTGRES_HOST=.*|POSTGRES_HOST=$RDS_ENDPOINT|g" .env
        else
            # Linux
            sed -i "s|POSTGRES_HOST=.*|POSTGRES_HOST=$RDS_ENDPOINT|g" .env
        fi
        echo -e "${GREEN}✓ Updated POSTGRES_HOST in .env${NC}\n"
    else
        echo -e "${YELLOW}⚠️  Could not retrieve RDS endpoint from Terraform${NC}"
        echo -e "${YELLOW}   You'll need to update POSTGRES_HOST manually${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠️  Terraform directory not found${NC}"
    echo -e "${YELLOW}   You'll need to update POSTGRES_HOST manually${NC}\n"
fi

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Next Steps:${NC}"
echo -e "${BLUE}=================================${NC}\n"

echo -e "1. Edit ${GREEN}.env${NC} file with your credentials:"
echo -e "   ${YELLOW}nano .env${NC} or ${YELLOW}code .env${NC}\n"

echo -e "2. Verify PostgreSQL connection:"
echo -e "   ${YELLOW}psql -h \$POSTGRES_HOST -U postgres -d onlinestoredb${NC}\n"

echo -e "3. Start the dashboard:\n"
echo -e "   ${BLUE}Docker Compose (Recommended):${NC}"
echo -e "   ${YELLOW}docker-compose up -d${NC}\n"

echo -e "   ${BLUE}Local Development:${NC}"
echo -e "   Terminal 1: ${YELLOW}cd backend && npm install && npm run dev${NC}"
echo -e "   Terminal 2: ${YELLOW}cd frontend && npm install && npm run dev${NC}\n"

echo -e "   ${BLUE}AWS Deployment:${NC}"
echo -e "   ${YELLOW}./deploy.sh${NC}\n"

echo -e "${GREEN}Setup complete!${NC} 🎉\n"
