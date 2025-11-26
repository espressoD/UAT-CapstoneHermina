# 🔧 Troubleshooting Guide

## Common Issues and Solutions

---

## 1. Docker Build Issues

### Issue: "Cannot connect to Docker daemon"
```
Error: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**
```bash
# Start Docker service
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker ps
```

### Issue: "no space left on device"
```
Error: failed to copy files: no space left on device
```

**Solution:**
```bash
# Clean up Docker
docker system prune -a --volumes -f

# Check disk space
df -h

# Remove old images
docker image prune -a
```

### Issue: Build fails with dependency errors

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Rebuild with no cache
docker-compose build --no-cache
```

---

## 2. Container Runtime Issues

### Issue: Container exits immediately

**Solution:**
```bash
# Check logs
docker logs hermina-backend
docker logs hermina-frontend

# Check container status
docker ps -a

# Common causes:
# - Missing environment variables
# - Port already in use
# - Syntax error in code
```

### Issue: Port already in use
```
Error: bind: address already in use
```

**Solution:**
```bash
# Find process using port
sudo lsof -i :3001
sudo lsof -i :80

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "8080:80"  # Use 8080 instead of 80
```

### Issue: Container restarts continuously

**Solution:**
```bash
# Check restart policy
docker inspect hermina-backend | grep -A 5 RestartPolicy

# Check logs for errors
docker logs --tail 100 hermina-backend

# Disable restart temporarily
docker update --restart=no hermina-backend

# Fix the issue, then re-enable
docker update --restart=unless-stopped hermina-backend
```

---

## 3. Network Issues

### Issue: Frontend cannot connect to Backend

**Symptoms:**
- Frontend shows connection errors
- API calls fail with CORS errors

**Solution:**
```bash
# Check if containers are on same network
docker network inspect capstone-designh-hermina-input-manual-simulasi2_hermina-network

# Check backend is running
curl http://localhost:3001/health

# Check CORS configuration in backend
docker exec hermina-backend cat /app/server.js | grep CORS

# Verify VITE_API_URL in frontend build
docker exec hermina-frontend env | grep VITE
```

### Issue: Cannot access from external IP

**Solution:**
```bash
# Check if Docker is binding to all interfaces
docker ps
# Should show 0.0.0.0:80 not 127.0.0.1:80

# Check firewall
sudo ufw status
sudo ufw allow 80
sudo ufw allow 3001

# For cloud servers, check security groups
```

---

## 4. GitHub Actions Issues

### Issue: Workflow not triggering

**Checklist:**
- [ ] Workflow file in `.github/workflows/`
- [ ] YAML syntax is valid
- [ ] Branch name matches trigger condition
- [ ] Path filter includes changed files

**Solution:**
```bash
# Validate YAML syntax
yamllint .github/workflows/backend-ci-cd.yml

# Force trigger with empty commit
git commit --allow-empty -m "Trigger CI"
git push
```

### Issue: "Permission denied" on deploy step

**Solution:**
1. Verify SSH key format:
```bash
# Key should include headers
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

2. Test SSH connection manually:
```bash
ssh -i ~/.ssh/github-actions user@34.123.111.227
```

3. Check server's authorized_keys:
```bash
cat ~/.ssh/authorized_keys
# Should contain public key
```

### Issue: "Secret not found"

**Solution:**
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Verify all required secrets exist:
   - SERVER_HOST
   - SERVER_USERNAME
   - SERVER_SSH_KEY
   - All environment variables

3. Check secret names match workflow file exactly (case-sensitive)

### Issue: Docker login fails in workflow

**Solution:**
```yaml
# Ensure GITHUB_TOKEN has packages permissions
permissions:
  contents: read
  packages: write  # Required for GHCR
```

---

## 5. Environment Variable Issues

### Issue: Environment variables not loading

**Backend:**
```bash
# Check if .env file exists
ls -la backend/.env*

# Check if variables are loaded
docker exec hermina-backend env

# Verify in code
docker exec hermina-backend node -e "console.log(process.env.SUPABASE_URL)"
```

**Frontend:**
```bash
# Remember: Frontend vars must be set at BUILD time
# Check build args were passed
docker history hermina-frontend | grep VITE

# Variables are baked into the build
# To change them, must rebuild
docker-compose build --no-cache frontend
```

### Issue: "undefined" in environment variables

**Solution:**
```bash
# For backend (runtime)
# Edit docker-compose.yml or .env file
vim docker-compose.yml

# For frontend (build time)
# Must rebuild with new build args
docker-compose build --no-cache frontend \
  --build-arg VITE_API_URL=http://new-url:3001
```

---

## 6. Health Check Issues

### Issue: Health check failing

**Backend:**
```bash
# Test health endpoint
curl -v http://localhost:3001/health

# Check if server is listening
docker exec hermina-backend netstat -tlnp

# Check logs
docker logs hermina-backend | grep -i error
```

**Frontend:**
```bash
# Test frontend
curl -I http://localhost/

# Check nginx status
docker exec hermina-frontend nginx -t

# Check nginx logs
docker exec hermina-frontend cat /var/log/nginx/error.log
```

### Issue: Container marked unhealthy

**Solution:**
```bash
# Check health check command
docker inspect hermina-backend | grep -A 10 Healthcheck

