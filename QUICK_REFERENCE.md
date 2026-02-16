# Synthient Quick Reference Card

## 🚀 Essential Commands

```bash
# Start everything
./start-all.sh

# Check status
./check-setup.sh

# View logs
tail -f /tmp/oauth-server.log /tmp/frontend.log

# Stop everything
pkill -f oauth-server.js && pkill -f vite

# Restart OAuth server
pkill -f oauth-server.js && node oauth-server.js &
```

## 🔗 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:3000 |
| Health Check | http://localhost:3000/health |
| Auth Config | http://localhost:3000/api/auth/config |
| Marketing | website/index.html |

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | OAuth credentials (secret!) |
| `config/auth-domains.yaml` | Allowed domains |
| `oauth-server.js` | Backend server |
| `start-all.sh` | Start script |
| `check-setup.sh` | Status checker |

## 📚 Documentation

| Doc | Contents |
|-----|----------|
| `OAUTH_SETUP.md` | How to get OAuth credentials |
| `OAUTH_FLOW.md` | How authentication works |
| `DEPLOYMENT.md` | Production deployment guide |
| `SETUP_COMPLETE.md` | Setup checklist |
| `README_SYNTHIENT.md` | Main documentation |

## ⚙️ Environment Variables

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=yyy
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=<generated>
JWT_SECRET=<generated>
FRONTEND_URL=http://localhost:3001
```

## 🔐 Allowed Domains

Current allowed domains (edit `config/auth-domains.yaml`):
- trilogy.com
- devfactory.com
- aurea.com
- vrya.com

## 🛠️ Troubleshooting Quick Fixes

### OAuth credentials not configured
```bash
cat OAUTH_SETUP.md
open https://console.cloud.google.com/apis/credentials
nano .env  # Add credentials
```

### Server not running
```bash
node oauth-server.js > /tmp/oauth-server.log 2>&1 &
cd frontend && npm run dev &
```

### Check what's running
```bash
ps aux | grep -E "(oauth-server|vite)" | grep -v grep
curl http://localhost:3000/health
curl http://localhost:3001
```

### View recent logs
```bash
tail -20 /tmp/oauth-server.log
tail -20 /tmp/frontend.log
```

### Domain not working
```bash
nano config/auth-domains.yaml  # Add domain
pkill -f oauth-server.js
node oauth-server.js &
```

## 📊 API Testing

```bash
# Health check
curl http://localhost:3000/health

# Auth config
curl http://localhost:3000/api/auth/config

# Current user (requires token)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/me

# Create agent (requires token)
curl -X POST http://localhost:3000/api/agents/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"description":"A simple calculator","output_format":"mcp","language":"typescript"}'
```

## 🔄 OAuth Flow Summary

```
1. User clicks "Continue with Google"
2. Redirects to Google OAuth
3. User authenticates with Google
4. Google redirects to callback
5. Backend validates domain + workspace
6. Backend generates JWT token
7. Redirects to frontend with token
8. Frontend stores token + fetches user
9. User sees dashboard
```

## ✅ Success Indicators

- ✅ OAuth server: `curl http://localhost:3000/health` returns status "healthy"
- ✅ Frontend: `curl http://localhost:3001` returns HTML
- ✅ Credentials: No "your-client-id" in .env file
- ✅ Domains: config/auth-domains.yaml exists with your domains
- ✅ Login works: Can sign in with company email
- ✅ Personal Gmail blocked: @gmail.com shows error message

## 🔴 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "redirect_uri_mismatch" | URI not in Google Console | Add exact URI to Google Console |
| "Domain not authorized" | Domain not in config | Add to auth-domains.yaml, restart |
| "Only Workspace accounts" | Using personal Gmail | Use company email |
| "Module not found: dotenv" | Missing dependency | `npm install` |
| CORS error | Wrong origin | Check ALLOWED_ORIGINS in .env |

## 📞 Getting Help

1. Check logs: `tail -f /tmp/oauth-server.log`
2. Run status check: `./check-setup.sh`
3. Read documentation: `OAUTH_SETUP.md`
4. Check processes: `ps aux | grep oauth-server`
5. Verify credentials: `cat .env | grep GOOGLE`

## 🎯 Production Checklist

- [ ] Get production Google OAuth credentials
- [ ] Update .env with production URLs
- [ ] Configure HTTPS
- [ ] Set NODE_ENV=production
- [ ] Set up PM2 or systemd
- [ ] Configure Nginx reverse proxy
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Review security settings
- [ ] Test OAuth flow end-to-end

---

**Pro Tip:** Bookmark this page for quick reference during development!
