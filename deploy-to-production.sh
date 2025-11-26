#!/bin/bash

# Deploy to Production Server - 165.22.98.65
# This script will deploy the application to remote server

set -e  # Exit on error

# Configuration
SERVER_HOST="165.22.98.65"
SERVER_USER="root"  # Change this to your username
SERVER_PORT="22"
APP_DIR="/root/hermina-app"  # Directory on server

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying to Production Server${NC}"
echo -e "${BLUE}================================${NC}"
echo "Server: $SERVER_USER@$SERVER_HOST"
echo "Directory: $APP_DIR"
echo ""

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo -e "${YELLOW}⚠️  No SSH key found. You may need to enter password.${NC}"
    echo -e "${YELLOW}💡 Tip: Generate SSH key with: ssh-keygen -t ed25519${NC}"
    echo ""
fi

# Test SSH connection
echo -e "${YELLOW}🔍 Testing SSH connection...${NC}"
if ssh -o ConnectTimeout=5 -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "echo '✅ SSH connection successful'" 2>/dev/null; then
    echo ""
else
    echo -e "${RED}❌ Cannot connect to server${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo "  1. Server is running"
    echo "  2. SSH credentials are correct"
    echo "  3. Firewall allows SSH connection"
    exit 1
fi

# Create .env file for production
echo -e "${YELLOW}📝 Creating production environment file...${NC}"
cat > .env.production.deploy << EOF
# Backend Environment
SUPABASE_URL=https://cfyfarbhtbotbmmwnhpu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzg2MTIsImV4cCI6MjA3ODQ1NDYxMn0.uu_hu6C6yR-WuPJ7J2JyISp9Tz0VaP--8N2WaZgq3T0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg3ODYxMiwiZXhwIjoyMDc4NDU0NjEyfQ.nDqZkO2VTg0Ja50xl5LEIo91K2ldhf-_K2n7YWFZd8Y
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://165.22.98.65:5678
HASHIDS_SECRET=AHVo1WEL9OLqBN0pET9jcYEwXwgwrVHi
WEBHOOK_URL=

# Frontend Environment
VITE_SUPABASE_URL=https://cfyfarbhtbotbmmwnhpu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzg2MTIsImV4cCI6MjA3ODQ1NDYxMn0.uu_hu6C6yR-WuPJ7J2JyISp9Tz0VaP--8N2WaZgq3T0
VITE_API_URL=http://165.22.98.65:3001
EOF
echo -e "${GREEN}✅ Environment file created${NC}"

# Prepare deployment package
echo -e "${YELLOW}📦 Preparing deployment package...${NC}"
TEMP_DIR=$(mktemp -d)
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          --exclude='dist' \
          --exclude='.env' \
          --exclude='.env.local' \
          ./ $TEMP_DIR/
cp .env.production.deploy $TEMP_DIR/.env
echo -e "${GREEN}✅ Package prepared${NC}"

# Upload to server
echo -e "${YELLOW}📤 Uploading files to server...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "mkdir -p $APP_DIR"
rsync -avz --delete \
      -e "ssh -p $SERVER_PORT" \
      $TEMP_DIR/ \
      $SERVER_USER@$SERVER_HOST:$APP_DIR/
echo -e "${GREEN}✅ Files uploaded${NC}"

# Install Docker on server if not exists
echo -e "${YELLOW}🐳 Checking Docker on server...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi
ENDSSH

# Deploy on server
echo -e "${YELLOW}🚀 Deploying application on server...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << ENDSSH
cd $APP_DIR

echo "🔨 Building Docker images..."
docker-compose build

echo "🔄 Stopping old containers..."
docker-compose down

echo "🚀 Starting new containers..."
docker-compose up -d

echo "⏳ Waiting for containers to be healthy..."
sleep 10

echo "📊 Container status:"
docker-compose ps

echo ""
echo "🏥 Checking health..."
docker logs hermina-backend --tail 5
docker logs hermina-frontend --tail 5
ENDSSH

# Cleanup
rm -rf $TEMP_DIR
rm -f .env.production.deploy

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "   Frontend: http://$SERVER_HOST:5678"
echo "   Backend:  http://$SERVER_HOST:3001"
echo ""
echo -e "${BLUE}🏥 Health Checks:${NC}"
echo "   Frontend: http://$SERVER_HOST:5678/health"
echo "   Backend:  http://$SERVER_HOST:3001/health"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "   View logs:    ssh $SERVER_USER@$SERVER_HOST 'cd $APP_DIR && docker-compose logs -f'"
echo "   Restart:      ssh $SERVER_USER@$SERVER_HOST 'cd $APP_DIR && docker-compose restart'"
echo "   Stop:         ssh $SERVER_USER@$SERVER_HOST 'cd $APP_DIR && docker-compose down'"
echo "   Status:       ssh $SERVER_USER@$SERVER_HOST 'cd $APP_DIR && docker-compose ps'"
echo ""
