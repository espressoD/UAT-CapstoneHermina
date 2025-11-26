# Migration Guide: Deploy ke Server Baru

Panduan lengkap untuk migrasi aplikasi ke server baru dengan konfigurasi berbeda.

---

## 📋 Checklist Informasi Server Baru

Sebelum mulai, siapkan informasi berikut:

```
[ ] IP Address Server Baru: _________________
[ ] SSH Username: _________________
[ ] SSH Port (default: 22): _________________
[ ] Port Backend: _________________
[ ] Port Frontend: _________________
[ ] Domain (opsional): _________________
[ ] SSH Key Path: _________________
[ ] Apakah SSH Key pakai passphrase? Ya/Tidak
```

---

## 🔧 Skenario 1: Server Baru dengan IP Publik (Tanpa Passphrase)

### Contoh Konfigurasi Baru:
```
Server IP    : 203.0.113.50
SSH User     : ubuntu
SSH Port     : 22
Backend Port : 8080
Frontend Port: 3000
SSH Key      : Tanpa passphrase
```

---

## Step 1: Setup SSH Key untuk Server Baru

### 1.1 Generate SSH Key Baru (Tanpa Passphrase)

```bash
# Generate key tanpa passphrase (tekan Enter saat diminta passphrase)
ssh-keygen -t ed25519 -C "deploy-hermina-new-server" -f ~/.ssh/hermina-new-server

# Output:
# ~/.ssh/hermina-new-server (private key)
# ~/.ssh/hermina-new-server.pub (public key)
```

### 1.2 Copy Public Key ke Server Baru

```bash
# Metode 1: Menggunakan ssh-copy-id
ssh-copy-id -i ~/.ssh/hermina-new-server.pub ubuntu@203.0.113.50

# Metode 2: Manual copy
cat ~/.ssh/hermina-new-server.pub
# Copy output, lalu di server baru:
# mkdir -p ~/.ssh
# echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
# chmod 600 ~/.ssh/authorized_keys
# chmod 700 ~/.ssh
```

### 1.3 Test SSH Connection

```bash
# Test koneksi
ssh -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50

# Jika berhasil, logout dan lanjut ke step berikutnya
exit
```

---

## Step 2: Persiapan Server Baru

### 2.1 Install Docker

```bash
# SSH ke server baru
ssh -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user ke docker group (agar tidak perlu sudo)
sudo usermod -aG docker $USER

# Logout dan login kembali agar group berlaku
exit
ssh -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50

# Verify Docker
docker --version
docker ps
```

### 2.2 Setup Firewall

```bash
# Jika menggunakan UFW (Ubuntu/Debian)
sudo ufw status

# Allow SSH
sudo ufw allow 22/tcp

# Allow Backend Port (misal: 8080)
sudo ufw allow 8080/tcp

# Allow Frontend Port (misal: 3000)
sudo ufw allow 3000/tcp

# Allow HTTP/HTTPS jika ada reverse proxy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status numbered

# Logout dari server
exit
```

### 2.3 Setup Docker Login ke GHCR

```bash
# SSH ke server baru
ssh -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50

# Login ke GitHub Container Registry
# Buat GitHub Personal Access Token (PAT) dengan scope: read:packages
# https://github.com/settings/tokens
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Verify
docker pull hello-world

# Logout dari server
exit
```

---

## Step 3: Update Konfigurasi Lokal

### 3.1 Update File Environment

#### File: `backend/.env.production`

```bash
# Before
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://165.22.98.65:9998

# After - Update IP dan Port
NODE_ENV=production
PORT=3001  # Port internal container (biasanya tidak berubah)
CORS_ORIGIN=http://203.0.113.50:3000
# External port: 8080 (mapped to internal 3001)
```

#### File: `frontend/.env.production`

```bash
# Before
VITE_SUPABASE_URL=https://cfyfarbhtbotbmmwnhpu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://165.22.98.65:9997

# After - Update API URL dengan IP dan Port baru
VITE_SUPABASE_URL=https://cfyfarbhtbotbmmwnhpu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://203.0.113.50:8080
```

### 3.2 Update Docker Compose (Untuk Testing Local)

#### File: `docker-compose.yml`

```yaml
# Update port mappings
services:
  backend:
    # ...
    ports:
      - "8080:3001"  # External:Internal
    environment:
      - CORS_ORIGIN=http://203.0.113.50:3000
    # ...

  frontend:
    # ...
    ports:
      - "3000:80"  # External:Internal
    # ...
```

### 3.3 Update GitHub Actions Workflows

#### File: `.github/workflows/backend-ci-cd.yml`

