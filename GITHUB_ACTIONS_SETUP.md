# 🚀 Deploy via GitHub Actions CI/CD

## 📋 Overview

Setup ini akan otomatis deploy aplikasi ke server `165.22.98.65` setiap kali Anda push ke branch `main`.

### Flow:
```
git push origin main
    ↓
GitHub Actions triggered
    ↓
Build Docker images
    ↓
Push to GitHub Container Registry (GHCR)
    ↓
SSH to server (165.22.98.65)
    ↓
Pull & deploy images
    ↓
✅ Application running
```

---

## 🔧 Setup Steps

### **Step 1: Generate SSH Key untuk GitHub Actions**

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions-hermina

# Copy public key ke server
ssh-copy-id -i ~/.ssh/github-actions-hermina.pub root@165.22.98.65

# Test connection
ssh -i ~/.ssh/github-actions-hermina root@165.22.98.65 "echo 'SSH connection successful'"

# Display private key (untuk GitHub Secret)
cat ~/.ssh/github-actions-hermina
```

**⚠️ Important:** Copy seluruh output private key termasuk header dan footer:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

---

### **Step 2: Setup GitHub Repository Secrets**

1. Buka repository di GitHub
2. Go to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secrets berikut:

#### **Server Access Secrets:**

| Secret Name | Value |
|------------|-------|
| `SERVER_HOST` | `165.22.98.65` |
| `SERVER_USERNAME` | `root` |
| `SERVER_SSH_KEY` | *(Paste private key dari step 1)* |
| `SERVER_PORT` | `22` |

#### **Backend Environment Secrets:**

| Secret Name | Value |
|------------|-------|
| `SUPABASE_URL` | `https://cfyfarbhtbotbmmwnhpu.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzg2MTIsImV4cCI6MjA3ODQ1NDYxMn0.uu_hu6C6yR-WuPJ7J2JyISp9Tz0VaP--8N2WaZgq3T0` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg3ODYxMiwiZXhwIjoyMDc4NDU0NjEyfQ.nDqZkO2VTg0Ja50xl5LEIo91K2ldhf-_K2n7YWFZd8Y` |
| `CORS_ORIGIN` | `http://165.22.98.65:5678` |
| `HASHIDS_SECRET` | `AHVo1WEL9OLqBN0pET9jcYEwXwgwrVHi` |
| `WEBHOOK_URL` | *(kosongkan jika tidak ada)* |

#### **Frontend Environment Secrets:**

| Secret Name | Value |
|------------|-------|
| `VITE_SUPABASE_URL` | `https://cfyfarbhtbotbmmwnhpu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeWZhcmJodGJvdGJtbXduaHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzg2MTIsImV4cCI6MjA3ODQ1NDYxMn0.uu_hu6C6yR-WuPJ7J2JyISp9Tz0VaP--8N2WaZgq3T0` |
| `VITE_API_URL` | `http://165.22.98.65:3001` |

---

### **Step 3: Prepare Server**

SSH ke server dan pastikan Docker sudah terinstall:

```bash
# SSH ke server
ssh root@165.22.98.65

# Install Docker (jika belum ada)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker
systemctl enable docker
systemctl start docker

# Verify
docker --version

# Allow ports in firewall
ufw allow 22/tcp
ufw allow 3001/tcp
ufw allow 5678/tcp
ufw enable
```

---

### **Step 4: Enable GitHub Container Registry**

1. Go to GitHub → **Settings** (your profile, not repo)
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Generate new token dengan scope:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`

**Note:** GitHub Actions sudah punya akses ke GHCR via `GITHUB_TOKEN`, jadi ini opsional untuk manual push/pull.

---

### **Step 5: Push ke GitHub**

```bash
# Add all files
git add .

# Commit changes
git commit -m "Setup CI/CD for production deployment to 165.22.98.65"

# Push to main branch (akan trigger deployment)
git push origin main
```

---

## 📊 Monitor Deployment

### **View GitHub Actions Workflow**

1. Go to repository → **Actions** tab
2. Click on latest workflow run
3. Monitor progress:
   - ✅ Build backend
   - ✅ Build frontend
   - ✅ Push to GHCR
   - ✅ Deploy to server

### **View Logs**

```bash
# Backend workflow
Click on "Backend CI/CD" → View logs

# Frontend workflow
Click on "Frontend CI/CD" → View logs
```

---

## 🎯 Workflow Triggers

### **Automatic Deployment**

Deploy otomatis terjadi ketika:
- ✅ Push ke branch `main`
- ✅ Ada perubahan di folder `backend/` atau `frontend/`

### **Manual Trigger**

Bisa trigger manual via:
1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow**

---

## 🔍 Verify Deployment

### **Check via GitHub Actions**

Lihat di Actions tab, pastikan semua step ✅ success.

### **Check Aplikasi**

```bash
# Test frontend
curl http://165.22.98.65:5678/

