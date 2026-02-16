# Troubleshooting Guide

Common issues, solutions, and debugging techniques for Agent-Builder.

## Table of Contents
- [Database Issues](#database-issues)
- [Authentication and SSO](#authentication-and-sso)
- [API Key Problems](#api-key-problems)
- [WebSocket Connection Issues](#websocket-connection-issues)
- [Agent Creation Failures](#agent-creation-failures)
- [Performance Problems](#performance-problems)
- [S3 and Artifact Issues](#s3-and-artifact-issues)
- [Logging and Monitoring](#logging-and-monitoring)
- [Common Error Messages](#common-error-messages)

---

## Database Issues

### Problem: Cannot Connect to Database

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: password authentication failed for user "postgres"
```

**Solutions**:

1. **Check PostgreSQL is running**:
   ```bash
   # macOS (Homebrew)
   brew services list
   brew services start postgresql@15

   # Ubuntu/Debian
   sudo systemctl status postgresql
   sudo systemctl start postgresql

   # Check if listening
   pg_isready -h localhost -p 5432
   ```

2. **Verify connection parameters**:
   ```bash
   # Test connection
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

   # Check environment variables
   echo $DB_HOST
   echo $DB_USER
   echo $DB_NAME
   ```

3. **Check PostgreSQL logs**:
   ```bash
   # macOS (Homebrew)
   tail -f /usr/local/var/log/postgres.log

   # Ubuntu/Debian
   sudo tail -f /var/log/postgresql/postgresql-15-main.log

   # Docker
   docker logs <postgres-container-id>
   ```

4. **Verify database exists**:
   ```bash
   psql -U postgres -c "\l" | grep agent_builder
   ```

5. **Check pg_hba.conf** (if authentication fails):
   ```bash
   # Location varies by OS
   # macOS: /usr/local/var/postgres/pg_hba.conf
   # Ubuntu: /etc/postgresql/15/main/pg_hba.conf

   # Add line for local connections
   host    agent_builder    postgres    127.0.0.1/32    md5
   ```

---

### Problem: Connection Pool Exhausted

**Symptoms**:
```
Error: Connection pool timeout
Error: remaining connection slots are reserved
```

**Solutions**:

1. **Check active connections**:
   ```sql
   SELECT
     count(*) as total,
     count(*) FILTER (WHERE state = 'active') as active,
     count(*) FILTER (WHERE state = 'idle') as idle
   FROM pg_stat_activity
   WHERE datname = 'agent_builder';
   ```

2. **Increase connection pool size**:
   ```bash
   # In .env
   DB_POOL_MAX=30  # Increase from 20
   ```

3. **Check for connection leaks**:
   ```sql
   -- Long-running queries
   SELECT pid, now() - query_start as duration, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY duration DESC;

   -- Kill stuck connection
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE pid = <pid>;
   ```

4. **Adjust PostgreSQL max_connections**:
   ```sql
   -- Show current limit
   SHOW max_connections;

   -- Increase (requires restart)
   ALTER SYSTEM SET max_connections = 100;
   ```

---

### Problem: Slow Database Queries

**Symptoms**:
- API requests taking >1 second
- High database CPU usage

**Solutions**:

1. **Identify slow queries**:
   ```sql
   -- Enable pg_stat_statements
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

   -- View slow queries
   SELECT
     calls,
     mean_exec_time,
     max_exec_time,
     query
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Check missing indexes**:
   ```sql
   -- Find sequential scans
   SELECT
     schemaname,
     tablename,
     seq_scan,
     seq_tup_read,
     idx_scan
   FROM pg_stat_user_tables
   WHERE seq_scan > 1000
   ORDER BY seq_tup_read DESC;
   ```

3. **Analyze query plans**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM sessions
   WHERE user_id = 'xxx' AND status = 'completed'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

4. **Add missing indexes**:
   ```sql
   -- Example: composite index for common query
   CREATE INDEX idx_sessions_user_status_created
   ON sessions(user_id, status, created_at DESC);
   ```

5. **Update table statistics**:
   ```sql
   ANALYZE sessions;
   VACUUM ANALYZE sessions;
   ```

---

## Authentication and SSO

### Problem: Google OAuth Redirect URI Mismatch

**Symptoms**:
```
Error 400: redirect_uri_mismatch
The redirect URI in the request: http://localhost:3000/api/auth/google/callback
does not match the ones authorized for the OAuth client
```

**Solutions**:

1. **Verify exact URL match** in [Google Cloud Console](https://console.cloud.google.com):
   - Go to APIs & Services > Credentials
   - Click your OAuth 2.0 Client ID
   - Check "Authorized redirect URIs"
   - URL must match EXACTLY (no trailing slash, correct port)

2. **Common mistakes**:
   ```
   ✗ http://localhost:3000/api/auth/google/callback/  (trailing slash)
   ✗ https://localhost:3000/api/auth/google/callback  (http vs https)
   ✗ http://127.0.0.1:3000/api/auth/google/callback   (localhost vs 127.0.0.1)
   ✓ http://localhost:3000/api/auth/google/callback   (correct)
   ```

3. **Check environment variable**:
   ```bash
   echo $GOOGLE_CALLBACK_URL
   # Should match exactly what's in Google Console
   ```

4. **Test in incognito mode** (clear cached redirects)

---

### Problem: Azure AD "AADSTS50011" Error

**Symptoms**:
```
AADSTS50011: The reply URL specified in the request does not match
the reply URLs configured for the application
```

**Solutions**:

1. **Add redirect URI in Azure Portal**:
   - Go to Azure Active Directory > App registrations
   - Select your app
   - Click "Authentication" in sidebar
   - Under "Platform configurations" > "Web"
   - Add: `http://localhost:3000/api/auth/azure/callback`

2. **Verify correct tenant ID**:
   ```bash
   # Check environment variable
   echo $AZURE_TENANT_ID

   # Common vs specific tenant
   # Use specific tenant ID for single-tenant apps
   # Use "common" for multi-tenant apps
   ```

3. **Check API permissions**:
   - Ensure "User.Read" permission is granted
   - Click "Grant admin consent" if needed

---

### Problem: JWT Token Expired or Invalid

**Symptoms**:
```
401 Unauthorized
{"error": "Unauthorized", "message": "Invalid or expired token"}
```

**Solutions**:

1. **Check token expiration**:
   ```javascript
   // Decode JWT (without verification)
   const payload = JSON.parse(
     Buffer.from(token.split('.')[1], 'base64').toString()
   );
   console.log('Expires:', new Date(payload.exp * 1000));
   ```

2. **Refresh token**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/refresh \
     -H "Authorization: Bearer $OLD_TOKEN"
   ```

3. **Check JWT_SECRET hasn't changed**:
   ```bash
   # If JWT_SECRET changed, all existing tokens are invalid
   # Users must re-authenticate
   echo $JWT_SECRET
   ```

4. **Verify token is in request**:
   ```bash
   # Check Authorization header
   curl -v http://localhost:3000/api/auth/me \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## API Key Problems

### Problem: API Key Validation Fails

**Symptoms**:
```
{"valid": false, "message": "API key is invalid"}
```

**Solutions**:

1. **Verify API key format**:
   ```bash
   # Should start with sk-ant-
   echo $ANTHROPIC_API_KEY | grep '^sk-ant-'
   ```

2. **Test key directly with Anthropic**:
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

3. **Check for rate limits** (429 error from Anthropic):
   ```bash
   # Wait 60 seconds and retry
   sleep 60
   ```

4. **Check API key status** in [Anthropic Console](https://console.anthropic.com):
   - Ensure key hasn't been revoked
   - Check usage limits

5. **Re-add API key** (if encryption key changed):
   ```bash
   curl -X DELETE http://localhost:3000/api/api-keys \
     -H "Authorization: Bearer $TOKEN"

   curl -X POST http://localhost:3000/api/api-keys \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"apiKey": "sk-ant-your-new-key"}'
   ```

---

### Problem: "Failed to Decrypt API Key"

**Symptoms**:
```
Error: Failed to decrypt API key
Error: Unsupported state or unable to authenticate data
```

**Solutions**:

1. **Check ENCRYPTION_KEY hasn't changed**:
   ```bash
   echo $ENCRYPTION_KEY

   # If changed, all existing API keys are unrecoverable
   # Users must re-add their API keys
   ```

2. **Verify encryption key is valid base64**:
   ```bash
   node -e "
     try {
       const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
       if (key.length === 32) {
         console.log('✓ Valid 32-byte key');
       } else {
         console.log('✗ Invalid length:', key.length, 'bytes (need 32)');
       }
     } catch (e) {
       console.log('✗ Invalid base64:', e.message);
     }
   "
   ```

3. **Check for database corruption**:
   ```sql
   SELECT
     id,
     user_id,
     length(encrypted_key) as encrypted_len,
     length(iv) as iv_len,
     length(auth_tag) as tag_len
   FROM user_api_keys;
   ```

---

## WebSocket Connection Issues

### Problem: WebSocket Fails to Connect

**Symptoms**:
```
WebSocket connection failed
Error during WebSocket handshake: Unexpected response code: 403
```

**Solutions**:

1. **Check JWT token is provided**:
   ```javascript
   // Correct - token in query string
   const ws = new WebSocket(`ws://localhost:3000?token=${token}&sessionId=${sessionId}`);

   // Incorrect - missing token
   const ws = new WebSocket(`ws://localhost:3000?sessionId=${sessionId}`);
   ```

2. **Verify token is valid**:
   ```bash
   # Test token with API first
   curl http://localhost:3000/api/auth/me \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Check CORS allows WebSocket upgrade**:
   ```typescript
   // In server config
   app.use(cors({
     origin: ['http://localhost:5173'],
     credentials: true
   }));
   ```

4. **Test with wscat**:
   ```bash
   npm install -g wscat
   wscat -c "ws://localhost:3000?token=$TOKEN&sessionId=$SESSION_ID"
   ```

5. **Check firewall/proxy settings**:
   ```bash
   # Ensure WebSocket port is open
   telnet localhost 3000
   ```

---

### Problem: WebSocket Disconnects Immediately

**Symptoms**:
- Connection opens then closes
- Code 4001, 4002, or 4003

**Solutions**:

1. **Check close code and reason**:
   ```javascript
   ws.onclose = (event) => {
     console.log('Close code:', event.code);
     console.log('Close reason:', event.reason);
   };

   // Codes:
   // 4001 = Authentication required
   // 4002 = Session ID required
   // 4003 = Authentication failed
   ```

2. **Verify sessionId exists**:
   ```bash
   curl http://localhost:3000/api/sessions/$SESSION_ID \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Check server logs**:
   ```bash
   tail -f logs/server.log | grep WebSocket
   ```

---

### Problem: No Progress Updates Received

**Symptoms**:
- WebSocket connected
- No messages received during agent creation

**Solutions**:

1. **Verify you're listening for messages**:
   ```javascript
   ws.onmessage = (event) => {
     const message = JSON.parse(event.data);
     console.log('Received:', message);
   };
   ```

2. **Check session is actually in progress**:
   ```bash
   curl http://localhost:3000/api/sessions/$SESSION_ID \
     -H "Authorization: Bearer $TOKEN" | jq '.session.status'
   ```

3. **Ensure connected to correct session**:
   ```javascript
   // Double-check sessionId in URL
   console.log('Connected to session:', sessionId);
   ```

4. **Test heartbeat**:
   ```javascript
   ws.send(JSON.stringify({ type: 'ping' }));
   // Should receive pong response
   ```

---

## Agent Creation Failures

### Problem: Agent Creation Stuck at Clarification

**Symptoms**:
- Session status: `in_progress`
- Phase: `clarification`
- Progress not advancing

**Solutions**:

1. **Check Claude API connectivity**:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01"
   ```

2. **Check server logs for errors**:
   ```bash
   tail -f logs/server.log | grep -i error
   ```

3. **Verify API key has sufficient credits**:
   - Check [Anthropic Console](https://console.anthropic.com)
   - Ensure billing is set up

4. **Cancel and retry**:
   ```bash
   curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/cancel \
     -H "Authorization: Bearer $TOKEN"

   # Create new session
   curl -X POST http://localhost:3000/api/agents/create \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"description": "..."}'
   ```

---

### Problem: Agent Creation Times Out

**Symptoms**:
```
Error: Request timeout after 120000ms
Session status: failed
Error: Workflow execution failed
```

**Solutions**:

1. **Check for Claude API rate limits**:
   ```bash
   # Look for 429 errors in logs
   grep "429" logs/server.log
   ```

2. **Increase timeout** (if using CLI):
   ```bash
   # In config/agent-builder.config.yaml
   timeouts:
     clarification: 600000  # 10 minutes
     design: 900000         # 15 minutes
     implementation: 1200000 # 20 minutes
   ```

3. **Simplify description** (for testing):
   ```bash
   # Instead of complex requirements:
   "A sophisticated multi-tenant SaaS application..."

   # Try simpler:
   "A simple REST API for user management"
   ```

4. **Check network latency to Claude API**:
   ```bash
   ping api.anthropic.com
   traceroute api.anthropic.com
   ```

---

### Problem: Invalid JSON Response from Claude

**Symptoms**:
```
Error: Failed to parse Claude response
SyntaxError: Unexpected token
ValidationError: Invalid schema
```

**Solutions**:

1. **Check Claude response in logs**:
   ```bash
   grep "Claude response" logs/server.log | tail -1
   ```

2. **Verify Zod schema matches expected output**:
   ```typescript
   // Check src/claude/response-parser.ts
   // Ensure schema matches what Claude returns
   ```

3. **Retry with clearer prompt**:
   - Add explicit output format instructions
   - Provide example JSON structure

4. **Use Claude 3.5 Sonnet** (more reliable JSON):
   ```typescript
   // In ClaudeClient
   model: 'claude-3-5-sonnet-20241022'
   ```

---

## Performance Problems

### Problem: Slow API Response Times

**Symptoms**:
- API requests taking >2 seconds
- Timeouts in frontend

**Solutions**:

1. **Check database query performance**:
   ```sql
   -- Enable logging of slow queries
   ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
   SELECT pg_reload_conf();

   -- View slow queries
   SELECT * FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Add database indexes**:
   ```sql
   -- Example: if filtering by status is slow
   CREATE INDEX idx_sessions_status ON sessions(status);
   ```

3. **Enable response caching**:
   ```typescript
   // For static endpoints
   app.get('/api/auth/providers', cache(3600), handler);
   ```

4. **Check connection pool**:
   ```sql
   SELECT
     count(*) as total,
     count(*) FILTER (WHERE state = 'active') as active
   FROM pg_stat_activity
   WHERE datname = 'agent_builder';

   -- If active is consistently high, increase pool size
   ```

5. **Profile with Node.js built-in profiler**:
   ```bash
   node --inspect dist/server/index.js
   # Open chrome://inspect in Chrome
   ```

---

### Problem: High Memory Usage

**Symptoms**:
- Process using >2GB RAM
- Out of memory errors

**Solutions**:

1. **Check memory usage**:
   ```bash
   # Linux
   ps aux | grep node

   # macOS
   top -pid $(pgrep node)
   ```

2. **Profile memory leaks**:
   ```bash
   # Use clinic.js
   npm install -g clinic
   clinic doctor -- node dist/server/index.js
   ```

3. **Increase heap size** (if needed):
   ```bash
   node --max-old-space-size=4096 dist/server/index.js
   ```

4. **Check for connection leaks**:
   ```typescript
   // Ensure all database clients are released
   const client = await pool.connect();
   try {
     await client.query('...');
   } finally {
     client.release(); // Always release
   }
   ```

5. **Reduce WebSocket connection count**:
   ```typescript
   // Limit concurrent connections
   const MAX_CONNECTIONS = 1000;
   if (sessionConnections.size >= MAX_CONNECTIONS) {
     ws.close(4000, 'Server at capacity');
   }
   ```

---

## S3 and Artifact Issues

### Problem: S3 Upload Fails

**Symptoms**:
```
Error: Failed to upload artifacts
AccessDenied: Access Denied
NoSuchBucket: The specified bucket does not exist
```

**Solutions**:

1. **Verify S3 bucket exists**:
   ```bash
   aws s3 ls s3://$AWS_S3_BUCKET
   ```

2. **Check IAM permissions**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::agent-builder-artifacts/*"
       },
       {
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::agent-builder-artifacts"
       }
     ]
   }
   ```

3. **Test upload manually**:
   ```bash
   echo "test" > test.txt
   aws s3 cp test.txt s3://$AWS_S3_BUCKET/test.txt
   ```

4. **Check AWS credentials**:
   ```bash
   aws sts get-caller-identity
   ```

5. **Verify region matches**:
   ```bash
   # S3 bucket region
   aws s3api get-bucket-location --bucket $AWS_S3_BUCKET

   # Application region
   echo $AWS_REGION
   ```

---

### Problem: Presigned URL Expired

**Symptoms**:
```
<Error>
  <Code>AccessDenied</Code>
  <Message>Request has expired</Message>
</Error>
```

**Solutions**:

1. **Generate new URL**:
   ```bash
   curl http://localhost:3000/api/downloads/$SESSION_ID/artifacts/url \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Increase expiration time** (max 7200 seconds):
   ```bash
   curl "http://localhost:3000/api/downloads/$SESSION_ID/artifacts/url?expiresIn=7200" \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Download via server** (instead of presigned URL):
   ```bash
   curl -o artifacts.zip \
     http://localhost:3000/api/downloads/$SESSION_ID/artifacts \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Logging and Monitoring

### Problem: Missing Logs

**Symptoms**:
- Log file empty or not created
- No error output

**Solutions**:

1. **Check log directory exists**:
   ```bash
   mkdir -p logs
   chmod 755 logs
   ```

2. **Verify LOG_LEVEL setting**:
   ```bash
   echo $LOG_LEVEL
   # Should be: debug, info, warn, or error
   ```

3. **Check log file permissions**:
   ```bash
   ls -la logs/
   # Files should be writable by application user
   ```

4. **Test logging directly**:
   ```typescript
   import { logger } from './src/server/monitoring/logger';
   logger.info('Test log message');
   ```

5. **Check stdout/stderr**:
   ```bash
   # Run server in foreground to see console output
   npm run start:server

   # Or redirect to file
   npm run start:server > output.log 2>&1
   ```

---

### Problem: High Log Volume

**Symptoms**:
- Log files growing to GB size
- Disk space running out

**Solutions**:

1. **Rotate logs**:
   ```bash
   # Using logrotate (Linux)
   sudo nano /etc/logrotate.d/agent-builder
   ```

   ```
   /path/to/logs/*.log {
     daily
     rotate 7
     compress
     delaycompress
     missingok
     notifempty
     create 644 nodejs nodejs
   }
   ```

2. **Increase log level** (reduce verbosity):
   ```bash
   # In .env
   LOG_LEVEL=warn  # Instead of debug or info
   ```

3. **Disable request logging for health checks**:
   ```typescript
   app.use((req, res, next) => {
     if (req.path === '/health') {
       return next(); // Skip logging
     }
     requestLoggerMiddleware(req, res, next);
   });
   ```

4. **Use external log aggregation** (CloudWatch, Datadog):
   ```typescript
   // Send logs to CloudWatch instead of file
   import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
   ```

---

## Common Error Messages

### "EADDRINUSE: address already in use"

**Cause**: Port 3000 already in use

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run start:server
```

---

### "ValidationError: Invalid schema"

**Cause**: Request body doesn't match expected schema

**Solution**:
```bash
# Check API documentation for correct format
# Example for agent creation:
curl -X POST http://localhost:3000/api/agents/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Your description here",
    "outputType": "mcp",
    "language": "typescript"
  }'
```

---

### "ENOTFOUND" or "ETIMEDOUT"

**Cause**: Network connectivity issue

**Solution**:
```bash
# Check internet connection
ping 8.8.8.8

# Check DNS resolution
nslookup api.anthropic.com

# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Try with explicit DNS
curl --dns-servers 8.8.8.8 https://api.anthropic.com
```

---

### "Role arn:aws:iam::... is not authorized"

**Cause**: ECS task role missing permissions

**Solution**:
```bash
# Attach required policies to task role
aws iam attach-role-policy \
  --role-name agent-builder-task-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

---

## Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Set environment variables
export NODE_ENV=development
export LOG_LEVEL=debug
export DEBUG=*

# Start server
npm run start:server

# View detailed logs
tail -f logs/server.log | jq '.'
```

---

## Getting Help

If you can't resolve the issue:

1. **Check GitHub Issues**: [github.com/YOUR_USERNAME/agent-builder/issues](https://github.com/YOUR_USERNAME/agent-builder/issues)
2. **Create New Issue** with:
   - Steps to reproduce
   - Error messages
   - Relevant logs
   - System information
3. **Emergency**: Check [status page] for known outages

---

For more information:
- [Quick Start Guide](./QUICK_START.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)
