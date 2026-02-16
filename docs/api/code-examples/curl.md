# cURL Examples

Complete cURL examples for all Agent-Builder API endpoints.

## Setup

```bash
# Store your token in an environment variable
export API_TOKEN="your-jwt-token-here"
export BASE_URL="https://api.agent-builder.com"

# Or for local development
export BASE_URL="http://localhost:3000"
```

## Health Check

```bash
# Check API health (no authentication required)
curl -X GET "$BASE_URL/health"
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-09T12:00:00Z",
  "uptime": 86400,
  "environment": "production"
}
```

## Authentication

### List Available OAuth Providers

```bash
curl -X GET "$BASE_URL/api/auth/providers"
```

Response:
```json
{
  "providers": [
    {
      "id": "google",
      "name": "Google",
      "enabled": true
    },
    {
      "id": "azure",
      "name": "Azure AD",
      "enabled": true
    }
  ],
  "count": 2
}
```

### Get Current User

```bash
curl -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "google",
    "createdAt": "2026-01-01T00:00:00Z",
    "lastLogin": "2026-02-09T12:00:00Z"
  },
  "session": {
    "expiresAt": "2026-02-16T12:00:00Z"
  }
}
```

### Refresh Token

```bash
curl -X POST "$BASE_URL/api/auth/refresh" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-02-16T12:00:00Z"
}
```

### Logout

```bash
curl -X POST "$BASE_URL/api/auth/logout" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Logout from All Devices

```bash
curl -X POST "$BASE_URL/api/auth/logout-all" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "Logged out from 3 device(s)",
  "count": 3
}
```

## API Keys

### Add or Update API Key

```bash
curl -X POST "$BASE_URL/api/api-keys" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk-ant-api03-..."
  }'
```

Response:
```json
{
  "success": true,
  "message": "API key stored successfully"
}
```

### Validate API Key

```bash
curl -X POST "$BASE_URL/api/api-keys/validate" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response (valid):
```json
{
  "valid": true,
  "message": "API key is valid",
  "lastValidated": "2026-02-09T12:00:00Z"
}
```

Response (invalid):
```json
{
  "valid": false,
  "message": "API key is invalid",
  "error": "Authentication failed"
}
```

### Get API Key Status

```bash
curl -X GET "$BASE_URL/api/api-keys/status" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "exists": true,
  "valid": true,
  "lastValidated": "2026-02-09T12:00:00Z",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

### Delete API Key

```bash
curl -X DELETE "$BASE_URL/api/api-keys" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

## Agent Creation

### Create Agent

```bash
curl -X POST "$BASE_URL/api/agents/create" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A web scraper that extracts product prices from e-commerce sites",
    "outputType": "mcp",
    "language": "typescript",
    "interactive": false
  }'
```

Response:
```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "message": "Agent creation started"
}
```

### Create Agent with Different Options

```bash
# Python CLI
curl -X POST "$BASE_URL/api/agents/create" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A log parser that extracts error patterns",
    "outputType": "cli",
    "language": "python"
  }'

# TypeScript Library
curl -X POST "$BASE_URL/api/agents/create" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A REST API client library for GitHub",
    "outputType": "library",
    "language": "typescript"
  }'

# Claude Code Skill
curl -X POST "$BASE_URL/api/agents/create" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A code quality analyzer",
    "outputType": "skill",
    "language": "python"
  }'
```

### Get Agent Examples

```bash
curl -X GET "$BASE_URL/api/agents/examples"
```

Response:
```json
{
  "examples": [
    {
      "id": "web-scraper",
      "name": "Web Scraper",
      "description": "A web scraper that extracts product information from e-commerce sites",
      "outputType": "mcp",
      "language": "typescript"
    },
    {
      "id": "data-processor",
      "name": "Data Processor",
      "description": "Process CSV files and generate summary statistics",
      "outputType": "cli",
      "language": "python"
    }
  ]
}
```

## Sessions

### List Sessions

