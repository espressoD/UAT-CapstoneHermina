# Deployment ke Server Tanpa IP Publik

Jika server production berada di private network (tidak punya IP publik), ada beberapa solusi:

---

## Solusi 1: Self-Hosted GitHub Actions Runner (Recommended)

Runner berjalan di dalam network yang sama dengan server target, sehingga bisa akses private IP.

### Setup Self-Hosted Runner:

1. **Di Server/Network yang Sama dengan Target:**

```bash
# Buat directory untuk runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download runner (check latest version di GitHub)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure runner
./config.sh --url https://github.com/Dapnu/Capstone-DesignH-Hermina-Input-Manual-simulasi2 --token YOUR_TOKEN

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

2. **Update Workflow untuk Gunakan Self-Hosted Runner:**

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest  # Tetap di GitHub hosted untuk build
    # ... build steps

  deploy:
    needs: build-and-push
    runs-on: self-hosted  # ← Gunakan self-hosted runner
    steps:
      - name: Deploy to private server
        run: |
          # Bisa langsung akses private IP
          ssh user@192.168.1.100 "docker pull ... && docker run ..."
```

**Kelebihan:**
- ✅ Paling aman
- ✅ Tidak perlu expose port ke internet
- ✅ Bisa akses semua service di private network

**Kekurangan:**
- ❌ Perlu maintain runner server

---

## Solusi 2: VPN Tunnel

GitHub Actions connect ke private network via VPN.

### Setup OpenVPN di Workflow:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Connect to VPN
        uses: kota65535/github-openvpn-connect-action@v2
        with:
          config_file: ${{ secrets.OVPN_CONFIG }}
          username: ${{ secrets.VPN_USERNAME }}
          password: ${{ secrets.VPN_PASSWORD }}
      
      - name: Deploy to private server
        run: |
          # Sekarang bisa akses private IP
          ssh user@192.168.1.100 "docker pull ... && docker run ..."
```

**Setup VPN Server (WireGuard - lebih simple):**

```bash
# Di server gateway yang punya IP publik
# Install WireGuard
sudo apt update && sudo apt install wireguard -y

# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Configure /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
PrivateKey = <server-private-key>
ListenPort = 51820

[Peer]
PublicKey = <github-actions-public-key>
AllowedIPs = 10.0.0.2/32

# Start WireGuard
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0
```

**Kelebihan:**
- ✅ Secure encryption
- ✅ GitHub hosted runner tetap bisa dipakai

**Kekurangan:**
- ❌ Perlu VPN server
- ❌ Setup lebih kompleks

---

## Solusi 3: Reverse Proxy / Tunnel (Cloudflare Tunnel, Ngrok, etc)

Expose private server via secure tunnel.

### A. Cloudflare Tunnel (Gratis & Recommended)

```bash
# Install cloudflared di server private
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create hermina-server

# Configure tunnel (~/.cloudflared/config.yml)
tunnel: hermina-server
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: deploy.yourdomain.com
    service: ssh://localhost:22
  - service: http_status:404

# Route DNS
cloudflared tunnel route dns hermina-server deploy.yourdomain.com

# Run as service
sudo cloudflared service install
sudo systemctl start cloudflared
```

**Update Workflow:**
```yaml
- name: Deploy via Cloudflare Tunnel
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: deploy.yourdomain.com  # ← Via Cloudflare Tunnel
    username: ${{ secrets.SERVER_USERNAME }}
    key: ${{ secrets.SERVER_SSH_KEY }}
    script: |
      docker pull ... && docker run ...
```

### B. Ngrok (Development/Testing)

```bash
# Di server private
ngrok tcp 22  # Expose SSH port

# Output: tcp://0.tcp.ngrok.io:12345
```

**Kelebihan:**
- ✅ Setup cepat
- ✅ Tidak perlu VPN
- ✅ Free tier available (Cloudflare Tunnel unlimited)

**Kekurangan:**
- ❌ Tergantung third-party service
- ❌ Ngrok free unstable (perlu restart)

---

## Solusi 4: Bastion Host / Jump Server

GitHub Actions → Bastion (IP Publik) → Private Server

```yaml
- name: Deploy via Bastion
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.BASTION_HOST }}  # Bastion IP publik
    username: ${{ secrets.BASTION_USERNAME }}
    key: ${{ secrets.BASTION_SSH_KEY }}
    script: |
      # Dari bastion, SSH ke private server
      ssh -i ~/.ssh/private-server-key user@192.168.1.100 << 'EOF'
        docker pull ghcr.io/...
        docker run -d ...
      EOF
```

**Setup Bastion:**
```bash
# Di bastion server
# Copy SSH key untuk akses private server
ssh-copy-id user@192.168.1.100

# Configure SSH jump dalam .ssh/config
Host private-server
    HostName 192.168.1.100
    User root
    ProxyJump bastion-user@bastion-host
```

**Kelebihan:**
- ✅ Standard practice di enterprise
- ✅ Centralized access control

**Kekurangan:**
- ❌ Perlu maintain bastion server
- ❌ Single point of failure

---

## Solusi 5: Pull-Based Deployment (Polling)

Server private yang pull image sendiri (bukan GitHub Actions yang push).

### A. Watchtower (Auto-update Docker containers)

```bash
# Di server private
docker run -d \
  --name watchtower \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  --cleanup
