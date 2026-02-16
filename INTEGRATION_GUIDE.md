# Frontend-Backend Integration Guide

Complete guide for integrating the React frontend with the Express backend.

---

## 🔗 Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  React Frontend │         │  Express Backend │         │  PostgreSQL │
│  (Port 5173)    │ ──────> │  (Port 3000)     │ ──────> │  Database   │
└─────────────────┘         └──────────────────┘         └─────────────┘
        │                            │
        │                            │
        │                            ▼
        │                    ┌──────────────┐
        └──────────────────> │  WebSocket   │
         (Real-time updates) │  Server      │
                            └──────────────┘
```

---

## 🚀 Quick Start

### 1. Start Backend

```bash
# From project root
cd /Users/mayankgupta/Github/Work/agent-builder

# Ensure PostgreSQL is running
pg_isready

# Apply database migrations
psql agent_builder < migrations/001_initial_schema.sql

# Set environment variables
export ANTHROPIC_API_KEY=your-key-here
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
export ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Start backend server
npm run start:server

# Verify backend is running
curl http://localhost:3000/health
```

### 2. Start Frontend

```bash
# Open new terminal
cd /Users/mayankgupta/Github/Work/agent-builder/web

# Install dependencies (first time only)
npm install

# Start frontend dev server
npm run dev

# Open browser
open http://localhost:5173
```

---

## 🔌 API Endpoints Integration

### Authentication Flow

#### Frontend → Backend
```typescript
// src/api/auth.ts
export const authApi = {
  getProviders: () => GET /api/auth/providers,
  getMe: () => GET /api/auth/me,
  logout: () => POST /api/auth/logout,
}
```

#### SSO Login Flow
```
1. User clicks "Continue with Google" on LoginPage
   ↓
2. Redirects to: /api/auth/google
   ↓
3. Backend redirects to Google OAuth
   ↓
4. Google redirects to: /api/auth/google/callback
   ↓
5. Backend creates JWT and redirects to: /auth/callback?token=xxx
   ↓
6. Frontend OAuthCallbackPage extracts token
   ↓
7. Token saved to localStorage
   ↓
8. Redirect to /dashboard
```

### Agent Creation Flow

#### Frontend → Backend
```typescript
// src/api/sessions.ts
export const sessionsApi = {
  create: (request) => POST /api/agents/create,
  list: (params) => GET /api/sessions,
  get: (id) => GET /api/sessions/:id,
  cancel: (id) => POST /api/sessions/:id/cancel,
  delete: (id) => DELETE /api/sessions/:id,
}
```

#### Creation Flow
```
1. User fills out CreateAgentPage form
   ↓
2. POST /api/agents/create
   {
     description: "...",
     outputType: "mcp",
     language: "typescript",
     options: { priority: "quality" }
   }
   ↓
3. Backend returns { sessionId: "uuid", status: "pending" }
   ↓
4. Frontend redirects to SessionDetailPage
   ↓
5. WebSocket connection established
   ↓
6. Real-time updates received
   ↓
7. Session completes, artifacts available
```

### API Key Management Flow

#### Frontend → Backend
```typescript
// src/api/apiKeys.ts
export const apiKeysApi = {
  add: (apiKey) => POST /api/api-keys,
  validate: () => POST /api/api-keys/validate,
  getStatus: () => GET /api/api-keys/status,
  delete: () => DELETE /api/api-keys,
}
```

#### Flow
```
1. User enters API key in SettingsPage
   ↓
2. POST /api/api-keys { apiKey: "sk-ant-..." }
   ↓
3. Backend encrypts with AES-256-GCM
   ↓
4. Stored in user_api_keys table
   ↓
5. Frontend receives confirmation
   ↓
6. User can now create agents
```

### WebSocket Integration

#### Connection
```typescript
// src/hooks/useWebSocket.ts
const protocol = 'ws:' // or 'wss:' in production
const url = `${protocol}//localhost:3000?token=${jwt}&sessionId=${id}`

const ws = new WebSocket(url)
```

#### Message Flow
```
Backend → Frontend:
{
  type: "progress",
  sessionId: "uuid",
  data: {
    phase: "implementing",
    progress: 60,
    status: "implementing"
  },
  timestamp: "2026-02-06T..."
}

