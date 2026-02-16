# API Usage Guide

Complete guide to using the Agent-Builder REST API.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Common Workflows](#common-workflows)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Best Practices](#best-practices)
- [Code Examples](#code-examples)

## Getting Started

### Base URL

```
Production: https://api.agent-builder.com
Development: http://localhost:3000
```

### API Versioning

The API is currently at version 1.0. All endpoints are prefixed with `/api`.

### Content Type

All requests and responses use JSON:

```http
Content-Type: application/json
```

### Quick Start

1. **Authenticate** via OAuth (Google/Azure/Okta)
2. **Store JWT token** for subsequent requests
3. **Add API key** (Anthropic) to your account
4. **Create agents** and monitor progress
5. **Download artifacts** when complete

## Authentication

### OAuth Flow

Agent-Builder uses OAuth 2.0 for authentication with multiple providers.

#### Step 1: Initiate OAuth

```bash
# Redirect user to OAuth provider
curl -L https://api.agent-builder.com/api/auth/google
```

Available providers:
- `/api/auth/google` - Google OAuth
- `/api/auth/azure` - Azure AD
- `/api/auth/okta` - Okta (Enterprise)

#### Step 2: Handle Callback

After user authorization, they'll be redirected to your callback URL with a JWT token:

```http
GET /callback?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Step 3: Store Token

```javascript
// Store token securely
localStorage.setItem('auth_token', token);

// Or in a cookie (HTTP-only, Secure)
document.cookie = `auth_token=${token}; Secure; HttpOnly; SameSite=Strict`;
```

### Using the Token

Include the token in all subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration

Tokens expire after 7 days. Refresh before expiration:

```bash
curl -X POST https://api.agent-builder.com/api/auth/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-02-16T12:00:00Z"
}
```

## Common Workflows

### 1. Complete Agent Creation Flow

```javascript
// 1. Authenticate (already have token)
const token = localStorage.getItem('auth_token');

// 2. Check API key status
const checkApiKey = async () => {
  const response = await fetch('/api/api-keys/status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

const apiKeyStatus = await checkApiKey();

// 3. Add API key if needed
if (!apiKeyStatus.exists) {
  await fetch('/api/api-keys', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiKey: 'sk-ant-api03-...'
    })
  });
}

// 4. Create agent
const createAgent = async () => {
  const response = await fetch('/api/agents/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'A web scraper for e-commerce price monitoring',
      outputType: 'mcp',
      language: 'typescript',
      interactive: false
    })
  });

  return response.json();
};

const { sessionId } = await createAgent();

// 5. Monitor progress via WebSocket
const ws = new WebSocket('wss://api.agent-builder.com');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    sessionId: sessionId,
    token: token
  }));
};

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(`Progress: ${update.progress * 100}%`);
  console.log(`Phase: ${update.currentPhase}`);

  if (update.status === 'completed') {
    // Download artifacts
    downloadArtifacts(sessionId);
  }
};

// 6. Download artifacts
const downloadArtifacts = async (sessionId) => {
  const response = await fetch(`/api/downloads/${sessionId}/artifacts`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sessionId}.zip`;
  a.click();
};
```

### 2. Listing and Filtering Sessions

```javascript
// Get all sessions with pagination
const getSessions = async (page = 1, pageSize = 20, status = null) => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString()
  });

  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`/api/sessions?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};

// Get completed sessions
const completedSessions = await getSessions(1, 20, 'completed');

// Get failed sessions
const failedSessions = await getSessions(1, 20, 'failed');

// Get all sessions
const allSessions = await getSessions(1, 50);
```

### 3. Session Details and Audit Log

```javascript
// Get detailed session information
const getSessionDetails = async (sessionId) => {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  console.log('Session:', data.session);
  console.log('Audit Log:', data.auditLog);

  return data;
};

const details = await getSessionDetails(sessionId);

// Audit log contains events like:
// - session_created
// - phase_started
// - phase_completed
// - session_completed
// - download_artifacts
```

### 4. Managing API Keys

```javascript
// Add or update API key
const addApiKey = async (apiKey) => {
  const response = await fetch('/api/api-keys', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ apiKey })
  });

  return response.json();
};

