# API Documentation

Complete reference for Agent-Builder REST API and WebSocket protocol.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [API Keys](#api-key-management)
  - [Agents](#agent-creation)
  - [Sessions](#session-management)
  - [Downloads](#artifact-downloads)
  - [System](#system-endpoints)
- [WebSocket Protocol](#websocket-protocol)

---

## Overview

**Base URL**: `http://localhost:3000` (development) or `https://your-domain.com` (production)

**API Version**: v1 (implicit in all endpoints)

**Content Type**: `application/json`

**Authentication**: JWT Bearer tokens via SSO

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

1. Navigate to SSO login endpoint (e.g., `/api/auth/google`)
2. Complete OAuth flow with provider
3. Receive JWT token in redirect or response
4. Use token in subsequent API requests

### Token Expiration

- **Default Expiration**: 7 days
- **Refresh**: Use `/api/auth/refresh` endpoint before expiration
- **Validation**: Tokens are validated on every request

---

## Rate Limiting

Rate limits protect the API from abuse and ensure fair usage.

### Limits by Endpoint Category

| Category | Limit | Window | Applies To |
|----------|-------|--------|------------|
| Standard | 100 requests | 15 minutes | Most endpoints |
| Strict | 10 requests | 15 minutes | Auth, API key operations |
| Agent Creation | 10 agents | 1 hour | `/api/agents/create` |
| Downloads | 50 downloads | 15 minutes | `/api/downloads/*` |

### Rate Limit Headers

Every response includes:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707217200
```

### Rate Limit Exceeded

**Status Code**: `429 Too Many Requests`

**Response**:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 900
}
```

---

## Error Handling

### Standard Error Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error description",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request accepted (async operation) |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

### Error Types

- **ValidationError**: Invalid request data
- **AuthenticationError**: Authentication failed
- **AuthorizationError**: Insufficient permissions
- **NotFoundError**: Resource not found
- **RateLimitError**: Rate limit exceeded
- **InternalError**: Server error

---

## API Endpoints

### Authentication Endpoints

#### List Available SSO Providers

Get list of configured SSO authentication providers.

```http
GET /api/auth/providers
```

**Authentication**: None required

**Response**:
```json
{
  "providers": ["google", "azure"],
  "count": 2
}
```

---

#### Initiate Google OAuth

Start Google OAuth authentication flow.

```http
GET /api/auth/google
```

**Authentication**: None required

**Response**: Redirects to Google OAuth consent screen

**After Success**: Redirects to callback URL with token

---

#### Google OAuth Callback

Handles Google OAuth callback and creates JWT session.

```http
GET /api/auth/google/callback?code=<oauth-code>
```

**Authentication**: OAuth code from Google

**Response**: Redirects to frontend with JWT token

```
http://localhost:5173/?token=<jwt-token>
```

---

#### Initiate Azure AD OAuth

Start Azure AD OAuth authentication flow.

```http
GET /api/auth/azure
```

**Authentication**: None required

**Response**: Redirects to Azure AD consent screen

---

#### Azure AD OAuth Callback

```http
GET /api/auth/azure/callback?code=<oauth-code>
```

Similar to Google callback.

---

#### Logout (Current Device)

Invalidate current JWT session.

```http
POST /api/auth/logout
```

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### Logout All Devices

Invalidate all JWT sessions for current user.

```http
POST /api/auth/logout-all
```

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Logged out from 3 device(s)",
  "count": 3
}
```

---

#### Get Current User Info

Retrieve authenticated user information.

```http
GET /api/auth/me
```

**Authentication**: Required

**Response**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "google",
    "createdAt": "2026-01-15T10:30:00Z",
    "lastLogin": "2026-02-06T09:00:00Z"
  },
  "session": {
    "expiresAt": "2026-02-13T09:00:00Z"
  }
}
```

---

#### Refresh JWT Token

Generate new JWT token before current one expires.

```http
POST /api/auth/refresh
```

**Authentication**: Required (current valid token)

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-02-13T10:00:00Z"
}
```

**Notes**:
- Old token is invalidated
- New token has fresh 7-day expiration

---

#### Check Authentication Status

Check if request is authenticated (public endpoint).

```http
GET /api/auth/status
```

**Authentication**: Optional

**Response**:
```json
{
  "authenticated": true,
  "providers": ["google", "azure"]
}
```

---

### API Key Management

#### Add or Update API Key

Store or update Anthropic API key (encrypted at rest).

```http
POST /api/api-keys
```

**Authentication**: Required

**Rate Limit**: Strict (10/15min)

**Request Body**:
```json
{
  "apiKey": "sk-ant-your-anthropic-api-key"
}
```

**Response**:
```json
{
  "success": true,
  "message": "API key stored successfully"
}
```

**Errors**:
- `400`: Invalid API key format (must start with `sk-ant-`)
- `401`: Unauthorized

---

#### Validate API Key

Test stored API key against Anthropic API.

```http
POST /api/api-keys/validate
```

**Authentication**: Required

**Rate Limit**: Strict (10/15min)

**Response (Valid)**:
```json
{
  "valid": true,
  "message": "API key is valid",
  "lastValidated": "2026-02-06T10:30:00Z"
}
```

**Response (Invalid)**:
```json
{
  "valid": false,
  "message": "API key is invalid",
  "error": "Authentication failed"
}
```

---

#### Get API Key Status

Check if user has API key and its validation status.

```http
GET /api/api-keys/status
```

**Authentication**: Required

**Response (Has Key)**:
```json
{
  "exists": true,
  "valid": true,
  "lastValidated": "2026-02-06T10:30:00Z",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

**Response (No Key)**:
```json
{
  "exists": false
}
```

---

#### Delete API Key

Remove stored API key.

```http
DELETE /api/api-keys
```

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

**Errors**:
- `404`: No API key found

---

### Agent Creation

#### Create New Agent

Start agent creation workflow (asynchronous).

```http
POST /api/agents/create
```

**Authentication**: Required

**Rate Limit**: 10 agents per hour per user

**Request Body**:
```json
{
  "description": "A web scraper that extracts product prices from e-commerce sites",
  "outputType": "mcp",
  "language": "typescript",
  "interactive": false
}
```

**Parameters**:
- `description` (string, required): Natural language description of agent
- `outputType` (string, optional): One of `skill`, `mcp`, `cli`, `library`. Default: `mcp`
- `language` (string, optional): One of `typescript`, `python`. Default: `typescript`
- `interactive` (boolean, optional): Enable interactive clarification. Default: `false`

**Response** (202 Accepted):
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Agent creation started"
}
```

**Errors**:
- `400`: Invalid parameters or missing API key
- `429`: Rate limit exceeded (10 agents/hour)

**Notes**:
- Agent creation runs asynchronously
- Use WebSocket or polling to track progress
- Typical completion time: 20-35 minutes

---

#### Get Example Templates

Retrieve pre-defined agent templates for inspiration.

```http
GET /api/agents/examples
```

**Authentication**: Required

**Response**:
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

---

### Session Management

#### List Sessions

Get paginated list of user's agent creation sessions.

```http
GET /api/sessions?page=1&pageSize=20&status=completed
```

**Authentication**: Required

**Query Parameters**:
- `page` (integer, optional): Page number. Default: `1`
- `pageSize` (integer, optional): Items per page (max 100). Default: `20`
- `status` (string, optional): Filter by status. One of: `pending`, `in_progress`, `completed`, `failed`, `cancelled`

**Response**:
```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userRequest": "A web scraper that extracts product prices",
      "status": "completed",
      "currentPhase": "learning",
      "progress": 1.0,
      "outputType": "mcp",
      "language": "typescript",
      "error": null,
      "createdAt": "2026-02-06T09:30:00Z",
      "updatedAt": "2026-02-06T10:05:00Z",
      "completedAt": "2026-02-06T10:05:00Z",
      "hasArtifacts": true
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

#### Get Session Details

Retrieve detailed information about specific session.

```http
GET /api/sessions/:id
```

**Authentication**: Required

**Path Parameters**:
- `id` (string): Session UUID

**Response**:
```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userRequest": "A web scraper that extracts product prices",
    "status": "completed",
    "currentPhase": "learning",
    "progress": 1.0,
    "outputType": "mcp",
    "language": "typescript",
    "error": null,
    "metadata": {
      "clarificationRounds": 2,
      "thinkingTokensUsed": 9850,
      "totalTokens": 45230
    },
    "artifactsS3Key": "sessions/550e8400-e29b-41d4-a716-446655440000/artifacts.zip",
    "createdAt": "2026-02-06T09:30:00Z",
    "updatedAt": "2026-02-06T10:05:00Z",
    "completedAt": "2026-02-06T10:05:00Z"
  },
  "auditLog": [
    {
      "eventType": "create_session",
      "details": { "description": "..." },
      "timestamp": "2026-02-06T09:30:00Z"
    },
    {
      "eventType": "session_completed",
      "details": { "duration": 2100 },
      "timestamp": "2026-02-06T10:05:00Z"
    }
  ]
}
```

**Errors**:
- `404`: Session not found
- `403`: Access denied (not session owner)

---

#### Cancel Session

Cancel in-progress agent creation.

```http
POST /api/sessions/:id/cancel
```

**Authentication**: Required

**Path Parameters**:
- `id` (string): Session UUID

**Response**:
```json
{
  "success": true,
  "message": "Session cancelled successfully",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors**:
- `400`: Session not in cancellable state (only `pending` or `in_progress` can be cancelled)
- `404`: Session not found
- `403`: Access denied

---

#### Delete Session

Delete session and its artifacts permanently.

```http
DELETE /api/sessions/:id
```

**Authentication**: Required

**Path Parameters**:
- `id` (string): Session UUID

**Response**:
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Errors**:
- `404`: Session not found
- `403`: Access denied

**Notes**:
- Deletes session record from database
- Removes artifacts from S3
- Cannot be undone

---

#### Get Session Statistics

Get aggregate statistics for user's sessions.

```http
GET /api/sessions/stats
```

**Authentication**: Required

**Response**:
```json
{
  "stats": {
    "total": 15,
    "completed": 12,
    "failed": 2,
    "inProgress": 1,
    "averageDuration": 28
  }
}
```

**Fields**:
- `total`: Total sessions created
- `completed`: Successfully completed sessions
- `failed`: Failed sessions
- `inProgress`: Currently running sessions
- `averageDuration`: Average completion time in minutes (completed sessions only)

---

### Artifact Downloads

#### Download Artifacts as ZIP

Download all generated artifacts as ZIP file.

```http
GET /api/downloads/:sessionId/artifacts
```

**Authentication**: Required

**Rate Limit**: 50 downloads per 15 minutes

**Path Parameters**:
- `sessionId` (string): Session UUID

**Response**: Binary ZIP file

**Headers**:
```http
Content-Type: application/zip
Content-Disposition: attachment; filename="550e8400-e29b-41d4-a716-446655440000.zip"
Content-Length: 52428
```

**Errors**:
- `404`: Session or artifacts not found
- `400`: Session not completed yet
- `403`: Access denied

---

#### Get Presigned Download URL

Get temporary S3 URL for direct download (avoids server bandwidth).

```http
GET /api/downloads/:sessionId/artifacts/url?expiresIn=3600
```

**Authentication**: Required

**Rate Limit**: 50 requests per 15 minutes

**Path Parameters**:
- `sessionId` (string): Session UUID

**Query Parameters**:
- `expiresIn` (integer, optional): URL expiration in seconds (max 7200). Default: `3600`

**Response**:
```json
{
  "url": "https://s3.amazonaws.com/agent-builder-artifacts/sessions/550e8400.../artifacts.zip?X-Amz-Algorithm=...",
  "expiresIn": 3600,
  "expiresAt": "2026-02-06T11:30:00Z"
}
```

**Errors**:
- `404`: Session or artifacts not found
- `400`: Session not completed yet
- `403`: Access denied

---

#### Get Artifacts Metadata

Get information about artifacts without downloading.

```http
GET /api/downloads/:sessionId/metadata
```

**Authentication**: Required

**Path Parameters**:
- `sessionId` (string): Session UUID

**Response**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "artifacts": {
    "size": 52428,
    "lastModified": "2026-02-06T10:05:00Z",
    "contentType": "application/zip",
    "s3Key": "sessions/550e8400-e29b-41d4-a716-446655440000/artifacts.zip"
  },
  "session": {
    "status": "completed",
    "outputType": "mcp",
    "language": "typescript",
    "completedAt": "2026-02-06T10:05:00Z"
  }
}
```

**Errors**:
- `404`: Session or artifacts not found
- `403`: Access denied

---

### System Endpoints

#### Health Check

Check API server health status.

```http
GET /health
```

**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-06T10:30:00Z",
  "uptime": 86400,
  "environment": "production"
}
```

**Fields**:
- `status`: `healthy` or `unhealthy`
- `timestamp`: Current server time
- `uptime`: Server uptime in seconds
- `environment`: `development` or `production`

---

#### Prometheus Metrics

Get Prometheus-formatted metrics.

```http
GET /metrics
```

**Authentication**: None required (but should be restricted in production)

**Response**: Prometheus text format
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/sessions",status="200"} 1523

# HELP agent_creations_total Total agent creations
# TYPE agent_creations_total counter
agent_creations_total{output_type="mcp",language="typescript"} 45

# HELP websocket_active_connections Active WebSocket connections
# TYPE websocket_active_connections gauge
websocket_active_connections 12
```

---

## WebSocket Protocol

Real-time updates for agent creation progress.

### Connection

```javascript
const token = 'your-jwt-token';
const sessionId = '550e8400-e29b-41d4-a716-446655440000';

const ws = new WebSocket(`ws://localhost:3000?token=${token}&sessionId=${sessionId}`);
```

**Query Parameters**:
- `token` (required): JWT authentication token
- `sessionId` (required): Session UUID to monitor

### Connection States

**On Connect**:
```json
{
  "type": "connected",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-06T10:30:00Z"
}
```

**On Error**:
- Code `4001`: Authentication required
- Code `4002`: Session ID required
- Code `4003`: Authentication failed

### Message Types from Server

#### Session Update

```json
{
  "type": "session_update",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "status": "in_progress",
    "message": "Starting clarification phase"
  },
  "timestamp": "2026-02-06T10:30:05Z"
}
```

#### Phase Change

```json
{
  "type": "phase_change",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "phase": "design",
    "message": "Analyzing architecture with extended thinking"
  },
  "timestamp": "2026-02-06T10:35:00Z"
}
```

#### Progress Update

```json
{
  "type": "progress",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "phase": "implementation",
    "progress": 0.65,
    "message": "Generating tests"
  },
  "timestamp": "2026-02-06T10:45:00Z"
}
```

#### Error

```json
{
  "type": "error",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "error": "API rate limit exceeded",
    "message": "Will retry in 60 seconds"
  },
  "timestamp": "2026-02-06T10:50:00Z"
}
```

#### Completion

```json
{
  "type": "completed",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "status": "completed",
    "artifacts": "sessions/550e8400.../artifacts.zip",
    "message": "Agent creation completed successfully"
  },
  "timestamp": "2026-02-06T11:05:00Z"
}
```

### Message Types to Server

#### Ping

```json
{
  "type": "ping"
}
```

**Response**:
```json
{
  "type": "pong",
  "timestamp": "2026-02-06T10:30:00Z"
}
```

#### Subscribe (Optional)

```json
{
  "type": "subscribe"
}
```

**Response**:
```json
{
  "type": "subscribed",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-06T10:30:00Z"
}
```

### Heartbeat

Server sends ping frames every 30 seconds. Client should respond with pong to keep connection alive.

### Connection Management

```javascript
ws.onopen = () => console.log('Connected');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};

