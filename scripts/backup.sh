#!/bin/bash

# Backup script untuk database dan important files

set -e

BACKUP_DIR="./backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup at $BACKUP_DIR"
echo "================================"

# Backup environment files (without sensitive data)
echo "Backing up environment templates..."
cp .env.example "$BACKUP_DIR/" 2>/dev/null || true

# Backup docker-compose
echo "Backing up docker-compose.yml..."
cp docker-compose.yml "$BACKUP_DIR/"

# Backup nginx config
echo "Backing up nginx config..."
cp frontend/nginx.conf "$BACKUP_DIR/"

# Export database from Supabase (if needed)
# Note: This requires Supabase CLI or API access
echo "Database backup should be done via Supabase dashboard"
echo "https://supabase.com/dashboard/project/cfyfarbhtbotbmmwnhpu/settings/database"

# Backup logs
echo "Backing up logs..."
docker logs hermina-backend > "$BACKUP_DIR/backend.log" 2>&1 || true
docker logs hermina-frontend > "$BACKUP_DIR/frontend.log" 2>&1 || true

# Create archive
echo "Creating archive..."
cd backups
tar -czf "$(basename $BACKUP_DIR).tar.gz" "$(basename $BACKUP_DIR)"
rm -rf "$(basename $BACKUP_DIR)"

echo ""
echo "================================"
echo "✅ Backup completed!"
echo "📁 Archive: backups/$(basename $BACKUP_DIR).tar.gz"
echo ""
echo "To restore, extract the archive and review the files."
