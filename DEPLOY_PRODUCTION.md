# 🚀 Deploy ke Production Server (165.22.98.65)

## 📋 Prerequisites

### 1. Akses SSH ke Server
Pastikan Anda bisa SSH ke server:
```bash
ssh root@165.22.98.65
```

### 2. (Opsional) Setup SSH Key
Untuk deploy tanpa password:
```bash
# Generate SSH key (jika belum punya)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key ke server
ssh-copy-id root@165.22.98.65

# Test connection
ssh root@165.22.98.65
```

---

## 🎯 Cara Deploy

### **Opsi 1: Automated Script (Recommended)**

Script ini akan otomatis:
- Upload semua file ke server
- Install Docker (jika belum ada)
- Build images
- Start containers

```bash
# Jalankan script deployment
./deploy-to-production.sh
```

Script akan:
1. ✅ Test koneksi SSH
2. ✅ Upload files ke server
3. ✅ Install Docker & Docker Compose
4. ✅ Build Docker images
5. ✅ Start containers
6. ✅ Check health status

---

### **Opsi 2: Manual Deployment**

#### Step 1: Upload Files ke Server
```bash
# Compress project
tar -czf hermina-app.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    .

# Upload ke server
scp hermina-app.tar.gz root@165.22.98.65:/root/

# SSH ke server
ssh root@165.22.98.65
```

#### Step 2: Extract & Setup di Server
```bash
# Di server
cd /root
mkdir -p hermina-app
tar -xzf hermina-app.tar.gz -C hermina-app/
cd hermina-app
```

#### Step 3: Create Environment File
```bash
# Di server, buat file .env
cat > .env << 'EOF'
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
```

#### Step 4: Install Docker (Jika Belum Ada)
```bash
# Di server
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

#### Step 5: Build & Start
```bash
# Di server
cd /root/hermina-app

# Build images
docker-compose build

# Start containers
docker-compose up -d

# Check status
docker-compose ps
```

---

## 🔍 Verifikasi Deployment

### Check Container Status
```bash
# Di server atau dari local
ssh root@165.22.98.65 'docker ps'
```

### Test Aplikasi
```bash
# Test frontend
curl http://165.22.98.65:5678/

# Test backend
curl http://165.22.98.65:3001/health

# Output yang benar:
# Backend: {"status":"ok","timestamp":"...","environment":"production","uptime":...}
# Frontend: <html>...</html>
```

### View Logs
```bash
# Dari local
ssh root@165.22.98.65 'cd /root/hermina-app && docker-compose logs -f'

# Atau di server
docker logs hermina-backend -f
docker logs hermina-frontend -f
```

---

## 🌐 Akses Aplikasi

Setelah deployment berhasil:

- **Frontend**: http://165.22.98.65:5678
- **Backend API**: http://165.22.98.65:3001
- **Health Checks**:
  - Frontend: http://165.22.98.65:5678/health
  - Backend: http://165.22.98.65:3001/health

---

## 🔧 Management Commands

### Restart Services
```bash
ssh root@165.22.98.65 'cd /root/hermina-app && docker-compose restart'
```

### Stop Services
```bash
ssh root@165.22.98.65 'cd /root/hermina-app && docker-compose down'
```

### View Logs
```bash
ssh root@165.22.98.65 'cd /root/hermina-app && docker-compose logs -f'
```

### Update Aplikasi
```bash
# Upload perubahan
rsync -avz --exclude='node_modules' --exclude='.git' \
    ./ root@165.22.98.65:/root/hermina-app/

# Rebuild & restart
ssh root@165.22.98.65 'cd /root/hermina-app && docker-compose down && docker-compose up -d --build'
```

---

## 🔒 Security Checklist

### Firewall Configuration
```bash
# Di server
# Allow HTTP ports
ufw allow 5678/tcp
ufw allow 3001/tcp
ufw allow 22/tcp
ufw enable
```

### SSL/TLS (Recommended untuk Production)
```bash
# Install Certbot
apt install certbot

# Atau gunakan Cloudflare/reverse proxy
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check port
netstat -tlnp | grep -E '5678|3001'

# Kill process
kill -9 <PID>
```

### Container Won't Start
```bash
# Check logs
docker logs hermina-backend
docker logs hermina-frontend

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Cannot Connect to Server
```bash
# Check server is running
ping 165.22.98.65

# Check SSH
ssh -v root@165.22.98.65

# Check firewall
ssh root@165.22.98.65 'ufw status'
```

---

## 📊 Monitoring

### Quick Health Check
```bash
# Create monitoring script
cat > check-health.sh << 'EOF'
#!/bin/bash
echo "🏥 Checking application health..."
curl -s http://165.22.98.65:5678/health && echo " ✅ Frontend OK"
curl -s http://165.22.98.65:3001/health | jq . && echo "✅ Backend OK"
EOF

chmod +x check-health.sh
./check-health.sh
```

### Setup Cron for Monitoring
```bash
# Di server
crontab -e

# Add line (check every 5 minutes)
*/5 * * * * curl -s http://localhost:5678/health > /dev/null || docker-compose -f /root/hermina-app/docker-compose.yml restart
```

---

## 🔄 Rollback Procedure

Jika ada masalah setelah deployment:

```bash
# SSH ke server
ssh root@165.22.98.65

# Stop containers
cd /root/hermina-app
docker-compose down

# Restore dari backup (jika ada)
cd /root
mv hermina-app hermina-app.new
mv hermina-app.backup hermina-app

# Start old version
cd hermina-app
docker-compose up -d
```

---

## 📝 Notes

1. **HASHIDS_SECRET** sudah di-generate: `AHVo1WEL9OLqBN0pET9jcYEwXwgwrVHi`
2. **Ports**:
   - Frontend: 5678
   - Backend: 3001
3. **CORS** sudah dikonfigurasi untuk `http://165.22.98.65:5678`
4. **Environment** sudah di-set ke `production`

---

## 🆘 Need Help?

Jika ada masalah:
1. Check logs: `docker-compose logs -f`
2. Check container status: `docker ps`
3. Test connectivity: `curl http://165.22.98.65:3001/health`
4. Review TROUBLESHOOTING.md

---

**Ready to deploy? Run:**
```bash
./deploy-to-production.sh
```

Good luck! 🚀
