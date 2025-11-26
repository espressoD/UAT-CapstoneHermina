#!/bin/bash

# Quick setup script untuk GitHub Actions CI/CD
# Script ini akan generate SSH key dan memberikan instruksi setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  GitHub Actions CI/CD Setup Helper        ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

SERVER_HOST="165.22.98.65"
SSH_KEY_PATH="$HOME/.ssh/github-actions-hermina"

# Step 1: Generate SSH Key
echo -e "${YELLOW}Step 1: Generate SSH Key${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  SSH key already exists at $SSH_KEY_PATH${NC}"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key..."
    else
        rm -f $SSH_KEY_PATH $SSH_KEY_PATH.pub
        ssh-keygen -t ed25519 -C "github-actions-hermina" -f $SSH_KEY_PATH -N ""
        echo -e "${GREEN}✅ New SSH key generated${NC}"
    fi
else
    ssh-keygen -t ed25519 -C "github-actions-hermina" -f $SSH_KEY_PATH -N ""
    echo -e "${GREEN}✅ SSH key generated${NC}"
fi
echo ""

# Step 2: Copy Public Key to Server
echo -e "${YELLOW}Step 2: Copy SSH Key to Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server: $SERVER_HOST"
echo ""

read -p "Copy SSH key to server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh-copy-id -i $SSH_KEY_PATH.pub root@$SERVER_HOST
    echo -e "${GREEN}✅ SSH key copied to server${NC}"
    
    # Test connection
    echo ""
    echo "Testing SSH connection..."
    if ssh -i $SSH_KEY_PATH -o ConnectTimeout=5 root@$SERVER_HOST "echo 'Connection successful'" 2>/dev/null; then
        echo -e "${GREEN}✅ SSH connection test passed${NC}"
    else
        echo -e "${RED}❌ SSH connection failed${NC}"
        exit 1
    fi
fi
echo ""

# Step 3: Display Private Key
echo -e "${YELLOW}Step 3: GitHub Secret - SERVER_SSH_KEY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Copy the private key below and add it to GitHub Secrets:"
echo ""
echo -e "${BLUE}GitHub Repository → Settings → Secrets and variables → Actions${NC}"
echo -e "${BLUE}Secret name: ${GREEN}SERVER_SSH_KEY${NC}"
echo ""
echo "═══════════════════════════════════════════"
cat $SSH_KEY_PATH
echo "═══════════════════════════════════════════"
echo ""
echo -e "${YELLOW}⚠️  Important: Copy ENTIRE content including headers!${NC}"
echo ""

# Step 4: Display All Required Secrets
echo -e "${YELLOW}Step 4: Add All GitHub Secrets${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add these secrets to GitHub:"
echo ""
echo -e "${BLUE}Server Access:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SERVER_HOST = 165.22.98.65"
echo "SERVER_USERNAME = root"
echo "SERVER_SSH_KEY = (private key above)"
echo "SERVER_PORT = 22"
echo ""

echo -e "${BLUE}Backend Environment:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
SUPABASE_URL = https://cfyfarbhtbotbmmwnhpu.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzg2MTIsImV4cCI6MjA3ODQ1NDYxMn0.uu_hu6C6yR-WuPJ7J2JyISp9Tz0VaP--8N2WaZgq3T0
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg3ODYxMiwiZXhwIjoyMDc4NDU0NjEyfQ.nDqZkO2VTg0Ja50xl5LEIo91K2ldhf-_K2n7YWFZd8Y
CORS_ORIGIN = http://165.22.98.65:9998
HASHIDS_SECRET = AHVo1WEL9OLqBN0pET9jcYEwXwgwrVHi
WEBHOOK_URL = (leave empty if not needed)
EOF
echo ""

echo -e "${BLUE}Frontend Environment:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
VITE_SUPABASE_URL = https://cfyfarbhtbotbmmwnhpu.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzg2MTIsImV4cCI6MjA3ODQ1NDYxMn0.uu_hu6C6yR-WuPJ7J2JyISp9Tz0VaP--8N2WaZgq3T0
VITE_API_URL = http://165.22.98.65:9997
EOF
echo ""

# Step 5: Prepare Server
echo -e "${YELLOW}Step 5: Prepare Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Prepare server now? (install Docker, setup firewall) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Preparing server..."
    ssh -i $SSH_KEY_PATH root@$SERVER_HOST << 'ENDSSH'
# Check Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Setup firewall
echo "🔒 Configuring firewall..."
ufw allow 22/tcp
ufw allow 3001/tcp
ufw allow 5678/tcp
ufw --force enable
echo "✅ Firewall configured"

# Show versions
echo ""
echo "📊 Server Info:"
docker --version
docker-compose --version
uname -a
ENDSSH
    echo -e "${GREEN}✅ Server prepared${NC}"
fi
echo ""

# Step 6: Final Instructions
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete! Next Steps:               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "1. ✅ Add all secrets to GitHub (shown above)"
echo "2. ✅ Commit and push to GitHub:"
echo ""
echo "   git add ."
echo "   git commit -m 'Setup CI/CD'"
echo "   git push origin main"
echo ""
echo "3. ✅ Monitor deployment at:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo ""
echo "4. ✅ Access application after deployment:"
echo "   Frontend: http://165.22.98.65:5678"
echo "   Backend:  http://165.22.98.65:3001"
echo ""
echo -e "${BLUE}📖 Full documentation: GITHUB_ACTIONS_SETUP.md${NC}"
echo ""