```

Watchtower akan:
1. Cek image update setiap 5 menit
2. Pull image baru dari GHCR
3. Restart container otomatis

### B. Webhook Listener

```bash
# Install webhook listener di server
docker run -d \
  --name webhook \
  -p 9000:9000 \
  -v /path/to/hooks.json:/etc/webhook/hooks.json \
  -v /var/run/docker.sock:/var/run/docker.sock \
  almir/webhook -hooks=/etc/webhook/hooks.json -verbose

# hooks.json
[
  {
    "id": "deploy-backend",
    "execute-command": "/path/to/deploy-backend.sh",
    "command-working-directory": "/tmp"
  }
]
```

**GitHub Workflow trigger webhook:**
```yaml
- name: Trigger deployment webhook
  run: |
    curl -X POST https://internal-webhook.yourdomain.com/hooks/deploy-backend
```

**Kelebihan:**
- ✅ Server tetap private
- ✅ Automated updates

**Kekurangan:**
- ❌ Delay dalam deployment
- ❌ Perlu credential management untuk pull images

---

## Perbandingan Solusi

| Solusi | Complexity | Security | Cost | Best For |
|--------|-----------|----------|------|----------|
| Self-Hosted Runner | Medium | ⭐⭐⭐⭐⭐ | Low | Enterprise/Production |
| VPN Tunnel | High | ⭐⭐⭐⭐⭐ | Low | Existing VPN infra |
| Cloudflare Tunnel | Low | ⭐⭐⭐⭐ | Free | Quick setup |
| Bastion Host | Medium | ⭐⭐⭐⭐ | Low | Enterprise |
| Pull-Based | Low | ⭐⭐⭐ | Free | Simple projects |

---

## Rekomendasi Berdasarkan Skenario:

### 🏢 **Enterprise/Production dengan Security Policy Ketat:**
→ **Self-Hosted Runner** + **Bastion Host**

### 🚀 **Startup/Small Team, Butuh Cepat:**
→ **Cloudflare Tunnel** (gratis & reliable)

### 🧪 **Development/Testing:**
→ **Ngrok** atau **Pull-Based (Watchtower)**

### 🔐 **Sudah Ada VPN Infrastructure:**
→ **VPN Tunnel** (WireGuard/OpenVPN)

---

## Contoh: Self-Hosted Runner Setup

### 1. Setup Runner di Server/VM dalam Network yang Sama:

```bash
# SSH ke server yang bisa akses private network
ssh user@runner-server

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Setup GitHub Runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Get token dari: https://github.com/Dapnu/Capstone-DesignH-Hermina-Input-Manual-simulasi2/settings/actions/runners/new
./config.sh --url https://github.com/Dapnu/Capstone-DesignH-Hermina-Input-Manual-simulasi2 \
  --token YOUR_RUNNER_TOKEN \
  --name private-network-runner \
  --labels private-network

# Install sebagai service
sudo ./svc.sh install
sudo ./svc.sh start
```

### 2. Update Workflow:

```yaml
# .github/workflows/backend-ci-cd.yml
deploy:
  needs: build-and-push
  runs-on: [self-hosted, private-network]  # ← Gunakan runner label
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  
  steps:
    - name: Deploy to private server
      run: |
        # Bisa akses private IP langsung
        ssh -o StrictHostKeyChecking=no user@192.168.1.100 << 'EOF'
          docker login ghcr.io -u ${{ github.actor }} -p ${{ secrets.GITHUB_TOKEN }}
          docker pull ghcr.io/dapnu/capstone-designh-hermina-input-manual-simulasi2/backend:latest
          docker stop backend || true
          docker rm backend || true
          docker run -d --name backend -p 9997:3001 \
            -e SUPABASE_URL="${{ secrets.SUPABASE_URL }}" \
            ghcr.io/dapnu/capstone-designh-hermina-input-manual-simulasi2/backend:latest
        EOF
```

---

## Security Best Practices untuk Private Deployment:

1. **Jangan Expose SSH ke Internet:**
   - Gunakan VPN, tunnel, atau bastion
   - Kalau terpaksa, gunakan port non-standard + fail2ban

2. **Use SSH Key Authentication + Passphrase:**
   - Disable password authentication
   - Rotate keys regularly

3. **Network Segmentation:**
   - Deploy di private subnet
   - Only allow necessary ports

4. **Docker Registry Authentication:**
   - Use GHCR with fine-grained PAT
   - Set expiration untuk tokens

5. **Audit Logs:**
   - Monitor deployment logs
   - Setup alerts untuk failed deployments

---

## Tools untuk Private Deployment:

- **Cloudflare Tunnel:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **WireGuard:** https://www.wireguard.com/quickstart/
- **GitHub Self-Hosted Runner:** https://docs.github.com/en/actions/hosting-your-own-runners
- **Watchtower:** https://containrrr.dev/watchtower/
- **Webhook:** https://github.com/adnanh/webhook

---

## Next Steps:

Pilih solusi yang sesuai dengan infrastructure dan kebutuhan security Anda, lalu saya bisa bantu setup detailnya! 🚀