ws.onerror = (error) => console.error('WebSocket error:', error);

ws.onclose = (event) => {
  console.log(`Closed: ${event.code} - ${event.reason}`);
  // Implement reconnection logic if needed
};
```

### Reconnection Strategy

```javascript
function connectWithRetry(token, sessionId, maxRetries = 5) {
  let retries = 0;

  function connect() {
    const ws = new WebSocket(`ws://localhost:3000?token=${token}&sessionId=${sessionId}`);

    ws.onclose = (event) => {
      if (retries < maxRetries && event.code !== 1000) {
        retries++;
        const delay = Math.min(1000 * Math.pow(2, retries), 30000);
        console.log(`Reconnecting in ${delay}ms...`);
        setTimeout(connect, delay);
      }
    };

    return ws;
  }

  return connect();
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3000';
let authToken: string;

// Login and get token (handled by browser redirect in real app)
async function login() {
  // User clicks "Login with Google" button
  // After OAuth flow, token is provided
  authToken = 'received-jwt-token';
}

// Create API client
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Create agent
async function createAgent(description: string) {
  const response = await api.post('/api/agents/create', {
    description,
    outputType: 'mcp',
    language: 'typescript',
  });

  return response.data.sessionId;
}

// Monitor progress
function monitorProgress(sessionId: string) {
  const ws = new WebSocket(`ws://localhost:3000?token=${authToken}&sessionId=${sessionId}`);

  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    console.log(`[${update.type}] ${update.data.message}`);

    if (update.type === 'completed') {
      downloadArtifacts(sessionId);
      ws.close();
    }
  };
}