```yaml
# Update port di bagian deploy
deploy:
  needs: build-and-push
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  
  steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.SERVER_HOST }}         # ← Update di GitHub Secrets
        username: ${{ secrets.SERVER_USERNAME }} # ← Update di GitHub Secrets
        key: ${{ secrets.SERVER_SSH_KEY }}       # ← Update di GitHub Secrets
        # HAPUS baris passphrase jika tidak ada
        # passphrase: ${{ secrets.SERVER_SSH_PASSPHRASE }}
        port: ${{ secrets.SERVER_PORT || 22 }}
        script: |
          # Login to GitHub Container Registry
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ${{ env.REGISTRY }} -u ${{ github.actor }} --password-stdin
          
          # Pull latest image
          docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          
          # Stop and remove old container
          docker stop backend || true
          docker rm backend || true
          
          # Run new container - UPDATE PORT
          docker run -d \
            --name backend \
            --restart unless-stopped \
            -p 8080:3001 \
            -e SUPABASE_URL="${{ secrets.SUPABASE_URL }}" \
            -e SUPABASE_ANON_KEY="${{ secrets.SUPABASE_ANON_KEY }}" \
            -e SUPABASE_SERVICE_ROLE_KEY="${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -e NODE_ENV=production \
            -e PORT=3001 \
            -e CORS_ORIGIN="${{ secrets.CORS_ORIGIN }}" \
            -e HASHIDS_SECRET="${{ secrets.HASHIDS_SECRET }}" \
            -e WEBHOOK_URL="${{ secrets.WEBHOOK_URL }}" \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          
          # Clean up old images
          docker image prune -af --filter "until=24h"
```

#### File: `.github/workflows/frontend-ci-cd.yml`

```yaml
# Update port di bagian deploy
deploy:
  needs: build-and-push
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  
  steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        # HAPUS baris passphrase jika tidak ada
        # passphrase: ${{ secrets.SERVER_SSH_PASSPHRASE }}
        port: ${{ secrets.SERVER_PORT || 22 }}
        script: |
          # Login to GitHub Container Registry
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ${{ env.REGISTRY }} -u ${{ github.actor }} --password-stdin
          
          # Pull latest image
          docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          
          # Stop and remove old container
          docker stop frontend || true
          docker rm frontend || true
          
          # Run new container - UPDATE PORT
          docker run -d \
            --name frontend \
            --restart unless-stopped \
            -p 3000:80 \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          
          # Clean up old images
          docker image prune -af --filter "until=24h"
```

---

## Step 4: Update GitHub Secrets

Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions

### 4.1 Secrets yang Perlu Diupdate:

#### 1. SERVER_HOST
```
203.0.113.50
```

#### 2. SERVER_USERNAME
```
ubuntu
```

#### 3. SERVER_SSH_KEY
```bash
# Get private key content
cat ~/.ssh/hermina-new-server

# Copy semua output termasuk header/footer:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

#### 4. SERVER_PORT (Optional)
```
22
```

#### 5. HAPUS SERVER_SSH_PASSPHRASE
**Jika SSH key baru tidak pakai passphrase, HAPUS secret ini!**

#### 6. CORS_ORIGIN
```
http://203.0.113.50:3000
```

#### 7. VITE_API_URL
```
http://203.0.113.50:8080
```

### 4.2 Secrets yang TIDAK Berubah:

- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ HASHIDS_SECRET
- ✅ WEBHOOK_URL (optional)
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY

---

## Step 5: Commit dan Push Changes

```bash
cd /path/to/your/project

# Check perubahan
git status
git diff

# Stage semua perubahan
git add -A

# Commit
git commit -m "Migrate to new server: 203.0.113.50 (ports: backend 8080, frontend 3000)"

# Push ke GitHub (akan trigger CI/CD)
git push
```

---

## Step 6: Monitor Deployment

### 6.1 Monitor GitHub Actions

```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

Tunggu sampai workflow selesai (3-5 menit):
- ✅ Build and push backend
- ✅ Deploy backend
- ✅ Build and push frontend
- ✅ Deploy frontend

### 6.2 Verify Containers di Server

```bash
# SSH ke server baru
ssh -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50

# Check containers
docker ps

# Should show:
# CONTAINER ID   IMAGE                                    STATUS      PORTS
# xxx            .../backend:latest                       Up          0.0.0.0:8080->3001/tcp
# yyy            .../frontend:latest                      Up          0.0.0.0:3000->80/tcp

# Check backend logs
docker logs backend

# Check frontend logs
docker logs frontend
```

### 6.3 Test Endpoints