# Increase timeout in docker-compose.yml
healthcheck:
  timeout: 10s      # Increase from 3s
  interval: 60s     # Check less frequently
  retries: 5        # More retries
```

---

## 7. Database Connection Issues

### Issue: Cannot connect to Supabase

**Solution:**
```bash
# Verify credentials
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test connection
curl $SUPABASE_URL/rest/v1/ \
  -H "apikey: $SUPABASE_ANON_KEY"

# Check if IP is allowed in Supabase settings
# Supabase Dashboard → Settings → API → Restrictions
```

### Issue: "Invalid API key"

**Solution:**
1. Verify key in Supabase Dashboard
2. Check for extra spaces or newlines
3. Regenerate key if necessary
4. Update in all locations:
   - Backend .env
   - Frontend .env
   - GitHub Secrets
   - docker-compose.yml

---

## 8. Performance Issues

### Issue: Slow build times

**Solution:**
```bash
# Use build cache
docker-compose build

# Multi-stage builds are already optimized
# But you can improve further:

# 1. Use .dockerignore
echo "node_modules" >> backend/.dockerignore
echo "*.log" >> backend/.dockerignore

# 2. Order Dockerfile efficiently (done)
# COPY package*.json first, then npm install
# COPY source code last

# 3. Use BuildKit
export DOCKER_BUILDKIT=1
docker-compose build
```

### Issue: High memory usage

**Solution:**
```bash
# Check container resources
docker stats

# Limit container resources
# In docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

# Restart containers
docker-compose up -d
```

---

## 9. Deployment Issues

### Issue: Old version still running after deploy

**Solution:**
```bash
# Pull latest images
docker-compose pull

# Force recreate containers
docker-compose up -d --force-recreate

# Or completely restart
docker-compose down
docker-compose up -d
```

### Issue: Changes not reflecting

**Frontend:**
```bash
# Frontend changes require rebuild
docker-compose build frontend
docker-compose up -d frontend

# Check build timestamp
docker inspect hermina-frontend | grep Created
```

**Backend:**
```bash
# Backend is not watched, restart needed
docker-compose restart backend

# Or rebuild if code changed
docker-compose build backend
docker-compose up -d backend
```

---

## 10. Logging and Debugging

### Increase log verbosity

**Backend:**
```javascript
// In server.js
const isProduction = false; // Force dev logging
```

**Docker:**
```bash
# Enable debug mode
export DOCKER_DEBUG=1

# View detailed build output
docker-compose build --progress=plain
```

### Collect logs for support

```bash
# Create log bundle
mkdir -p debug-logs
docker logs hermina-backend > debug-logs/backend.log 2>&1
docker logs hermina-frontend > debug-logs/frontend.log 2>&1
docker ps -a > debug-logs/containers.txt
docker images > debug-logs/images.txt
docker network ls > debug-logs/networks.txt

# Archive
tar -czf debug-logs.tar.gz debug-logs/
```

---

## Emergency Recovery Procedures

### Complete Reset

```bash
# CAUTION: This will destroy all containers and data

# 1. Stop everything
docker-compose down -v

# 2. Remove all containers
docker rm -f $(docker ps -aq)

# 3. Remove all images
docker rmi -f $(docker images -q)

# 4. Clean system
docker system prune -a --volumes -f

# 5. Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Rollback to Previous Version

**GitHub Actions:**
```bash
# SSH to server
ssh user@34.123.111.227

# Pull specific version
docker pull ghcr.io/username/repo/backend:previous-sha
docker pull ghcr.io/username/repo/frontend:previous-sha

# Update and restart
docker tag ghcr.io/username/repo/backend:previous-sha hermina-backend
docker-compose up -d
```

**Manual:**
```bash
# Revert code
git log --oneline
git checkout <previous-commit>

# Rebuild
docker-compose build
docker-compose up -d
```

---

## Debug Checklist

When something goes wrong, check in order:

1. ✅ **Containers Running?**
   ```bash
   docker ps
   ```

2. ✅ **Check Logs**
   ```bash
   docker-compose logs -f
   ```

3. ✅ **Environment Variables Set?**
   ```bash
   docker exec hermina-backend env
   ```

4. ✅ **Ports Available?**
   ```bash
   netstat -tlnp | grep -E '80|3001'
   ```

5. ✅ **Network Connectivity?**
   ```bash
   docker network inspect <network-name>
   ```

6. ✅ **Health Checks Passing?**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost/
   ```

7. ✅ **Disk Space Available?**
   ```bash
   df -h
   docker system df
   ```

8. ✅ **Recent Changes?**
   ```bash
   git log -1
   ```

---

## Getting Help

If issues persist:

1. Collect debug information:
   ```bash
   ./scripts/backup.sh
   ```

2. Check documentation:
   - CI_CD_SETUP.md
   - QUICK_START.md
   - ARCHITECTURE.md

3. Review logs thoroughly

4. Search for similar issues in:
   - Docker documentation
   - GitHub Actions documentation
   - Project issue tracker

---

**Last Updated:** November 20, 2025