// Download artifacts
async function downloadArtifacts(sessionId: string) {
  const response = await api.get(`/api/downloads/${sessionId}/artifacts`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sessionId}.zip`;
  a.click();
}
```

### Python

```python
import requests
import websocket
import json

API_BASE = "http://localhost:3000"
auth_token = None

class AgentBuilderClient:
    def __init__(self, api_base: str):
        self.api_base = api_base
        self.token = None

    def set_token(self, token: str):
        self.token = token

    def _headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }

    def create_agent(self, description: str, output_type="mcp", language="typescript"):
        response = requests.post(
            f"{self.api_base}/api/agents/create",
            headers=self._headers(),
            json={
                "description": description,
                "outputType": output_type,
                "language": language
            }
        )
        response.raise_for_status()
        return response.json()["sessionId"]

    def get_session(self, session_id: str):
        response = requests.get(
            f"{self.api_base}/api/sessions/{session_id}",
            headers=self._headers()
        )
        response.raise_for_status()
        return response.json()

    def download_artifacts(self, session_id: str, output_file: str):
        response = requests.get(
            f"{self.api_base}/api/downloads/{session_id}/artifacts",
            headers=self._headers(),
            stream=True
        )
        response.raise_for_status()

        with open(output_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

    def monitor_progress(self, session_id: str, callback):
        ws_url = f"ws://localhost:3000?token={self.token}&sessionId={session_id}"

        def on_message(ws, message):
            data = json.loads(message)
            callback(data)
            if data.get("type") == "completed":
                ws.close()

        ws = websocket.WebSocketApp(
            ws_url,
            on_message=on_message
        )
        ws.run_forever()

# Usage
client = AgentBuilderClient(API_BASE)
client.set_token("your-jwt-token")

session_id = client.create_agent("A web scraper for e-commerce sites")

def progress_callback(update):
    print(f"[{update['type']}] {update['data'].get('message', '')}")

client.monitor_progress(session_id, progress_callback)
client.download_artifacts(session_id, f"{session_id}.zip")
```

---

## Postman Collection

Import this collection into Postman for easy API testing:

**Collection**: [Download agent-builder.postman_collection.json](./agent-builder.postman_collection.json)

**Environment Variables**:
- `BASE_URL`: `http://localhost:3000`
- `JWT_TOKEN`: Your JWT token from login
- `SESSION_ID`: Session UUID from agent creation

---

## Additional Resources

- [Quick Start Guide](./QUICK_START.md) - Get started in 10 minutes
- [Architecture Guide](./architecture.md) - System design details
- [Security Guide](./SECURITY.md) - Security best practices
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
