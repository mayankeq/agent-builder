# Quick Start Guide

Get up and running with Agent-Builder in 10 minutes.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [First Agent Creation (CLI)](#first-agent-creation-cli)
- [Web Application Setup](#web-application-setup)
- [Your First Agent (Web App)](#your-first-agent-web-app)
- [Common Issues](#common-issues)

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: 15+ (for web application)
- **Anthropic API Key**: Get from [Anthropic Console](https://console.anthropic.com)
- **SSO Provider Account**: Google, Azure AD, or Okta (for web application)

---

## Installation

### CLI Tool Only

```bash
# Install globally
npm install -g @agent-builder/cli

# Or run without installing
npx @agent-builder/cli --version

# Verify installation
agent-builder --version
```

### Full Application (CLI + Web Server)

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/agent-builder.git
cd agent-builder

# Install dependencies
npm install

# Build TypeScript
npm run build
```

---

## First Agent Creation (CLI)

### 1. Set Your API Key

```bash
export ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 2. Create Your First Agent

```bash
# Interactive mode (recommended for first-time)
agent-builder create "A web scraper that extracts product prices"

# Direct mode with flags
agent-builder create \
  "A web scraper that extracts product prices" \
  --output mcp \
  --language typescript \
  --output-dir ./my-agents
```

### 3. Follow the Prompts

The CLI will ask clarifying questions:

```
? What type of websites will this scraper target? (e-commerce, news, blogs)
> e-commerce sites like Amazon, eBay

? Should it handle pagination?
> Yes, crawl multiple pages

? What output format do you prefer? (JSON, CSV, Database)
> JSON file
```

### 4. Wait for Generation

The tool will go through 5 phases:
- **Clarification** (2-3 min): Gathering requirements
- **Design** (5-10 min): Creating architecture with extended thinking
- **Implementation** (10-15 min): Generating code, tests, docs in parallel
- **Packaging** (2-5 min): Creating distributable artifacts
- **Learning** (1 min): Storing patterns for future use

Total time: 20-35 minutes

### 5. Find Your Generated Agent

```bash
cd output/<session-id>
ls -la
```

You'll see:
```
agent-artifacts/
├── src/          # Source code
├── tests/        # Test files
├── package.json  # Dependencies
├── tsconfig.json # TypeScript config (if applicable)
├── README.md     # Usage documentation
└── skill.yaml    # Skill manifest (for Claude Code skills)
```

### 6. Test Your Agent

```bash
cd agent-artifacts

# Install dependencies
npm install  # or pip install -r requirements.txt for Python

# Run tests
npm test     # or pytest for Python

# Start the agent (for MCP/CLI)
npm start
```

---

## Web Application Setup

### 1. Setup PostgreSQL Database

```bash
# Create database
createdb agent_builder

# Or using psql
psql postgres -c "CREATE DATABASE agent_builder;"
```

### 2. Run Database Migrations

```bash
# Apply schema
psql agent_builder < migrations/001_initial_schema.sql

# Verify tables
psql agent_builder -c "\dt"
```

You should see:
```
              List of relations
 Schema |      Name       | Type  |  Owner
--------+-----------------+-------+----------
 public | audit_log       | table | postgres
 public | sessions        | table | postgres
 public | user_api_keys   | table | postgres
 public | user_sessions   | table | postgres
 public | users           | table | postgres
```

### 3. Generate Security Keys

```bash
# Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"

# Generate encryption key
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output for the next step.

### 4. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env  # or vim, code, etc.
```

**Required settings**:
```bash
# Database
DB_HOST=localhost
DB_NAME=agent_builder
DB_USER=postgres
DB_PASSWORD=your-secure-password

# Security (paste generated keys from step 3)
JWT_SECRET=your-generated-jwt-secret
ENCRYPTION_KEY=your-generated-encryption-key

# At least one SSO provider (example: Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3 (for artifact storage)
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

### 5. Setup SSO Provider (Google Example)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Google+ API**
4. Create **OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret to `.env`

### 6. Setup AWS S3 Bucket

```bash
# Create bucket (using AWS CLI)
aws s3 mb s3://agent-builder-artifacts

# Or use AWS Console:
# 1. Go to S3 console
# 2. Create bucket
# 3. Enable versioning
# 4. Set appropriate IAM permissions
```

### 7. Start the Server

```bash
# Production mode
npm run build
npm run start:server

# Development mode (with auto-reload)
npm run dev:server
```

Server starts on `http://localhost:3000`

### 8. Verify Setup

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}

# Check available SSO providers
curl http://localhost:3000/api/auth/providers

# Expected response:
{
  "providers": ["google"],
  "count": 1
}
```

---

## Your First Agent (Web App)

### 1. Login via SSO

Open browser and navigate to:
```
http://localhost:3000/api/auth/google
```

This will redirect to Google for authentication, then back to your app with a JWT token.

### 2. Add Your Anthropic API Key

```bash
# Using curl (replace $TOKEN with your JWT from login)
curl -X POST http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sk-ant-your-api-key"}'

# Response:
{
  "success": true,
  "message": "API key stored successfully"
}
```

### 3. Validate API Key

```bash
curl -X POST http://localhost:3000/api/api-keys/validate \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "valid": true,
  "message": "API key is valid",
  "lastValidated": "2026-02-06T10:35:00.000Z"
}
```

### 4. Create an Agent

```bash
curl -X POST http://localhost:3000/api/agents/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A web scraper that extracts product prices from e-commerce sites",
    "outputType": "mcp",
    "language": "typescript"
  }'

# Response (202 Accepted):
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Agent creation started"
}
```

### 5. Monitor Progress via WebSocket

```javascript
// JavaScript example
const token = 'your-jwt-token';
const sessionId = '550e8400-e29b-41d4-a716-446655440000';

const ws = new WebSocket(`ws://localhost:3000?token=${token}&sessionId=${sessionId}`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Update:', update);

  if (update.type === 'progress') {
    console.log(`Phase: ${update.data.phase}, Progress: ${update.data.progress * 100}%`);
  }

  if (update.type === 'completed') {
    console.log('Agent creation completed!');
  }
};
```

### 6. Check Session Status

```bash
# Get session details
curl http://localhost:3000/api/sessions/$SESSION_ID \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "currentPhase": "learning",
    "progress": 1.0,
    "outputType": "mcp",
    "language": "typescript",
    "completedAt": "2026-02-06T11:05:00.000Z"
  }
}
```

### 7. Download Artifacts

```bash
# Download as ZIP
curl -o artifacts.zip \
  http://localhost:3000/api/downloads/$SESSION_ID/artifacts \
  -H "Authorization: Bearer $TOKEN"

