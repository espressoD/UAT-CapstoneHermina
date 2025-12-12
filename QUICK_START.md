# 🚀 Quick Start Guide - CI/CD Deployment

## 📦 Apa yang Sudah Dibuat?

### 1. **Dockerfile**
- ✅ `backend/Dockerfile` - Backend dengan Node.js 20 Alpine
- ✅ `frontend/Dockerfile` - Frontend multi-stage build dengan Nginx
- ✅ `.dockerignore` files untuk optimize build

### 2. **GitHub Actions Workflows**
- ✅ `.github/workflows/backend-ci-cd.yml` - Auto deploy backend
- ✅ `.github/workflows/frontend-ci-cd.yml` - Auto deploy frontend

### 3. **Docker Compose**
- ✅ `docker-compose.yml` - Orchestrate kedua services
- ✅ `deploy-local.sh` - Local deployment script

### 4. **Environment Files**
- ✅ `backend/.env.production`
- ✅ `frontend/.env.production`
- ✅ `.env.example`

### 5. **Documentation**
- ✅ `CI_CD_SETUP.md` - Complete setup guide
- ✅ `QUICK_START.md` - This file

---

## ⚡ Quick Commands

### Local Development dengan Docker

```bash
# 1. Setup environment variables
cp .env.example .env
# Edit .env dengan nilai yang sesuai

# 2. Build dan jalankan semua services
docker-compose up -d

# 3. Lihat logs
docker-compose logs -f

# 4. Stop services
docker-compose down
```

### Local Deployment Script

```bash
# Load environment variables dan deploy
source backend/.env.production
source frontend/.env.production
./deploy-local.sh
```

### Manual Docker Build

```bash
# Backend
cd backend
docker build -t hermina-backend .
docker run -p 3001:3001 --env-file .env.production hermina-backend

# Frontend
cd frontend
docker build \
  --build-arg VITE_SUPABASE_URL="https://cfyfarbhtbotbmmwnhpu.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="your_key" \
  --build-arg VITE_API_URL="http://34.123.111.227:3001" \
  -t hermina-frontend .
docker run -p 80:80 hermina-frontend
```

---

## 🔐 Setup GitHub Actions (CI/CD)

### Step 1: Add GitHub Secrets

Buka repository → Settings → Secrets and variables → Actions → New repository secret

#### Required Secrets:

**Server Deployment:**
```
SERVER_HOST = 34.123.111.227
SERVER_USERNAME = your_username
SERVER_SSH_KEY = (paste your private SSH key)
SERVER_PORT = 22
```

**Backend Environment:**
```
SUPABASE_URL = https://cfyfarbhtbotbmmwnhpu.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CORS_ORIGIN = http://34.123.111.227:3001
HASHIDS_SECRET = generate-32-char-random-secret-here
WEBHOOK_URL = (optional)
```

**Frontend Environment:**
```
VITE_SUPABASE_URL = https://cfyfarbhtbotbmmwnhpu.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL = http://34.123.111.227:3001
```

### Step 2: Setup SSH Key

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Copy public key ke server
ssh-copy-id -i ~/.ssh/github-actions.pub user@34.123.111.227

# Copy private key untuk GitHub Secret
cat ~/.ssh/github-actions
# Paste ke GitHub Secret: SERVER_SSH_KEY
```

### Step 3: Install Docker di Server

```bash
# SSH ke server
ssh user@34.123.111.227

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify
docker --version
```

### Step 4: Push ke GitHub

```bash
git add .
git commit -m "Add CI/CD with Docker and GitHub Actions"
git push origin main
```

GitHub Actions akan otomatis:
1. Build Docker images
2. Push ke GitHub Container Registry
3. Deploy ke server (jika push ke main branch)

---

## 📊 Monitoring & Debugging

### Check Container Status
```bash
docker ps
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker logs -f hermina-backend
docker logs -f hermina-frontend
```

### Check Health
```bash
# Backend health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost/
```

### Resource Usage
```bash
docker stats
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific
docker restart hermina-backend
docker restart hermina-frontend
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove unused images
docker image prune -a

# Remove all unused data
docker system prune -a
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3001
sudo lsof -i :80

# Kill process
sudo kill -9 <PID>
```

### Container Won't Start
```bash
# Check logs
docker logs hermina-backend
docker logs hermina-frontend

# Check if port is available
netstat -tuln | grep 3001
netstat -tuln | grep 80
```

### Environment Variables Not Working
```bash
# Verify env in running container
docker exec hermina-backend env
docker exec hermina-frontend env
```

### Build Fails
```bash
# Build with no cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build --progress=plain -t test ./backend
```

### GitHub Actions Fails
1. Check Actions tab di GitHub repository
2. View workflow logs
3. Verify all secrets are set correctly
4. Check SSH key permissions

---

## 🔄 Update/Redeploy

### Method 1: Git Push (Recommended)
```bash
# Make changes
git add .
git commit -m "Update application"
git push origin main
# GitHub Actions will auto deploy
```

### Method 2: Manual Deploy
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Method 3: Pull from Registry
```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d
```

---

## 📈 Production Checklist

- [ ] Generate secure HASHIDS_SECRET (32+ characters)
- [ ] Update CORS_ORIGIN ke domain production
- [ ] Setup proper domain dengan SSL/TLS
- [ ] Configure firewall rules
- [ ] Setup log aggregation
- [ ] Configure backup strategy
- [ ] Setup monitoring & alerts
- [ ] Test health check endpoints
- [ ] Verify GitHub Actions secrets
- [ ] Test rollback procedure
- [ ] Document deployment process

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages)

---

## 🆘 Need Help?

1. Check `CI_CD_SETUP.md` for detailed documentation
2. Review Docker logs: `docker-compose logs -f`
3. Check GitHub Actions logs in repository
4. Verify all environment variables are set correctly

---

**Last Updated:** November 2025  
**Maintained by:** Development Team