```bash
# Get all sessions
curl -X GET "$BASE_URL/api/sessions?page=1&pageSize=20" \
  -H "Authorization: Bearer $API_TOKEN"

# Filter by status
curl -X GET "$BASE_URL/api/sessions?status=completed" \
  -H "Authorization: Bearer $API_TOKEN"

# Pagination
curl -X GET "$BASE_URL/api/sessions?page=2&pageSize=50" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "sessions": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "userRequest": "A web scraper for e-commerce",
      "status": "completed",
      "currentPhase": "learning",
      "progress": 1.0,
      "outputType": "mcp",
      "language": "typescript",
      "error": null,
      "createdAt": "2026-02-09T10:00:00Z",
      "updatedAt": "2026-02-09T10:35:00Z",
      "completedAt": "2026-02-09T10:35:00Z",
      "hasArtifacts": true
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Get Session Details

```bash
curl -X GET "$BASE_URL/api/sessions/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "session": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userRequest": "A web scraper for e-commerce",
    "status": "completed",
    "currentPhase": "learning",
    "progress": 1.0,
    "outputType": "mcp",
    "language": "typescript",
    "error": null,
    "metadata": {
      "requirements": {...},
      "design": {...}
    },
    "artifactsS3Key": "sessions/123e4567-e89b-12d3-a456-426614174000/artifacts.zip",
    "createdAt": "2026-02-09T10:00:00Z",
    "updatedAt": "2026-02-09T10:35:00Z",
    "completedAt": "2026-02-09T10:35:00Z"
  },
  "auditLog": [
    {
      "eventType": "session_created",
      "details": {},
      "timestamp": "2026-02-09T10:00:00Z"
    },
    {
      "eventType": "phase_started",
      "details": { "phase": "clarification" },
      "timestamp": "2026-02-09T10:00:05Z"
    }
  ]
}
```

### Cancel Session

```bash
curl -X POST "$BASE_URL/api/sessions/123e4567-e89b-12d3-a456-426614174000/cancel" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "Session cancelled successfully",
  "sessionId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Delete Session

```bash
curl -X DELETE "$BASE_URL/api/sessions/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

### Get Session Statistics

```bash
curl -X GET "$BASE_URL/api/sessions/stats" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "stats": {
    "total": 50,
    "completed": 42,
    "failed": 3,
    "inProgress": 2,
    "averageDuration": 28
  }
}
```

## Downloads

### Download Artifacts

```bash
# Download as ZIP file
curl -X GET "$BASE_URL/api/downloads/123e4567-e89b-12d3-a456-426614174000/artifacts" \
  -H "Authorization: Bearer $API_TOKEN" \
  -o artifacts.zip

# With progress bar
curl -X GET "$BASE_URL/api/downloads/123e4567-e89b-12d3-a456-426614174000/artifacts" \
  -H "Authorization: Bearer $API_TOKEN" \
  -o artifacts.zip \
  --progress-bar
```

### Get Presigned Download URL

```bash
# Default expiration (1 hour)
curl -X GET "$BASE_URL/api/downloads/123e4567-e89b-12d3-a456-426614174000/artifacts/url" \
  -H "Authorization: Bearer $API_TOKEN"

# Custom expiration (2 hours)
curl -X GET "$BASE_URL/api/downloads/123e4567-e89b-12d3-a456-426614174000/artifacts/url?expiresIn=7200" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "url": "https://s3.amazonaws.com/agent-builder-artifacts/sessions/123e4567.../artifacts.zip?X-Amz-Algorithm=...",
  "expiresIn": 3600,
  "expiresAt": "2026-02-09T13:00:00Z"
}
```

Then download directly from S3:
```bash
curl -X GET "https://s3.amazonaws.com/agent-builder-artifacts/..." -o artifacts.zip
```

### Get Artifacts Metadata

```bash
curl -X GET "$BASE_URL/api/downloads/123e4567-e89b-12d3-a456-426614174000/metadata" \
  -H "Authorization: Bearer $API_TOKEN"
```

Response:
```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "artifacts": {
    "size": 1024000,
    "lastModified": "2026-02-09T10:35:00Z",
    "contentType": "application/zip",
    "s3Key": "sessions/123e4567.../artifacts.zip"
  },
  "session": {
    "status": "completed",
    "outputType": "mcp",
    "language": "typescript",
    "completedAt": "2026-02-09T10:35:00Z"
  }
}
```

## Error Handling

### Validation Error (400)

```bash
curl -X POST "$BASE_URL/api/agents/create" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "short",
    "outputType": "invalid"
  }'
```

Response:
```json
{
  "error": "Validation Error",
  "message": "Invalid output type",
  "code": "VALIDATION_ERROR"
}
```

### Unauthorized (401)

```bash
curl -X GET "$BASE_URL/api/sessions" \
  -H "Authorization: Bearer invalid-token"