# Or get presigned URL for direct S3 access
curl http://localhost:3000/api/downloads/$SESSION_ID/artifacts/url \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "url": "https://s3.amazonaws.com/...",
  "expiresIn": 3600,
  "expiresAt": "2026-02-06T12:05:00.000Z"
}
```

---

## Common Issues

### Database Connection Failed

**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@15

# Start PostgreSQL (Ubuntu/Debian)
sudo systemctl start postgresql

# Test connection
psql -U postgres -d agent_builder -c "SELECT 1"
```

### SSO Login Redirects to Error Page

**Symptom**: "Redirect URI mismatch" or "Invalid client"

**Solution**:
1. Verify redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/google/callback`
2. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
3. Ensure no trailing slashes in URLs
4. Restart server after changing `.env`

### API Key Validation Fails

**Symptom**: "API key is invalid"

**Solutions**:
1. Verify key starts with `sk-ant-`
2. Check key hasn't been revoked in [Anthropic Console](https://console.anthropic.com)
3. Test key directly:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{
       "model": "claude-3-haiku-20240307",
       "max_tokens": 10,
       "messages": [{"role": "user", "content": "Hi"}]
     }'
   ```

### WebSocket Connection Fails

**Symptom**: WebSocket immediately closes or never connects

**Solutions**:
1. Ensure token is passed in query string: `?token=xxx&sessionId=yyy`
2. Check CORS settings allow WebSocket upgrade
3. Verify firewall allows WebSocket connections
4. Test connection:
   ```javascript
   // Should log "connected" message
   ws.onopen = () => console.log('Connected');
   ws.onerror = (err) => console.error('Error:', err);
   ```

### Agent Creation Takes Too Long

**Symptom**: Agent creation stuck or taking over 40 minutes

**Solutions**:
1. Check Claude API is responsive:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01"
   ```
2. Check server logs for errors:
   ```bash
   tail -f logs/server.log
   ```
3. Cancel and retry:
   ```bash
   curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/cancel \
     -H "Authorization: Bearer $TOKEN"
   ```

### S3 Upload Fails

**Symptom**: Session completes but no artifacts available

**Solutions**:
1. Verify AWS credentials:
   ```bash
   aws s3 ls s3://your-bucket-name
   ```
2. Check IAM permissions:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
3. Test upload manually:
   ```bash
   echo "test" > test.txt
   aws s3 cp test.txt s3://your-bucket-name/test.txt
   ```

### "Encryption Key Invalid" Error

**Symptom**: Cannot decrypt API keys

**Solution**:
1. Regenerate encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
2. Update `.env` with new key
3. Note: Existing API keys will need to be re-added

---

## Next Steps

- Read the [API Documentation](./API.md) for complete endpoint reference
- Check [Architecture Guide](./architecture.md) to understand system design
- See [Extending Guide](./extending.md) to customize agent generation
- Review [Performance Guide](./PERFORMANCE.md) for optimization tips

---

## Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/YOUR_USERNAME/agent-builder/issues)
- **Documentation**: Check other guides in `docs/` directory
- **Logs**: Review `logs/server.log` for detailed error messages
- **Health Check**: Use `/health` endpoint to verify system status