Frontend Actions:
1. Invalidate React Query cache
2. Show toast notification
3. Update UI automatically
```

---

## 🔐 Authentication Integration

### JWT Token Flow

#### Token Storage
```typescript
// src/api/client.ts
// Save token
localStorage.setItem('auth_token', token)

// Add to requests
config.headers.Authorization = `Bearer ${token}`
```

#### Token Refresh
```typescript
// Automatic refresh before expiration
const refreshToken = async () => {
  const response = await POST /api/auth/refresh
  const { token } = response
  localStorage.setItem('auth_token', token)
}
```

#### 401 Handling
```typescript
// src/api/client.ts
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
  }
)
```

---

## 📊 Data Flow Examples

### Example 1: View Sessions

```
Frontend                    Backend
   │                           │
   │── GET /api/sessions ─────>│
   │   ?page=1&pageSize=10      │
   │                            │
   │                            │── Query PostgreSQL
   │                            │
   │<── 200 OK ────────────────│
   │   {                        │
   │     sessions: [...],       │
   │     total: 42,             │
   │     page: 1,               │
   │     pageSize: 10           │
   │   }                        │
   │                            │
   │── React Query caches ──────
   │
   │── UI renders list ─────────
```

### Example 2: Create Agent

```
Frontend                    Backend
   │                           │
   │── POST /api/agents/create>│
   │   {                        │
   │     description: "...",    │
   │     outputType: "mcp",     │
   │     language: "typescript" │
   │   }                        │
   │                            │
   │                            │── Validate input
   │                            │── Create session in DB
   │                            │── Start workflow (async)
   │                            │
   │<── 201 Created ───────────│
   │   {                        │
   │     sessionId: "uuid",     │
   │     status: "pending"      │
   │   }                        │
   │                            │
   │── Navigate to details ────│
   │                            │
   │══ WebSocket connected ════│
   │                            │
   │<═══ Progress updates ═════│
   │    (every phase change)    │
```

### Example 3: Download Artifacts

```
Frontend                    Backend
   │                           │
   │── GET /api/downloads/     │
   │    {sessionId}/artifacts >│
   │                            │
   │                            │── Verify session complete
   │                            │── Fetch from S3
   │                            │── Create ZIP
   │                            │
   │<── 200 OK (blob) ─────────│
   │   Content-Type:            │
   │   application/zip          │
   │                            │
   │── Trigger browser download │
   │                            │
   │── User gets file ──────────
```

---

## 🐛 Debugging Integration

### Check Backend Connection

```bash
# Health check
curl http://localhost:3000/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2026-02-06T..."
}
```

### Check Authentication

```bash
# Get auth providers
curl http://localhost:3000/api/auth/providers

# Expected response
[
  {
    "name": "google",
    "displayName": "Google",
    "enabled": true,
    "authUrl": "/api/auth/google"
  }
]
```

### Check WebSocket

```javascript
// Browser console
const ws = new WebSocket('ws://localhost:3000?token=YOUR_TOKEN')
ws.onopen = () => console.log('Connected')
ws.onmessage = (e) => console.log('Message:', e.data)
ws.onerror = (e) => console.error('Error:', e)
```

### Check Token

```javascript
// Browser console
localStorage.getItem('auth_token')

// Decode JWT (without verification)
const token = localStorage.getItem('auth_token')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('User ID:', payload.userId)
console.log('Expires:', new Date(payload.exp * 1000))
```

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Errors

**Symptom**: `Access-Control-Allow-Origin` errors in browser console

**Solution**:
```typescript
// Backend: src/server/index.ts
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
```

### Issue 2: 401 Unauthorized

**Symptom**: All API calls return 401

**Solutions**:
1. Check token exists: `localStorage.getItem('auth_token')`
2. Check token not expired
3. Check backend JWT_SECRET hasn't changed
4. Re-login to get new token

### Issue 3: WebSocket Won't Connect

**Symptom**: WebSocket connection fails

**Solutions**:
1. Check token is valid
2. Check backend WebSocket server is running
3. Check firewall allows WebSocket connections
4. Try: `ws://localhost:3000?token=xxx&sessionId=yyy`

### Issue 4: Proxy Not Working

**Symptom**: API calls to `/api/*` fail with 404

**Solutions**:
1. Verify backend is running on port 3000
2. Check `vite.config.ts` proxy configuration:
   ```typescript
   server: {
     proxy: {
       '/api': 'http://localhost:3000'
     }
   }
   ```