# Test backend
curl http://165.22.98.65:3001/health

# Expected backend response:
# {"status":"ok","timestamp":"...","environment":"production","uptime":...}
```

### **Check di Server**

```bash
# SSH ke server
ssh root@165.22.98.65

# Check containers
docker ps

# Expected output:
# backend container on port 3001
# frontend container on port 5678

# Check logs
docker logs backend -f
docker logs frontend -f
```

---

## 🔄 Update Flow

Setelah setup selesai, untuk update aplikasi:

```bash
# 1. Make changes di code
vim backend/server.js  # or any file

# 2. Commit changes
git add .
git commit -m "Update feature X"

# 3. Push to main
git push origin main

# 4. GitHub Actions akan otomatis:
#    - Build images
#    - Push to GHCR
#    - Deploy to server
#    - Restart containers

# 5. Monitor di Actions tab
```

---

## 🐛 Troubleshooting

### **Workflow Fails at SSH Step**

**Problem:** SSH connection failed

**Solution:**
```bash
# Test SSH connection manually
ssh -i ~/.ssh/github-actions-hermina root@165.22.98.65

# Verify server allows SSH
ssh root@165.22.98.65 "ufw status"

# Check GitHub Secret is correct
# Go to Settings → Secrets → Edit SERVER_SSH_KEY
```

### **Permission Denied (Docker)**

**Problem:** Docker permission denied on server

**Solution:**
```bash
# On server
usermod -aG docker root
systemctl restart docker
```

### **Port Already in Use**

**Problem:** Port 3001 or 5678 already in use

**Solution:**
```bash
# On server
docker stop backend frontend
docker rm backend frontend

# Or kill process
lsof -i :3001
lsof -i :5678
kill -9 <PID>
```

### **Secrets Not Set**

**Problem:** Environment variable undefined

**Solution:**
- Check all secrets are added di GitHub
- Secret names must match exactly (case-sensitive)
- Re-run workflow after adding secrets

---

## 📱 Webhook Notification (Optional)

Tambahkan notifikasi ke Slack/Discord/Email setelah deployment:

```yaml
# Add to workflow file
- name: Notify deployment success
  if: success()
  run: |
    curl -X POST ${{ secrets.WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ Deployment successful to 165.22.98.65"}'

- name: Notify deployment failure
  if: failure()
  run: |
    curl -X POST ${{ secrets.WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"❌ Deployment failed to 165.22.98.65"}'
```

---

## 🔐 Security Best Practices

✅ **Already Implemented:**
- SSH key authentication (no password)
- GitHub Secrets for sensitive data
- Environment variables not in code
- Docker container isolation
- GitHub Container Registry private

⚠️ **Recommended:**
- [ ] Setup SSL/TLS certificate
- [ ] Use reverse proxy (nginx/traefik)
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Setup monitoring & alerts

---

## 📈 Advanced: Multi-Environment

Untuk setup staging & production:

```yaml
# Add in workflow
on:
  push:
    branches:
      - main      # production
      - staging   # staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Set environment
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "DEPLOY_ENV=production" >> $GITHUB_ENV
            echo "SERVER_HOST=${{ secrets.PROD_SERVER_HOST }}" >> $GITHUB_ENV
          else
            echo "DEPLOY_ENV=staging" >> $GITHUB_ENV
            echo "SERVER_HOST=${{ secrets.STAGING_SERVER_HOST }}" >> $GITHUB_ENV
          fi
```

---

## ✅ Deployment Checklist

Before first deployment:

- [ ] SSH key generated and added to server
- [ ] All GitHub Secrets configured
- [ ] Docker installed on server
- [ ] Firewall configured (ports 22, 3001, 5678)
- [ ] Test SSH connection manually
- [ ] Repository pushed to GitHub
- [ ] Workflow files in `.github/workflows/`

---

## 🎉 Ready to Deploy!

Everything is configured. Now just:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

Then watch the magic happen in GitHub Actions tab! ✨

---

## 📞 Support

Jika ada masalah:

1. **Check GitHub Actions logs** - Detail error ada di sini
2. **Check server logs** - `ssh root@165.22.98.65 'docker logs backend'`
3. **Review TROUBLESHOOTING.md**
4. **Test manually** - SSH ke server dan test Docker commands

---

**Access URLs After Deployment:**
- Frontend: http://165.22.98.65:5678
- Backend: http://165.22.98.65:3001
- Health: http://165.22.98.65:3001/health

Good luck! 🚀
