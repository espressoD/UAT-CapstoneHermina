#!/bin/bash

# Health check script untuk monitoring
# Dapat digunakan dengan cron atau monitoring tools

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"

echo "🏥 Health Check - $(date)"
echo "================================"

# Check backend
echo "Checking backend at $BACKEND_URL/health..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")

if [ "$BACKEND_STATUS" -eq 200 ]; then
    echo "✅ Backend is healthy (HTTP $BACKEND_STATUS)"
    BACKEND_RESPONSE=$(curl -s "$BACKEND_URL/health")
    echo "   Response: $BACKEND_RESPONSE"
else
    echo "❌ Backend is unhealthy (HTTP $BACKEND_STATUS)"
    exit 1
fi

echo ""

# Check frontend
echo "Checking frontend at $FRONTEND_URL..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_STATUS" -eq 200 ]; then
    echo "✅ Frontend is healthy (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend is unhealthy (HTTP $FRONTEND_STATUS)"
    exit 1
fi

echo ""
echo "================================"
echo "✨ All services are healthy!"

exit 0
