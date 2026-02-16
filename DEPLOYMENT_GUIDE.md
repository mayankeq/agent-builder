# Synthient Deployment Guide

Complete guide for deploying Synthient - AI Agent Builder with OAuth authentication.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Google OAuth Setup](#google-oauth-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Google Cloud Project**: For OAuth credentials
- **Anthropic API Key**: For agent creation ([get one here](https://console.anthropic.com/))

### Optional

- **PostgreSQL**: For persistent storage (currently using in-memory)
- **Redis**: For session management (currently using in-memory)
- **Nginx**: For production reverse proxy

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd agent-builder

# 2. Install dependencies
npm install
cd frontend && npm install && cd ..

# 3. Build the CLI
npm run build

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see below)

# 5. Start all services
./start-all.sh

# 6. Open in browser
open http://localhost:3001
```

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable OAuth consent screen configuration

### Step 2: Configure OAuth Consent Screen

1. Navigate to: **APIs & Services** → **OAuth consent screen**
2. **User Type**:
   - **Internal**: If deploying for your organization only (recommended)
   - **External**: If allowing anyone (must add test users)
3. **App Information**:
   - App name: `Synthient`
   - User support email: Your email
   - Developer contact: Your email
4. Click **Save and Continue** through all steps

### Step 3: Create OAuth Client ID

1. Navigate to: **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: Synthient OAuth Client
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-domain.com  (for production)
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/google/callback
   https://your-domain.com/api/auth/google/callback  (for production)
   ```
7. Click **Create**
8. **Copy** both Client ID and Client Secret

### Step 4: Add Test Users (if External)

If you selected "External" user type:
1. Go to **OAuth consent screen**
2. Scroll to **Test users**
3. Click **Add Users**
4. Add email addresses that should have access

---

## Environment Configuration

### Create .env File

Create a `.env` file in the project root:

```bash
# Database Configuration (optional, not currently used)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=synthient
DB_USER=postgres
DB_PASSWORD=postgres

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Session & JWT Secrets (generate random strings)
SESSION_SECRET=your-random-session-secret-min-32-chars
JWT_SECRET=your-random-jwt-secret-min-64-chars

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001

# Logging
LOG_LEVEL=info

# Anthropic API (for agent creation)
ANTHROPIC_API_KEY=sk-ant-api03-your-api-key-here
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### Generate Secure Secrets

```bash
# Generate SESSION_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Configure Allowed Domains

Edit `config/auth-domains.yaml`:

```yaml
allowed_domains:
  - trilogy.com
  - devfactory.com
  - aurea.com
  - vrya.com
  - your-company.com  # Add your domains here
```

---

## Running the Application

### Development Mode

#### Option 1: Use Start Script (Recommended)

```bash
./start-all.sh
```

This starts:
- OAuth backend on port 3000
- React frontend on port 3001

#### Option 2: Manual Start

Terminal 1 - Backend:
```bash
node oauth-server.js
```

Terminal 2 - Frontend:
```bash
cd frontend && npm run dev
```

### Check Status

```bash
# Check all services
./check-setup.sh

# Check backend health
curl http://localhost:3000/health

# Check frontend
curl http://localhost:3001
```

### Stop Services

```bash
# Stop all
pkill -f oauth-server.js && pkill -f vite

# Or use Ctrl+C in each terminal
```

---

## Testing

### Test OAuth Flow

1. Open: http://localhost:3001
2. Click "Continue with Google"
3. Sign in with an allowed domain account
4. Should redirect to dashboard

### Test Domain Restrictions

Try logging in with:
- ✅ **Allowed domain**: user@trilogy.com → Success
- ❌ **Personal Gmail**: user@gmail.com → Blocked
- ❌ **Other domain**: user@other.com → Blocked

### Test Agent Creation

1. Log in to dashboard
2. Fill in agent description: "A simple calculator"
3. Select output format: MCP Server
4. Select language: TypeScript
5. Click "Create Agent"
6. Monitor progress in "My Agents" tab

### Check Logs

```bash
# Backend logs
tail -f /tmp/oauth-server.log

# Frontend logs (if using start-all.sh)
tail -f /tmp/frontend.log
```

---

## Production Deployment

### Prerequisites

- Domain with SSL certificate
- Process manager (PM2, systemd)
- Reverse proxy (Nginx, Caddy)
- (Optional) PostgreSQL database
- (Optional) Redis for sessions

### Step 1: Update Environment Variables

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
```

### Step 2: Update Google OAuth

1. Add production domain to Authorized JavaScript origins
2. Add production callback URL to Authorized redirect URIs
3. Update OAuth consent screen (if needed)

### Step 3: Build Frontend

```bash
cd frontend
npm run build
```

### Step 4: Configure Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend (static files)
    location / {
        root /path/to/agent-builder/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Step 5: Start with PM2

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start oauth-server.js --name synthient-backend

# Monitor
pm2 logs synthient-backend

# Set up auto-restart
pm2 save
pm2 startup
```

### Step 6: Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Backend should not be publicly accessible
# Only Nginx should proxy to it
```

---

## Troubleshooting

### OAuth Issues

#### "redirect_uri_mismatch"

**Problem**: OAuth callback fails with URI mismatch

**Solution**:
1. Check Google Cloud Console redirect URI
2. Must match GOOGLE_CALLBACK_URL in .env exactly
3. No trailing slashes
4. http vs https must match

#### "org_internal" Error

**Problem**: "App can only be used within organization"

**Solution**:
- Change OAuth consent screen to "External"
- Add test users
- Or move GCP project to your organization

#### "Cannot GET /auth/callback"

**Problem**: Frontend route not working

**Solution**:
1. Check `frontend/vite.config.ts` - should NOT have `/auth` proxy
2. Restart frontend: `pkill -f vite && cd frontend && npm run dev`

### Agent Creation Issues

#### "ANTHROPIC_API_KEY not set"

**Problem**: Agent creation fails

**Solution**:
1. Add ANTHROPIC_API_KEY to .env
2. Restart OAuth server
3. Verify: `echo $ANTHROPIC_API_KEY`

#### Agent stuck at 0% progress

**Problem**: No progress updates

**Solution**:
1. Check backend logs: `tail -f /tmp/oauth-server.log`
2. Verify CLI built: `ls dist/index.js`
3. Test CLI: `node dist/index.js --help`

### Performance Issues

#### Slow agent creation

**Normal**: Agents take 20-35 minutes to create
- Clarification: 2-5 min
- Design: 5-10 min
- Implementation: 10-15 min
- Packaging: 2-5 min

#### High memory usage

**Solution**:
- Limit concurrent agent creations
- Use PostgreSQL instead of in-memory storage
- Increase server resources

---

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:3001

# OAuth config
curl http://localhost:3000/api/auth/config
```

### Logs

```bash
# PM2 logs
pm2 logs synthient-backend

# System logs
journalctl -u synthient -f

# Application logs
tail -f /tmp/oauth-server.log
```

### Metrics

Monitor:
- Active sessions
- Agent creation success rate
- Average creation time
- API token usage
- Failed authentication attempts

---

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] OAuth credentials secured
- [ ] JWT secrets are random and secure
- [ ] Domain allowlist configured
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] Logs monitored
- [ ] Rate limiting enabled (TODO)
- [ ] Input validation on all endpoints
- [ ] CORS properly configured

---

## Support

### Common Commands

```bash
# Check setup
./check-setup.sh

# Start everything
./start-all.sh

# Restart backend only
pkill -f oauth-server.js && node oauth-server.js &

# Restart frontend only
pkill -f vite && cd frontend && npm run dev &

# View logs
tail -f /tmp/oauth-server.log /tmp/frontend.log
```

### Documentation

- [OAuth Setup](OAUTH_SETUP.md) - Detailed OAuth configuration
- [OAuth Flow](OAUTH_FLOW.md) - How authentication works
- [Quick Reference](QUICK_REFERENCE.md) - Command cheat sheet

### Getting Help

1. Check logs first
2. Review troubleshooting section
3. Check GitHub issues
4. Contact support team

---

## Next Steps

After successful deployment:

1. Test end-to-end flow
2. Create test agents
3. Monitor performance
4. Set up backups
5. Configure monitoring/alerting
6. Plan for scale (database, queue)

---

**Congratulations! Synthient is now deployed!** 🎉
