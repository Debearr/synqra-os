# 🌐 RAILWAY PORTS & DOMAINS REFERENCE

**Purpose**: Prevent port conflicts and ensure correct domain configuration

---

## 📍 PORT ASSIGNMENTS

| Service | Port | Env Var | Health Check |
|---------|------|---------|--------------|
| **Synqra MVP** | 3000 | `PORT=3000` | `/api/health` |
| **NØID Dashboard** | 3001 | `PORT=3001` | `/api/health` |
| **NØID Digital Cards** | 3002 | `PORT=3002` | `/api/health` |

**Important**: All services must bind to `process.env.PORT` in code.

---

## 🌍 DOMAIN CONFIGURATION

### Production Domains

| Service | Custom Domain | Railway Domain |
|---------|---------------|----------------|
| **Synqra MVP** | synqra.app | synqra-mvp.up.railway.app |
| **NØID Dashboard** | noid.app | noid-dashboard.up.railway.app |
| **NØID Digital Cards** | cards.noidlabs.com | noid-cards.up.railway.app |

### Staging Domains

| Service | Domain |
|---------|--------|
| **Synqra MVP** | staging.synqra.app |
| **NØID Dashboard** | staging.noid.app |
| **NØID Digital Cards** | staging-cards.noidlabs.com |

---

## ⚙️ RAILWAY SERVICE SETTINGS

### How to Configure

**Path**: Railway Dashboard → [Service] → Settings → Networking

1. **Public Networking**: Enabled
2. **Port**: Match the service port (3000, 3001, 3002)
3. **Custom Domain**: Add your domain
4. **Generate Domain**: Enable Railway subdomain

---

## 🔍 HEALTH CHECK URLS

### Production

```
https://synqra.app/api/health
https://noid.app/api/health
https://cards.noidlabs.com/api/health
```

### Staging

```
https://staging.synqra.app/api/health
https://staging.noid.app/api/health
https://staging-cards.noidlabs.com/api/health
```

### Local Development

```
http://localhost:3000/api/health
http://localhost:3001/api/health
http://localhost:3002/api/health
```

---

## 🚨 TROUBLESHOOTING

### Port Already in Use

**Symptom**: Service fails to start with "EADDRINUSE" error

**Fix**:
1. Check if another process is using the port: `lsof -i :3000`
2. Kill the process: `kill -9 [PID]`
3. Restart service

### Service Not Reachable

**Symptom**: Health check returns 404 or connection timeout

**Check**:
1. Service is running: Check Railway logs
2. Port is correct: Match Railway settings to code
3. Domain is configured: Check DNS settings
4. Health endpoint exists: Test locally first

### Custom Domain Not Working

**Symptom**: Domain shows Railway's "Application Error" page

**Check**:
1. DNS records are correct (CNAME to Railway domain)
2. Custom domain is added in Railway UI
3. SSL certificate is provisioned (automatic, may take 5-10 minutes)
4. Service is deployed and running

---

**Version**: 1.0  
**Last Updated**: 2025-11-15  
**Owner**: NØID Labs
