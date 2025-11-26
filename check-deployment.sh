#!/bin/bash

# Script to check deployment status

echo "=== Checking Deployment Status ==="
echo ""

# Check GitHub Actions status
echo "1. GitHub Actions:"
echo "   https://github.com/Dapnu/Capstone-DesignH-Hermina-Input-Manual-simulasi2/actions"
echo ""

# Check if containers are running on server
echo "2. Containers on Server:"
ssh -i ~/.ssh/digital-ocean-termius root@165.22.98.65 "docker ps --filter name=backend --filter name=frontend --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""

# Check backend health
echo "3. Backend Health Check:"
curl -s http://165.22.98.65:9999/health | jq '.' 2>/dev/null || echo "Backend not responding"
echo ""

# Check frontend
echo "4. Frontend Check:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://165.22.98.65:9998
echo ""

echo "=== Access URLs ==="
echo "Backend API:  http://165.22.98.65:9999"
echo "Backend Health: http://165.22.98.65:9999/health"
echo "Frontend:     http://165.22.98.65:9998"
