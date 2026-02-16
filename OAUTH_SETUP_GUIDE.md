# 🔐 Google OAuth Setup Guide for Synthient

This guide explains how to set up domain-restricted Google OAuth for internal company deployment.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Google Cloud Console Setup](#google-cloud-console-setup)
3. [Environment Configuration](#environment-configuration)
4. [Domain Management](#domain-management)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**What's Been Built:**

✅ **Backend API** (`src/server/`)
- Express server with Google OAuth2.0
- Domain-restricted authentication (trilogy.com, devfactory.com, aurea.com, vrya.com)
- JWT-based session management
- Protected API endpoints
- Security middleware (Helmet, CORS, Rate Limiting)

✅ **Authentication Service** (`src/server/auth/google-oauth.ts`)
- Google OAuth strategy with Passport.js
- Email domain validation
- Google Workspace verification (no personal Gmail)
- JWT token generation
- User database management

✅ **Configuration** (`config/auth-domains.yaml`)
- Easy domain management
- Environment variable support
- Security settings

✅ **Database Schema** (`migrations/001_create_users_table.sql`)
- Users table with OAuth info
- Agent sessions tracking
- Authentication audit logs

---

## 🔧 Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `Synthient Internal`
4. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **Internal** (for Google Workspace only)
   - This ensures only users from your org can sign in
3. Fill in the form:
   - **App name**: Synthient
   - **User support email**: your-email@trilogy.com
   - **Developer contact**: your-email@trilogy.com
4. **Scopes**: Add these scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Synthient Web App`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://synthient.yourdomain.com
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   https://synthient.yourdomain.com/auth/google/callback
   ```
7. Click "Create"
8. **Save your credentials**:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxxxxxxxxx`

---

## ⚙️ Environment Configuration

### Step 1: Create Environment File

Create `.env` file in the project root:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=synthient
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Session & JWT Secrets (generate random strings)
SESSION_SECRET=your-very-long-random-session-secret-here
JWT_SECRET=your-very-long-random-jwt-secret-here

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Step 2: Generate Secure Secrets

```bash
# Generate session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy these values to your `.env` file.

---

## 🏢 Domain Management

### Current Allowed Domains

The following domains are pre-configured in `config/auth-domains.yaml`:

- trilogy.com
- devfactory.com
- aurea.com
- vrya.com

### Adding New Domains

**Option 1: Edit YAML file**

Edit `config/auth-domains.yaml`:

```yaml
allowed_domains:
  - trilogy.com
  - devfactory.com
  - aurea.com
  - vrya.com
  - newcompany.com  # Add here
  - anothercompany.com  # Add here
```

**Option 2: Environment Variable** (for dynamic configuration)

```bash
# In .env
ALLOWED_DOMAINS=trilogy.com,devfactory.com,aurea.com,vrya.com,newcompany.com
```

Then update `google-oauth.ts` to read from env if present.

### Removing Domains

Simply remove the domain from the `allowed_domains` list and restart the server.

### Security Notes

- **Google Workspace Only**: Personal Gmail accounts are automatically rejected
- **Email Verification Required**: Only verified email addresses can authenticate
- **Domain Validation**: Users must have email addresses from allowed domains
- **Audit Logging**: All authentication attempts are logged in the database

---

## 💾 Database Setup

### Step 1: Install PostgreSQL

**macOS (with Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Docker:**
```bash
docker run -d \
  --name synthient-db \
  -e POSTGRES_DB=synthient \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:15
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE synthient;

# Create user (if needed)
CREATE USER synthient_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE synthient TO synthient_user;

# Exit
\q
```

### Step 3: Run Migrations

```bash
# Apply migration
psql -U postgres -d synthient -f migrations/001_create_users_table.sql

# Verify tables
psql -U postgres -d synthient -c "\dt"
```

You should see:
- `users` table
- `agent_sessions` table
- `auth_logs` table

---

## 🚀 Running the Application

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build TypeScript

```bash
npm run build
```

### Step 3: Start the Server

**Development mode:**
```bash
npm run dev:server
```

**Production mode:**
```bash
npm run start:server
```

You should see:
```
✅ Database connected
🚀 Synthient server running on http://localhost:3000
🔐 Allowed domains: trilogy.com, devfactory.com, aurea.com, vrya.com
```

### Step 4: Test Server Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-02-11T18:30:00.000Z"
}
```

---

## 🧪 Testing

### Test 1: Check Auth Configuration

```bash
curl http://localhost:3000/auth/config
```

Expected:
```json
{
  "allowed_domains": ["trilogy.com", "devfactory.com", "aurea.com", "vrya.com"],
  "google_oauth_enabled": true
}
```

### Test 2: Initiate OAuth Flow

1. Open browser: `http://localhost:3000/auth/google`
2. Sign in with your company Google account
3. Should redirect to frontend with token

### Test 3: Access Protected Endpoint

```bash
# Get token from OAuth callback
TOKEN="your-jwt-token-here"

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/auth/me
```

Expected:
```json
{
  "id": "123456789",
  "email": "you@trilogy.com",
  "name": "Your Name",
  "picture": "https://...",
  "domain": "trilogy.com"
}
```

### Test 4: Test Domain Restriction

Try logging in with:
- ❌ Personal Gmail (`someone@gmail.com`) → Should be rejected
- ❌ Unauthorized domain (`someone@otherdomain.com`) → Should be rejected
- ✅ Allowed domain (`someone@trilogy.com`) → Should succeed

---

## 🌐 Deployment

### Option 1: Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
heroku create synthient-internal

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set GOOGLE_CLIENT_ID=your-client-id
heroku config:set GOOGLE_CLIENT_SECRET=your-secret
heroku config:set SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set NODE_ENV=production
heroku config:set GOOGLE_CALLBACK_URL=https://synthient-internal.herokuapp.com/auth/google/callback

# Deploy
git push heroku main

# Run migrations
heroku run psql $DATABASE_URL -f migrations/001_create_users_table.sql

# Open app
heroku open
```

### Option 2: Docker

```bash
# Build image
docker build -t synthient-backend .

# Run with docker-compose
docker-compose up -d
```

### Option 3: AWS / GCP / Azure

See detailed deployment guides in `/docs/deployment/`

---

## 🐛 Troubleshooting

### Issue: "No such file or directory: website"

**Solution**: The OAuth service is looking for `config/auth-domains.yaml`. Ensure the file exists:
```bash
ls config/auth-domains.yaml
```

### Issue: "Email domain not authorized"

**Solution**: Add the domain to `config/auth-domains.yaml`:
```yaml
allowed_domains:
  - yourcompany.com
```

### Issue: "Only Google Workspace accounts are allowed"

**Solution**: This is intentional to block personal Gmail accounts. To disable:

Edit `config/auth-domains.yaml`:
```yaml
security:
  workspace_only: false  # Allow personal Gmail (not recommended)
```

### Issue: Database connection refused

**Solution**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Check database exists: `psql -l`

### Issue: OAuth redirect mismatch

**Solution**:
1. Ensure redirect URI in Google Console matches exactly:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
2. No trailing slashes!
3. Protocol (http vs https) must match

### Issue: Token expired

**Solution**: Tokens expire after 24 hours by default. Configure in `config/auth-domains.yaml`:
```yaml
jwt:
  expires_in: '7d'  # 7 days
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/google` | Initiate OAuth | No |
| GET | `/auth/google/callback` | OAuth callback | No |
| POST | `/auth/logout` | Logout user | No |
| GET | `/auth/me` | Get current user | Yes |
| GET | `/auth/config` | Get public config | No |

### Agent Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/agents/create` | Create new agent | Yes |
| GET | `/api/agents/:sessionId` | Get agent status | Yes |
| GET | `/api/agents` | List user's agents | Yes |

### Request Examples

**Create Agent:**
```bash
curl -X POST http://localhost:3000/api/agents/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A customer support chatbot",
    "output_format": "mcp",
    "language": "typescript",
    "options": {
      "include_tests": true
    }
  }'
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env` to git
- ✅ Use different secrets for dev/staging/prod
- ✅ Rotate secrets regularly (quarterly)

### 2. Database

- ✅ Use strong passwords
- ✅ Restrict network access (firewall rules)
- ✅ Regular backups
- ✅ Enable SSL/TLS connections

### 3. OAuth

- ✅ Use "Internal" consent screen for Google Workspace
- ✅ Regularly audit authorized users
- ✅ Monitor authentication logs

### 4. Rate Limiting

Current settings:
- 100 requests per 15 minutes per IP
- Adjust in `src/server/index.ts` as needed

### 5. Audit Logging

All authentication attempts are logged to `auth_logs` table:
```sql
SELECT * FROM auth_logs
WHERE success = false
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📝 Next Steps

1. ✅ **Complete Setup** - Follow this guide
2. ⬜ **Build Frontend** - Create React app for UI
3. ⬜ **Integrate CLI** - Connect backend to agent-builder CLI
4. ⬜ **Add Monitoring** - Set up logging and metrics
5. ⬜ **Deploy** - Choose deployment platform
6. ⬜ **Add Tests** - Write integration tests
7. ⬜ **Documentation** - User guides and API docs

---

## 📞 Support

**Issues?**
- Check troubleshooting section above
- Review logs: `docker logs synthient-backend`
- Check database: `psql -U postgres -d synthient`

**Questions?**
- GitHub Issues: [your-repo]/issues
- Internal Slack: #synthient-support

---

## ✅ Setup Checklist

- [ ] Google Cloud project created
- [ ] OAuth credentials obtained
- [ ] `.env` file configured
- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] Migrations applied
- [ ] Dependencies installed
- [ ] Server starts successfully
- [ ] Health check passes
- [ ] OAuth flow tested
- [ ] Domain restriction verified
- [ ] Protected endpoints tested

**Once all boxes are checked, you're ready to deploy!** 🚀

---

**Built with ❤️ for internal company use**
