# GitHub Secrets to Add

Go to: https://github.com/Dapnu/Capstone-DesignH-Hermina-Input-Manual-simulasi2/settings/secrets/actions

Add these secrets one by one:

## Required Secrets

### 1. SERVER_HOST
```
165.22.98.65
```

### 2. SERVER_USERNAME
```
root
```

### 3. SERVER_SSH_KEY
Get the private key content:
```bash
cat ~/.ssh/digital-ocean-termius
```
Copy the **entire output** including the header and footer:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### 4. SERVER_PORT
```
22
```

### 5. SERVER_SSH_PASSPHRASE (OPSIONAL)
```

```

### 6. SUPABASE_URL
```
https://cfyfarbhtbotbmmwnhpu.supabase.co
```

### 7. SUPABASE_ANON_KEY
Check your backend/.env.production or backend/supabaseClient.js for this value

### 8. SUPABASE_SERVICE_ROLE_KEY
Check your backend/.env.production for this value (starts with "eyJ...")

### 9. CORS_ORIGIN (frontend)
```
http://165.22.98.65:9998 
```

### 10. HASHIDS_SECRET
```
AHVo1WEL9OLqBN0pET9jcYEwXwgwrVHi
```

### 11. WEBHOOK_URL (Optional)
Leave empty or add if you have a webhook URL for notifications

### 12. VITE_SUPABASE_URL
Same as SUPABASE_URL:
```
https://cfyfarbhtbotbmmwnhpu.supabase.co
```

### 13. VITE_SUPABASE_ANON_KEY
Same as SUPABASE_ANON_KEY

### 14. VITE_API_URL
```
http://165.22.98.65:9999
```---

## Quick Commands to Get Values

### Get SSH Private Key:
```bash
cat ~/.ssh/digital-ocean-termius
```

### Get Supabase Keys:
```bash
# Check backend environment file
cat backend/.env.production 2>/dev/null || echo "File not found"

# Or check the client file
grep -E "supabase|SUPABASE" backend/supabaseClient.js frontend/src/supabaseClient.js
```

---

## After Adding All Secrets

1. Go to **Actions** tab in GitHub
2. Click on the failed workflow
3. Click **Re-run jobs** → **Re-run failed jobs**

Or simply push a new commit:
```bash
git commit --allow-empty -m "Trigger CI/CD after adding secrets"
git push
```
