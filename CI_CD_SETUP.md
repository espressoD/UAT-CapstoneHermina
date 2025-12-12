# CI/CD Setup Guide

## 📋 Overview

Proyek ini menggunakan GitHub Actions untuk CI/CD dengan Docker containers untuk backend dan frontend.

## 🏗️ Struktur Docker

### Backend
- **Base Image**: `node:20-alpine`
- **Port**: 3001
- **Health Check**: Endpoint `/health`

### Frontend
- **Build Stage**: `node:20-alpine`
- **Runtime Stage**: `nginx:alpine`
- **Port**: 80
- **Health Check**: Root endpoint `/`

## 🔧 Setup GitHub Actions

### 1. GitHub Secrets Configuration

Buka repository Settings > Secrets and variables > Actions, lalu tambahkan secrets berikut:

#### Server Deployment Secrets
```
SERVER_HOST=34.123.111.227
SERVER_USERNAME=your_server_username
SERVER_SSH_KEY=your_private_ssh_key
SERVER_PORT=22
```

#### Backend Environment Secrets
```
SUPABASE_URL=https://cfyfarbhtbotbmmwnhpu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzg2MTIsImV4cCI6MjA3ODQ1NDYxMn0.uu_hu6C6yR-WuPJ7J2JyISp9Tz0VaP--8N2WaZgq3T0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg3ODYxMiwiZXhwIjoyMDc4NDU0NjEyfQ.nDqZkO2VTg0Ja50xl5LEIo91K2ldhf-_K2n7YWFZd8Y
CORS_ORIGIN=http://34.123.111.227:3001
HASHIDS_SECRET=generate-32-char-random-secret-here
WEBHOOK_URL=
```

#### Frontend Environment Secrets
```
VITE_SUPABASE_URL=https://cfyfarbhtbotbmmwnhpu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzg2MTIsImV4cCI6MjA3ODQ1NDYxMn0.uu_hu6C6yR-WuPJ7J2JyISp9Tz0VaP--8N2WaZgq3T0
VITE_API_URL=http://34.123.111.227:3001
```

### 2. Generate SSH Key untuk Deployment

Pada server lokal:
```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Copy public key ke server
ssh-copy-id -i ~/.ssh/github-actions.pub user@34.123.111.227

# Copy private key untuk GitHub Secret
cat ~/.ssh/github-actions
```

Paste isi private key ke GitHub Secret `SERVER_SSH_KEY`.

### 3. Enable GitHub Container Registry

GitHub Container Registry (GHCR) sudah terintegrasi dengan GitHub Actions. Pastikan:
- Repository visibility sesuai kebutuhan (public/private)
- Package permissions sudah benar di Settings > Packages

## 🚀 Workflow CI/CD

### Backend Workflow (`backend-ci-cd.yml`)

**Trigger:**
- Push ke branch `main` atau `develop` dengan perubahan di folder `backend/`
- Pull request ke branch `main` atau `develop`

**Steps:**
1. Build Docker image
2. Push ke GitHub Container Registry
3. Deploy ke server (hanya untuk push ke `main`)

**Container Registry:** `ghcr.io/<username>/<repo>/backend:latest`

### Frontend Workflow (`frontend-ci-cd.yml`)

**Trigger:**
- Push ke branch `main` atau `develop` dengan perubahan di folder `frontend/`
- Pull request ke branch `main` atau `develop`

**Steps:**
1. Build Docker image dengan environment variables
2. Push ke GitHub Container Registry
3. Deploy ke server (hanya untuk push ke `main`)

**Container Registry:** `ghcr.io/<username>/<repo>/frontend:latest`

## 🐳 Local Development dengan Docker

### Build & Run menggunakan Docker Compose

```bash
# Copy environment variables
cp .env.example .env
# Edit .env dengan nilai yang sesuai

# Build dan run semua services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Build Individual Services

#### Backend
```bash
cd backend
docker build -t hermina-backend .
docker run -p 3001:3001 --env-file ../.env hermina-backend
```

#### Frontend
```bash
cd frontend
docker build \
  --build-arg VITE_SUPABASE_URL=https://cfyfarbhtbotbmmwnhpu.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your_key \
  --build-arg VITE_API_URL=http://34.123.111.227:3001 \
  -t hermina-frontend .
docker run -p 80:80 hermina-frontend
```

## 🔒 Security Best Practices

1. **Jangan commit secrets** ke repository
2. **Rotate secrets** secara berkala
3. **Gunakan environment-specific secrets** untuk dev/staging/prod
4. **Review GitHub Actions logs** untuk memastikan tidak ada secrets yang ter-expose
5. **Limit SSH key permissions** hanya untuk deployment user

## 🏥 Health Checks

### Backend Health Check
```bash
curl http://34.123.111.227:3001/health
```

### Frontend Health Check
```bash
curl http://34.123.111.227/
```

## 📊 Monitoring Deployment

### View GitHub Actions Runs
1. Buka repository di GitHub
2. Klik tab "Actions"
3. Pilih workflow yang ingin dilihat
4. View logs untuk debugging

### Server-side Monitoring
```bash
# Check running containers
docker ps

# View backend logs
docker logs -f backend

# View frontend logs
docker logs -f frontend

# Check resource usage
docker stats
```

## 🔄 Manual Deployment

Jika perlu deploy manual tanpa GitHub Actions:

```bash
# SSH ke server
ssh user@34.123.111.227

# Pull dan run backend
docker pull ghcr.io/<username>/<repo>/backend:latest
docker stop backend || true
docker rm backend || true
docker run -d --name backend --restart unless-stopped \
  -p 3001:3001 \
  -e SUPABASE_URL="..." \
  -e SUPABASE_ANON_KEY="..." \
  -e SUPABASE_SERVICE_ROLE_KEY="..." \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e CORS_ORIGIN="..." \
  -e HASHIDS_SECRET="..." \
  ghcr.io/<username>/<repo>/backend:latest

# Pull dan run frontend
docker pull ghcr.io/<username>/<repo>/frontend:latest
docker stop frontend || true
docker rm frontend || true
docker run -d --name frontend --restart unless-stopped \
  -p 80:80 \
  ghcr.io/<username>/<repo>/frontend:latest
```

## 🐛 Troubleshooting

### Build Fails
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Check build logs untuk error messages

### Deployment Fails
- Verify SSH credentials
- Check server has Docker installed
- Ensure ports 80 and 3001 are available
- Verify all environment variables are set

### Container Not Starting
- Check logs: `docker logs <container-name>`
- Verify environment variables
- Check port conflicts
- Verify health check endpoints

### Image Pull Fails
- Verify GitHub token permissions
- Check container registry visibility settings
- Ensure server can access ghcr.io

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