3. Restart Vite dev server

### Issue 5: Real-time Updates Not Working

**Symptom**: Progress doesn't update automatically

**Solutions**:
1. Check WebSocket is connected (browser Network tab)
2. Check React Query devtools for cache updates
3. Verify backend is sending WebSocket messages
4. Check browser console for errors

---

## 📝 Configuration Checklist

### Backend Configuration (.env)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agent_builder
DB_USER=postgres
DB_PASSWORD=your-password

# Authentication
JWT_SECRET=your-secret-here
ENCRYPTION_KEY=your-key-here

# SSO (at least one required)
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# Storage
AWS_S3_BUCKET=your-bucket

# Server
PORT=3000
NODE_ENV=development
```

### Frontend Configuration

No configuration needed for development (uses Vite proxy).

For production, update:
```typescript
// vite.config.ts or .env.production
VITE_API_URL=https://api.yourapp.com
VITE_WS_URL=wss://api.yourapp.com
```

---

## 🧪 Testing the Integration

### Manual Test Flow

1. **Start Backend**
   ```bash
   npm run start:server
   # Should show: Server listening on port 3000
   ```

2. **Start Frontend**
   ```bash
   cd web && npm run dev
   # Should show: Local: http://localhost:5173
   ```

3. **Test Authentication**
   - Navigate to http://localhost:5173
   - Click SSO provider
   - Should redirect and login
   - Should see Dashboard

4. **Test API Key**
   - Go to Settings
   - Add API key
   - Click Validate
   - Should show "API key is valid"

5. **Test Agent Creation**
   - Click "Create Agent"
   - Fill out form
   - Submit
   - Should see progress page
   - Progress should update in real-time

6. **Test WebSocket**
   - Open browser DevTools → Network → WS
   - Should see WebSocket connection
   - Should see messages coming in

7. **Test Downloads**
   - Wait for agent to complete
   - Click "Download ZIP"
   - Should download file

---

## 🔄 State Synchronization

### React Query Cache Invalidation

```typescript
// When WebSocket message received
if (message.type === 'completed') {
  queryClient.invalidateQueries({
    queryKey: ['session', sessionId]
  })
  queryClient.invalidateQueries({
    queryKey: ['sessions']
  })
}
```

### Optimistic Updates

```typescript
// When cancelling session
const cancelMutation = useMutation({
  mutationFn: sessionsApi.cancel,
  onMutate: async (sessionId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['session', sessionId] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['session', sessionId])

    // Optimistically update
    queryClient.setQueryData(['session', sessionId], (old) => ({
      ...old,
      status: 'cancelled'
    }))

    return { previous }
  },
  onError: (err, sessionId, context) => {
    // Rollback on error
    queryClient.setQueryData(['session', sessionId], context.previous)
  }
})
```

---

## 📊 Monitoring Integration

### Backend Metrics

```bash
# Prometheus metrics available at
curl http://localhost:3000/metrics

# Key metrics:
# - http_requests_total
# - http_request_duration_seconds
# - websocket_connections
# - active_sessions
```

### Frontend Monitoring

```typescript
// React Query devtools
// Shows all queries, mutations, cache state
// Available at: floating icon in bottom-right
```

---

## 🚀 Production Deployment

### Frontend Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.agent-builder.com
VITE_WS_URL=wss://api.agent-builder.com
```

### Backend CORS Update

```typescript
// Production CORS
app.use(cors({
  origin: 'https://agent-builder.com',
  credentials: true,
}))
```

### WebSocket URL Update

```typescript
// Frontend: src/hooks/useWebSocket.ts
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const host = import.meta.env.VITE_API_URL || window.location.host
const url = `${protocol}//${host}?token=${token}&sessionId=${sessionId}`
```

---

## ✅ Integration Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] PostgreSQL database created and migrated
- [ ] Environment variables set
- [ ] At least one SSO provider configured
- [ ] Health check passes
- [ ] Auth providers endpoint returns data
- [ ] SSO login works
- [ ] API key can be added
- [ ] Sessions can be listed
- [ ] Agent creation works
- [ ] WebSocket connects
- [ ] Real-time updates work
- [ ] Downloads work
- [ ] All pages accessible

---

**Integration Status**: ✅ Complete
**Ready for**: Production Deployment

---

_Last Updated: 2026-02-06_
