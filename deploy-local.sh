#!/bin/bash

# Deployment script untuk production menggunakan Docker
# Script ini akan build dan deploy aplikasi ke server

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_IMAGE="hermina-backend"
FRONTEND_IMAGE="hermina-frontend"
REGISTRY="ghcr.io/yourusername/yourrepo"  # Update this
SERVER_HOST="34.123.111.227"
SERVER_USER="your_username"  # Update this

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Backend Image: $BACKEND_IMAGE"
echo "Frontend Image: $FRONTEND_IMAGE"
echo "Registry: $REGISTRY"
echo "Server: $SERVER_USER@$SERVER_HOST"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"
if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed${NC}"

# Build backend
echo -e "${YELLOW}🔨 Building backend Docker image...${NC}"
docker build -t $BACKEND_IMAGE:latest ./backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend build successful${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Build frontend
echo -e "${YELLOW}🔨 Building frontend Docker image...${NC}"
docker build \
    --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
    --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}" \
    --build-arg VITE_API_URL="${VITE_API_URL}" \
    -t $FRONTEND_IMAGE:latest ./frontend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Tag images (if using registry)
if [ ! -z "$REGISTRY" ]; then
    echo -e "${YELLOW}🏷️  Tagging images...${NC}"
    docker tag $BACKEND_IMAGE:latest $REGISTRY/$BACKEND_IMAGE:latest
    docker tag $FRONTEND_IMAGE:latest $REGISTRY/$FRONTEND_IMAGE:latest
    echo -e "${GREEN}✅ Images tagged${NC}"
fi

# Push images to registry (optional, uncomment if needed)
# echo -e "${YELLOW}📤 Pushing images to registry...${NC}"
# docker push $REGISTRY/$BACKEND_IMAGE:latest
# docker push $REGISTRY/$FRONTEND_IMAGE:latest
# echo -e "${GREEN}✅ Images pushed${NC}"

# Deploy to server using docker-compose
echo -e "${YELLOW}🚀 Deploying to server...${NC}"
echo "Using docker-compose for deployment"

# Option 1: Using docker-compose (recommended for local/single server)
docker-compose down
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Check container status
echo -e "${YELLOW}📊 Checking container status...${NC}"
docker-compose ps

# Show logs
echo -e "${YELLOW}📝 Recent logs:${NC}"
echo "Backend logs:"
docker logs --tail 20 hermina-backend
echo ""
echo "Frontend logs:"
docker logs --tail 20 hermina-frontend

echo ""
echo -e "${GREEN}✨ Deployment completed!${NC}"
echo -e "${GREEN}🌐 Application should be accessible at:${NC}"
echo "   Backend:  http://$SERVER_HOST:3001"
echo "   Frontend: http://$SERVER_HOST"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "   View logs:    docker-compose logs -f"
echo "   Restart:      docker-compose restart"
echo "   Stop:         docker-compose down"
echo "   Status:       docker-compose ps"
