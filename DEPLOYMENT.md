# Synthient Deployment Guide

This guide covers deploying Synthient for internal company use with Google OAuth domain restrictions.

## Quick Start (Local Development)

1. **Configure OAuth credentials** (see OAUTH_SETUP.md)
2. **Run:** `./start-all.sh`
3. **Open:** http://localhost:3001

## Architecture

```
┌─────────────────┐
│  Marketing Site │  Static HTML (website/index.html)
│  Port: File     │
└────────┬────────┘
         │
         │ Links to App
         ↓
┌─────────────────┐
│  React Frontend │  Vite + React + TypeScript
│  Port: 3001     │  Authentication UI
└────────┬────────┘  Agent creation interface
         │
         │ API calls
         ↓
┌─────────────────┐
│  OAuth Backend  │  Express + Passport
│  Port: 3000     │  Google OAuth 2.0
└────────┬────────┘  Domain validation
         │          JWT tokens
         │          Agent API endpoints
         ↓
┌─────────────────┐
│  Agent Builder  │  TypeScript CLI
│  (Core System)  │  Extended thinking
└─────────────────┘  Code generation
```

## Environment Variables

### Required for OAuth

```bash
# Google OAuth Credentials (get from Google Cloud Console)
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Security secrets (auto-generated, don't change)
SESSION_SECRET=<generated-secret>
JWT_SECRET=<generated-secret>

# Application URLs
PORT=3000
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:8000
NODE_ENV=development
```

### Optional

```bash
# Database (not currently used, reserved for future)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=synthient
DB_USER=postgres
DB_PASSWORD=postgres

# Logging
LOG_LEVEL=info
```

## Security Features

### 1. Domain Restrictions

Only specific company domains are allowed. Configure in `config/auth-domains.yaml`:

```yaml
allowed_domains:
  - trilogy.com
  - devfactory.com
  - aurea.com
  - vrya.com
```

### 2. Workspace-Only Accounts

Personal Gmail accounts (@gmail.com, @googlemail.com) are **blocked**.
Only Google Workspace accounts from allowed domains can authenticate.

### 3. JWT Tokens

- 24-hour expiration
- Signed with JWT_SECRET
- Contains: user ID, email, name, domain
- Used for API authentication

### 4. Email Verification

Only verified Google accounts can authenticate.

## Domain Management

### Adding New Domains

1. Edit `config/auth-domains.yaml`
2. Add domain to the list:
   ```yaml
   allowed_domains:
     - existing-domain.com
     - new-domain.com  # Add here
   ```
3. Restart OAuth server: `pkill -f oauth-server.js && node oauth-server.js`

### Removing Domains

1. Remove from `config/auth-domains.yaml`
2. Restart OAuth server

No code changes needed - config is loaded at startup.

## Production Deployment

### Prerequisites

- Node.js 18+
- Google Cloud Project with OAuth credentials
- Domain with SSL certificate
- Process manager (PM2, systemd, etc.)

### Steps

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd agent-builder
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Configure OAuth**
   - Get credentials from Google Cloud Console
   - Update .env with production URLs:
     ```bash
     GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
     FRONTEND_URL=https://your-domain.com
     NODE_ENV=production
     ```

3. **Build frontend**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

4. **Configure web server**
   - Serve frontend/dist at https://your-domain.com
   - Proxy /api/* to backend (port 3000)

   Example Nginx:
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;

       # Frontend
       location / {
           root /path/to/agent-builder/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api/ {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. **Start services with PM2**
   ```bash
   # Backend
   pm2 start oauth-server.js --name synthient-backend

   # Monitor
   pm2 logs synthient-backend
   pm2 save
   pm2 startup
   ```

6. **Update Google OAuth settings**
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://your-domain.com/api/auth/google/callback`

### Health Checks

```bash
# Backend
curl https://your-domain.com/api/auth/config

# Frontend
curl https://your-domain.com
```

## Monitoring

### Logs

```bash
# Development
tail -f /tmp/oauth-server.log
tail -f /tmp/frontend.log

# Production (PM2)
pm2 logs synthient-backend
```

### Metrics

The OAuth server logs:
- Authentication attempts
- Domain validation results
- API calls
- Errors

Monitor for:
- Failed authentication attempts (wrong domain)
- Personal Gmail account attempts
- API errors

## Troubleshooting

### "Redirect URI mismatch"

**Problem:** OAuth callback fails with URI mismatch error

**Solution:**
1. Check Google Cloud Console OAuth settings
2. Ensure redirect URI exactly matches: `http://localhost:3000/api/auth/google/callback`
3. No trailing slashes, no wildcards

### "Domain not authorized"

**Problem:** User sees "Domain X is not authorized"

**Solution:**
1. Check `config/auth-domains.yaml` includes the domain
2. Domain must exactly match (case-insensitive)
3. Restart OAuth server after config changes

### "Only Google Workspace accounts allowed"

**Problem:** User with @gmail.com can't log in

**Solution:** This is expected behavior. Only workspace accounts are allowed.
User must use their company email (e.g., @trilogy.com, not @gmail.com).

### "OAuth server not responding"

**Problem:** Frontend can't reach backend

**Solution:**
1. Check server is running: `ps aux | grep oauth-server`
2. Check port 3000 is open: `curl http://localhost:3000/health`
3. Check logs: `cat /tmp/oauth-server.log`
4. Verify CORS settings in .env (ALLOWED_ORIGINS)

### Frontend shows blank page

**Problem:** React app doesn't load

**Solution:**
1. Check frontend is running: `curl http://localhost:3001`
2. Check browser console for errors
3. Verify API_BASE_URL in frontend/.env or config
4. Check CORS headers in browser network tab

## Backup & Recovery

### Configuration

Backup these files:
- `.env` - OAuth credentials and secrets
- `config/auth-domains.yaml` - Allowed domains

### Data

Currently, the system doesn't persist data beyond:
- In-memory user sessions (lost on restart)
- Generated agent output (in `output/` directory)

For production, consider:
- Redis for session storage
- PostgreSQL for user/agent data
- S3/storage for agent outputs

## Scaling

### Current Limitations

- Single process (no clustering)
- In-memory sessions
- No database
- No file storage

### Future Improvements

1. **Add session storage** (Redis)
2. **Add database** (PostgreSQL already configured)
3. **Cluster backend** (multiple processes)
4. **Add load balancer**
5. **Separate agent worker** (queue-based processing)

## Security Checklist

- [x] OAuth domain restrictions
- [x] Workspace-only validation
- [x] JWT token authentication
- [x] CORS configuration
- [x] Email verification required
- [ ] Rate limiting (TODO)
- [ ] API request logging (partial)
- [ ] Session rotation (TODO)
- [ ] HTTPS enforcement (production)
- [ ] Security headers (helmet installed, needs config)

## Support

For issues:
1. Check logs first
2. Review OAUTH_SETUP.md
3. Check GitHub issues
4. Contact: [your-support-email]