```bash
# Test backend health
curl http://203.0.113.50:8080/health
# Expected: {"status":"ok","timestamp":"...","environment":"production","uptime":...}

# Test frontend (dari browser atau curl)
curl -I http://203.0.113.50:3000
# Expected: HTTP/1.1 200 OK
```

---

## Step 7: Update Check Deployment Script (Optional)

### File: `check-deployment.sh`

```bash
#!/bin/bash

# Script to check deployment status

echo "=== Checking Deployment Status ==="
echo ""

# Update IP dan Port
NEW_SERVER_IP="203.0.113.50"
BACKEND_PORT="8080"
FRONTEND_PORT="3000"
SSH_KEY="~/.ssh/hermina-new-server"
SSH_USER="ubuntu"

# Check GitHub Actions status
echo "1. GitHub Actions:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo ""

# Check if containers are running on server
echo "2. Containers on Server:"
ssh -i $SSH_KEY $SSH_USER@$NEW_SERVER_IP \
  "docker ps --filter name=backend --filter name=frontend --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""

# Check backend health
echo "3. Backend Health Check:"
curl -s http://$NEW_SERVER_IP:$BACKEND_PORT/health | jq '.' 2>/dev/null || echo "Backend not responding"
echo ""

# Check frontend
echo "4. Frontend Check:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://$NEW_SERVER_IP:$FRONTEND_PORT
echo ""

echo "=== Access URLs ==="
echo "Backend API:    http://$NEW_SERVER_IP:$BACKEND_PORT"
echo "Backend Health: http://$NEW_SERVER_IP:$BACKEND_PORT/health"
echo "Frontend:       http://$NEW_SERVER_IP:$FRONTEND_PORT"
```

```bash
chmod +x check-deployment.sh
./check-deployment.sh
```

---

## 📝 Checklist Migrasi

### Pre-Migration:
- [ ] Backup data penting dari server lama
- [ ] Catat semua environment variables
- [ ] Generate SSH key baru (tanpa passphrase)
- [ ] Setup server baru (Docker, firewall)
- [ ] Test SSH connection ke server baru

### Configuration Changes:
- [ ] Update `backend/.env.production` (CORS_ORIGIN)
- [ ] Update `frontend/.env.production` (VITE_API_URL)
- [ ] Update `docker-compose.yml` (ports)
- [ ] Update `.github/workflows/backend-ci-cd.yml` (port mapping)
- [ ] Update `.github/workflows/frontend-ci-cd.yml` (port mapping)
- [ ] Hapus baris `passphrase:` dari workflows jika tidak pakai passphrase

### GitHub Secrets:
- [ ] Update SERVER_HOST
- [ ] Update SERVER_USERNAME
- [ ] Update SERVER_SSH_KEY
- [ ] Update SERVER_PORT (if different)
- [ ] HAPUS SERVER_SSH_PASSPHRASE (jika tidak pakai)
- [ ] Update CORS_ORIGIN
- [ ] Update VITE_API_URL

### Deployment:
- [ ] Commit dan push changes
- [ ] Monitor GitHub Actions
- [ ] Verify containers running di server
- [ ] Test backend health endpoint
- [ ] Test frontend accessibility
- [ ] Test aplikasi end-to-end

### Post-Migration:
- [ ] Update DNS jika menggunakan domain
- [ ] Update monitoring/alerting
- [ ] Update dokumentasi
- [ ] Notify team
- [ ] Decommission server lama (setelah konfirmasi semua OK)

---

## 🚨 Troubleshooting

### Problem 1: SSH Connection Failed

```bash
# Error: Permission denied (publickey)

# Solution:
# 1. Pastikan public key sudah dicopy ke server
ssh-copy-id -i ~/.ssh/hermina-new-server.pub ubuntu@203.0.113.50

# 2. Check permissions
ls -la ~/.ssh/hermina-new-server
# Should be: -rw------- (600)
chmod 600 ~/.ssh/hermina-new-server

# 3. Test dengan verbose
ssh -v -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50
```

### Problem 2: Container Failed to Start

```bash
# SSH ke server
ssh -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50

# Check logs
docker logs backend
docker logs frontend

# Common issues:
# - Port already in use
docker ps -a | grep "8080\|3000"
# Kill conflicting containers
docker stop <container_id>

# - Image not found
docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO/backend:latest
```

### Problem 3: CORS Error

```bash
# Check CORS_ORIGIN di backend
ssh -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50
docker exec backend printenv | grep CORS

# Should match frontend URL:
# CORS_ORIGIN=http://203.0.113.50:3000

# If wrong, update GitHub Secret and redeploy
```

### Problem 4: Frontend Can't Connect to Backend