```

Response:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### Rate Limit (429)

```bash
# Too many requests
curl -X POST "$BASE_URL/api/agents/create" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Agent"}'
```

Response:
```bash
HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

## Complete Workflow

```bash
#!/bin/bash
set -e

API_TOKEN="your-jwt-token"
BASE_URL="https://api.agent-builder.com"

echo "1. Checking API key status..."
curl -X GET "$BASE_URL/api/api-keys/status" \
  -H "Authorization: Bearer $API_TOKEN"

echo -e "\n2. Creating agent..."
SESSION_ID=$(curl -X POST "$BASE_URL/api/agents/create" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A web scraper for e-commerce prices",
    "outputType": "mcp",
    "language": "typescript"
  }' | jq -r '.sessionId')

echo "Session ID: $SESSION_ID"

echo -e "\n3. Polling for completion..."
while true; do
  STATUS=$(curl -s -X GET "$BASE_URL/api/sessions/$SESSION_ID" \
    -H "Authorization: Bearer $API_TOKEN" | jq -r '.session.status')

  PROGRESS=$(curl -s -X GET "$BASE_URL/api/sessions/$SESSION_ID" \
    -H "Authorization: Bearer $API_TOKEN" | jq -r '.session.progress')

  echo "Status: $STATUS, Progress: $(echo "$PROGRESS * 100" | bc)%"

  if [ "$STATUS" = "completed" ]; then
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Agent creation failed"
    exit 1
  fi

  sleep 5
done

echo -e "\n4. Downloading artifacts..."
curl -X GET "$BASE_URL/api/downloads/$SESSION_ID/artifacts" \
  -H "Authorization: Bearer $API_TOKEN" \
  -o "$SESSION_ID.zip"

echo "Downloaded to $SESSION_ID.zip"

echo -e "\n5. Extracting..."
unzip "$SESSION_ID.zip" -d "./agent-output"

echo "Done!"
```

## Advanced Usage

### Batch Operations

```bash
#!/bin/bash
# Create multiple agents

AGENTS=(
  "Web scraper for news sites|mcp|typescript"
  "CSV data processor|cli|python"
  "GitHub API client|library|typescript"
)

for AGENT in "${AGENTS[@]}"; do
  IFS='|' read -r DESC TYPE LANG <<< "$AGENT"

  SESSION_ID=$(curl -s -X POST "$BASE_URL/api/agents/create" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"description\": \"$DESC\",
      \"outputType\": \"$TYPE\",
      \"language\": \"$LANG\"
    }" | jq -r '.sessionId')

  echo "Created session $SESSION_ID for: $DESC"
done
```

### Get All Sessions (Pagination)

```bash
#!/bin/bash
PAGE=1
while true; do
  RESULT=$(curl -s -X GET "$BASE_URL/api/sessions?page=$PAGE&pageSize=100" \
    -H "Authorization: Bearer $API_TOKEN")

  echo "$RESULT" | jq -r '.sessions[] | "\(.id): \(.userRequest)"'

  HAS_NEXT=$(echo "$RESULT" | jq -r '.pagination.hasNext')
  if [ "$HAS_NEXT" = "false" ]; then
    break
  fi

  PAGE=$((PAGE + 1))
done
```

### Check Rate Limits

```bash
curl -s -X GET "$BASE_URL/api/sessions" \
  -H "Authorization: Bearer $API_TOKEN" \
  -D - -o /dev/null | grep "X-RateLimit"
```

Output:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1644854400
```

## Testing

### Health Check Script

```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")

if [ "$RESPONSE" = "200" ]; then
  echo "API is healthy"
  exit 0
else
  echo "API is down (HTTP $RESPONSE)"
  exit 1
fi
```

### Integration Test

```bash
#!/bin/bash
set -e

echo "Running integration tests..."

# Test 1: Authentication
echo "Test 1: Get current user"
curl -f -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $API_TOKEN" > /dev/null

# Test 2: API key status
echo "Test 2: Check API key"
curl -f -X GET "$BASE_URL/api/api-keys/status" \
  -H "Authorization: Bearer $API_TOKEN" > /dev/null

# Test 3: List sessions
echo "Test 3: List sessions"
curl -f -X GET "$BASE_URL/api/sessions?page=1&pageSize=10" \
  -H "Authorization: Bearer $API_TOKEN" > /dev/null

echo "All tests passed!"
```