// Validate stored API key
const validateApiKey = async () => {
  const response = await fetch('/api/api-keys/validate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};

// Check API key status
const getApiKeyStatus = async () => {
  const response = await fetch('/api/api-keys/status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};

// Delete API key
const deleteApiKey = async () => {
  const response = await fetch('/api/api-keys', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};
```

### 5. Downloading Artifacts

```javascript
// Method 1: Direct download (proxied through API)
const downloadDirect = async (sessionId) => {
  const response = await fetch(`/api/downloads/${sessionId}/artifacts`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const blob = await response.blob();
  return blob;
};

// Method 2: Presigned URL (direct from S3)
const downloadViaPresignedUrl = async (sessionId) => {
  // Get presigned URL
  const response = await fetch(
    `/api/downloads/${sessionId}/artifacts/url?expiresIn=3600`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const { url, expiresAt } = await response.json();

  // Download directly from S3
  window.location.href = url;
};

// Method 3: Get metadata first
const getArtifactsMetadata = async (sessionId) => {
  const response = await fetch(`/api/downloads/${sessionId}/metadata`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  console.log('Size:', data.artifacts.size, 'bytes');
  console.log('Last Modified:', data.artifacts.lastModified);
  console.log('Output Type:', data.session.outputType);

  return data;
};
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Types

#### 400 Bad Request

```json
{
  "error": "Validation Error",
  "message": "Invalid output type",
  "code": "VALIDATION_ERROR"
}
```

**Causes:**
- Invalid request parameters
- Missing required fields
- Invalid format

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**Causes:**
- Missing Authorization header
- Invalid JWT token
- Expired token

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Access denied to this resource"
}
```

**Causes:**
- Trying to access another user's session
- Insufficient permissions

#### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Session not found"
}
```

**Causes:**
- Invalid session ID
- Resource deleted

#### 429 Too Many Requests

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

**Headers:**
```http
Retry-After: 3600
```

### Error Handling Example

```javascript
const createAgentWithErrorHandling = async (description, outputType, language) => {
  try {
    const response = await fetch('/api/agents/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description,
        outputType,
        language
      })
    });

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 400:
          console.error('Validation error:', error.message);
          // Show user-friendly message
          break;

        case 401:
          console.error('Unauthorized. Redirecting to login...');
          // Refresh token or redirect to login
          window.location.href = '/login';
          break;

        case 429:
          const retryAfter = response.headers.get('Retry-After');
          console.error(`Rate limited. Retry after ${retryAfter} seconds`);
          // Show rate limit message
          break;

        default:
          console.error('Unknown error:', error);
      }

      throw new Error(error.message);
    }

    return response.json();

  } catch (error) {
    console.error('Network error:', error);
    // Handle network errors
    throw error;
  }
};
```

## Rate Limiting

### Rate Limit Rules

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/agents/create` | 10 requests | 1 hour |
| `/api/api-keys/*` | 20 requests | 1 hour |
| `/api/downloads/*` | 50 requests | 1 hour |
| All other endpoints | 100 requests | 1 minute |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1644854400
```

### Handling Rate Limits

```javascript
const makeRequestWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');

      console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
};
```

## Best Practices

### 1. Token Management

```javascript
// Store token securely
const TokenManager = {
  setToken(token) {
    // Use httpOnly cookie in production
    localStorage.setItem('auth_token', token);

    // Set expiration reminder
    const decoded = this.decodeToken(token);
    const expiresAt = new Date(decoded.exp * 1000);
    const refreshAt = new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000); // 1 day before

    localStorage.setItem('token_refresh_at', refreshAt.toISOString());
  },

  getToken() {
    const token = localStorage.getItem('auth_token');

    // Check if needs refresh
    const refreshAt = localStorage.getItem('token_refresh_at');
    if (refreshAt && new Date() > new Date(refreshAt)) {
      this.refreshToken();
    }

    return token;
  },

  async refreshToken() {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    });

    const { token } = await response.json();
    this.setToken(token);
  },

  decodeToken(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  }
};
```

### 2. Request Retry Logic

```javascript
const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 1000) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok && retries > 0 && response.status >= 500) {
      // Server error - retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};
```

### 3. WebSocket Reconnection

```javascript
class WebSocketClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;

      // Authenticate
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: this.token
      }));
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(sessionId) {
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      sessionId
    }));
  }

  handleMessage(message) {
    // Override in subclass
    console.log('Message:', message);
  }
}
```

### 4. Pagination Helper

```javascript
const paginateAll = async (endpoint, token) => {
  let allResults = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${endpoint}?page=${page}&pageSize=100`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    allResults = allResults.concat(data.sessions);
    hasMore = data.pagination.hasNext;
    page++;
  }

  return allResults;
};

// Usage
const allSessions = await paginateAll('/api/sessions', token);
```

### 5. Request Deduplication

```javascript
const RequestCache = {
  cache: new Map(),

  async fetch(url, options = {}, cacheDuration = 60000) {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }

    const response = await fetch(url, options);
    const data = await response.json();

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  },

  clear() {
    this.cache.clear();
  }
};

// Usage
const sessions = await RequestCache.fetch('/api/sessions', { headers }, 30000);
```

## Code Examples

See the [Code Examples](./code-examples/) directory for complete examples in:

- [JavaScript/TypeScript](./code-examples/javascript.md)
- [Python](./code-examples/python.md)
- [cURL](./code-examples/curl.md)

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://api.agent-builder.com');
```

### Authentication

```javascript
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Subscribe to Session

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  sessionId: 'session-uuid'
}));
```

### Message Types

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'progress':
      console.log(`Progress: ${message.progress * 100}%`);
      console.log(`Phase: ${message.currentPhase}`);
      break;

    case 'phase_complete':
      console.log(`Phase ${message.phase} completed`);
      break;

    case 'status_change':
      console.log(`Status changed to: ${message.status}`);
      break;

    case 'error':
      console.error(`Error: ${message.error}`);
      break;
  }
};
```

## Support

- **Documentation**: https://docs.agent-builder.com
- **API Reference**: [OpenAPI Spec](./openapi.yaml)
- **Email**: support@agent-builder.com
- **GitHub Issues**: https://github.com/agent-builder/issues