```bash
# Check VITE_API_URL
# Open browser console, should see API calls to:
# http://203.0.113.50:8080

# If wrong:
# 1. Update GitHub Secret VITE_API_URL
# 2. Rebuild frontend (push to trigger workflow)
```

### Problem 5: Firewall Blocking

```bash
# SSH ke server
ssh -i ~/.ssh/hermina-new-server ubuntu@203.0.113.50

# Check firewall
sudo ufw status

# Add rules if missing
sudo ufw allow 8080/tcp
sudo ufw allow 3000/tcp

# Reload
sudo ufw reload
```

---

## 🔄 Rollback Plan

Jika terjadi masalah, rollback ke server lama:

### Quick Rollback Steps:

1. **Revert GitHub Secrets ke nilai lama**
   - SERVER_HOST → 165.22.98.65
   - CORS_ORIGIN → http://165.22.98.65:9998
   - VITE_API_URL → http://165.22.98.65:9999

2. **Revert code changes**
   ```bash
   git revert HEAD
   git push
   ```

3. **Wait for deployment** ke server lama

4. **Verify** aplikasi berjalan di server lama

---

## 📊 Migration Summary Template

```
# Migration Report

Date: ___________
Performed by: ___________

## Old Server:
- IP: 165.22.98.65
- Backend Port: 9999
- Frontend Port: 9998
- SSH Key: ~/.ssh/digital-ocean-termius (with passphrase)

## New Server:
- IP: 203.0.113.50
- Backend Port: 8080
- Frontend Port: 3000
- SSH Key: ~/.ssh/hermina-new-server (no passphrase)

## Changes Made:
- [ ] Updated environment files
- [ ] Updated workflows
- [ ] Updated GitHub secrets
- [ ] Updated firewall rules

## Testing Results:
- [ ] Backend health: ___________
- [ ] Frontend accessible: ___________
- [ ] API connectivity: ___________
- [ ] Database connectivity: ___________

## Issues Encountered:
___________

## Downtime:
Start: ___________
End: ___________
Total: ___________

## Sign-off:
[ ] Migration successful
[ ] Old server can be decommissioned on: ___________
```

---

## 🎯 Quick Migration Command Checklist

Copy-paste command sequence untuk migrasi cepat:

```bash
# === STEP 1: Generate SSH Key ===
ssh-keygen -t ed25519 -C "deploy-hermina-new" -f ~/.ssh/hermina-new
ssh-copy-id -i ~/.ssh/hermina-new.pub ubuntu@NEW_IP

# === STEP 2: Setup Server ===
ssh -i ~/.ssh/hermina-new ubuntu@NEW_IP << 'EOF'
  # Install Docker
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  
  # Firewall
  sudo ufw allow 22/tcp
  sudo ufw allow BACKEND_PORT/tcp
  sudo ufw allow FRONTEND_PORT/tcp
  sudo ufw enable
  
  # Docker login
  echo "YOUR_PAT" | docker login ghcr.io -u USERNAME --password-stdin
EOF

# === STEP 3: Update Local Files ===
# Edit files: backend/.env.production, frontend/.env.production
# Update: .github/workflows/*.yml
# Remove passphrase lines from workflows

# === STEP 4: Commit & Push ===
git add -A
git commit -m "Migrate to NEW_IP"
git push

# === STEP 5: Verify ===
curl http://NEW_IP:BACKEND_PORT/health
curl -I http://NEW_IP:FRONTEND_PORT
```

---

## 📚 Related Documentation

- [DEPLOYMENT_PRIVATE_SERVER.md](./DEPLOYMENT_PRIVATE_SERVER.md) - Deployment ke server private
- [GITHUB_ACTIONS_SETUP.md](../GITHUB_ACTIONS_SETUP.md) - Setup GitHub Actions
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Common issues

---

## 💡 Best Practices

1. **Test di Server Staging dulu** sebelum production
2. **Backup data** sebelum migrasi
3. **Dokumentasikan** semua perubahan
4. **Monitor closely** selama 24 jam pertama
5. **Jangan hapus server lama** sampai 100% yakin server baru stabil
6. **Setup monitoring** (uptime, logs, alerts)
7. **Update DNS gradually** jika pakai load balancer

---

## 🔐 Security Checklist

- [ ] SSH key tidak pakai passphrase (untuk automation) - simpan key dengan aman
- [ ] Disable password authentication di SSH
- [ ] Setup fail2ban untuk protect SSH
- [ ] Use non-standard SSH port (optional)
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Monitor access logs: `tail -f /var/log/auth.log`
- [ ] Rotate GitHub PAT secara berkala
- [ ] Review GitHub Secrets access logs

---

**Last Updated:** 2025-11-20  
**Document Version:** 1.0  
**Maintainer:** DevOps Team
