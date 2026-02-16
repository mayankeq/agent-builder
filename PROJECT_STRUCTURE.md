# Agent Builder - Complete Project Structure

Visual representation of the entire project structure.

---

## 📁 Project Root

```
agent-builder/
│
├── 📄 Configuration Files
│   ├── package.json                    # Root dependencies & scripts
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── .gitignore                      # Git ignore rules
│   ├── .npmignore                      # NPM publish ignore
│   └── .env.example                    # Environment template
│
├── 📚 Documentation (8 files)
│   ├── README.md                       # Main project documentation
│   ├── BACKEND_COMPLETE.md             # Backend implementation details
│   ├── WEB_APP_SUMMARY.md              # Frontend summary
│   ├── INTEGRATION_GUIDE.md            # Integration instructions
│   ├── FULL_STACK_COMPLETE.md          # Complete project summary
│   ├── PROJECT_STRUCTURE.md            # This file
│   ├── IMPLEMENTATION_STATUS.md        # Implementation tracking
│   └── SUMMARY.md                      # Original CLI summary
│
├── 🗄️ Database
│   └── migrations/
│       └── 001_initial_schema.sql      # Complete database schema
│
├── 🎯 Source Code - Backend
│   └── src/
│       ├── server/
│       │   ├── 📊 Storage Layer (4 files)
│       │   │   ├── database.ts         # PostgreSQL connection pool
│       │   │   ├── session-store.ts    # Session CRUD operations
│       │   │   ├── user-store.ts       # User management
│       │   │   └── s3-store.ts         # AWS S3 integration
│       │   │
│       │   ├── 🔐 Authentication (2 files)
│       │   │   ├── jwt.ts              # JWT token handling
│       │   │   └── oauth.ts            # OAuth strategies
│       │   │
│       │   ├── 🛡️ Security (1 file)
│       │   │   └── encryption.ts       # AES-256-GCM encryption
│       │   │
│       │   ├── 📈 Monitoring (3 files)
│       │   │   ├── logger.ts           # Winston logging
│       │   │   ├── metrics.ts          # Prometheus metrics
│       │   │   └── audit.ts            # Audit logging
│       │   │
│       │   ├── 🔧 Middleware (4 files)
│       │   │   ├── auth.ts             # JWT verification
│       │   │   ├── rate-limit.ts       # Rate limiting
│       │   │   ├── error-handler.ts    # Error handling
│       │   │   └── request-logger.ts   # Request logging
│       │   │
│       │   ├── 🛣️ Routes (5 files)
│       │   │   ├── auth.ts             # Authentication endpoints
│       │   │   ├── agents.ts           # Agent creation
│       │   │   ├── sessions.ts         # Session management
│       │   │   ├── api-keys.ts         # API key management
│       │   │   └── downloads.ts        # Artifact downloads
│       │   │
│       │   └── 🌐 Server (2 files)
│       │       ├── index.ts            # Express app setup
│       │       └── websocket.ts        # WebSocket server
│       │
│       └── [Original CLI code - 10 phases]
│           ├── agents/                 # Agent system
│           ├── claude/                 # Claude API client
│           ├── config/                 # Configuration
│           ├── memory/                 # Memory system
│           ├── orchestration/          # Workflow coordinator
│           ├── optimization/           # Performance optimizer
│           ├── templates/              # Code templates
│           ├── types/                  # Type definitions
│           ├── utils/                  # Utilities
│           └── validation/             # Code validation
│
├── 🎨 Source Code - Frontend
│   └── web/
│       ├── 📄 Configuration
│       │   ├── package.json            # Dependencies & scripts
│       │   ├── vite.config.ts          # Vite configuration
│       │   ├── tsconfig.json           # TypeScript config
│       │   ├── tsconfig.node.json      # Node TypeScript config
│       │   ├── tailwind.config.js      # Tailwind configuration
│       │   ├── postcss.config.js       # PostCSS config
│       │   ├── .eslintrc.cjs           # ESLint config
│       │   ├── .gitignore              # Git ignore
│       │   └── index.html              # HTML entry point
│       │
│       ├── 📚 Documentation
│       │   ├── README.md               # Frontend overview
│       │   ├── SETUP.md                # Setup instructions
│       │   ├── QUICK_REFERENCE.md      # Developer reference
│       │   ├── FRONTEND_COMPLETE.md    # Implementation details
│       │   └── verify-setup.sh         # Setup verification script
│       │
│       └── src/
│           ├── 🎯 Core Application
│           │   ├── main.tsx            # React entry point
│           │   ├── App.tsx             # Route configuration
│           │   └── index.css           # Global styles
│           │
│           ├── 🌐 API Layer (7 files)
│           │   ├── client.ts           # Axios client
│           │   ├── auth.ts             # Auth API
│           │   ├── sessions.ts         # Sessions API
│           │   ├── apiKeys.ts          # API keys API
│           │   ├── downloads.ts        # Downloads API
│           │   ├── examples.ts         # Examples API
│           │   └── index.ts            # Exports
│           │
│           ├── 🧩 Components (8 files)
│           │   ├── ErrorBoundary.tsx   # Error handling
│           │   ├── Loading.tsx         # Loading states
│           │   ├── StatusBadge.tsx     # Status display
│           │   ├── ProgressBar.tsx     # Progress visualization
│           │   ├── Modal.tsx           # Modal dialog
│           │   ├── CodePreview.tsx     # Code display
│           │   ├── WelcomeTutorial.tsx # Onboarding
│           │   └── index.ts            # Exports
│           │
│           ├── 🪝 Custom Hooks (6 files)
│           │   ├── useAuth.ts          # Authentication
│           │   ├── useSessions.ts      # Sessions
│           │   ├── useWebSocket.ts     # WebSocket
│           │   ├── useApiKeys.ts       # API keys
│           │   ├── useExamples.ts      # Examples
│           │   └── index.ts            # Exports
│           │
│           ├── 📄 Pages (7 files)
│           │   ├── LoginPage.tsx       # SSO login
│           │   ├── OAuthCallbackPage.tsx # OAuth handler
│           │   ├── DashboardPage.tsx   # Session list
│           │   ├── CreateAgentPage.tsx # Agent wizard
│           │   ├── SessionDetailPage.tsx # Session details
│           │   ├── SettingsPage.tsx    # Settings
│           │   └── index.ts            # Exports
│           │
│           ├── 💾 State Management (1 file)
│           │   └── uiStore.ts          # UI preferences
│           │
│           ├── 📝 Types (1 file)
│           │   └── index.ts            # TypeScript definitions
│           │
│           └── 🛠️ Utilities (4 files)
│               ├── format.ts           # Formatting
│               ├── cn.ts               # Class names
│               ├── constants.ts        # Constants
│               └── index.ts            # Exports
│
├── 📦 Build Output
│   ├── dist/                           # Compiled backend code
│   └── web/dist/                       # Built frontend assets
│
├── 📝 Configuration & Data
│   ├── config/                         # App configuration
│   ├── data/                           # Runtime data
│   ├── logs/                           # Application logs
│   └── generated/                      # Generated agents
│
└── 📖 Additional Resources
    ├── docs/                           # Extended documentation
    ├── examples/                       # Example agents
    └── templates/                      # Agent templates
```

---

## 📊 File Statistics

### Backend Infrastructure
```
src/server/
├── Storage Layer:      4 files  (~800 LOC)
├── Authentication:     2 files  (~400 LOC)
├── Security:           1 file   (~150 LOC)
├── Monitoring:         3 files  (~600 LOC)
├── Middleware:         4 files  (~500 LOC)
├── Routes:             5 files  (~1,200 LOC)
└── Server:             2 files  (~400 LOC)
─────────────────────────────────────────────
Total:                  21 files (~4,050 LOC)

migrations/
└── Database:           1 file   (~400 LOC)
─────────────────────────────────────────────
Backend Total:          22 files (~4,450 LOC)
```

### Frontend Application
```
web/src/
├── Core:               3 files  (~200 LOC)
├── API Layer:          7 files  (~800 LOC)
├── Components:         8 files  (~800 LOC)
├── Hooks:              6 files  (~600 LOC)
├── Pages:              7 files  (~2,000 LOC)
├── State:              1 file   (~50 LOC)
├── Types:              1 file   (~200 LOC)
└── Utilities:          4 files  (~300 LOC)
─────────────────────────────────────────────
Total:                  37 files (~4,950 LOC)

web/ (config)
└── Configuration:      9 files  (~500 LOC)
─────────────────────────────────────────────
Frontend Total:         46 files (~5,450 LOC)
```

### Documentation
```
Root Documentation:     8 files  (~2,300 LOC)
Web Documentation:      5 files  (~1,200 LOC)
─────────────────────────────────────────────
Documentation Total:    13 files (~3,500 LOC)
```

### Grand Total
```
Backend:                22 files (~4,450 LOC)
Frontend:               46 files (~5,450 LOC)
Documentation:          13 files (~3,500 LOC)
─────────────────────────────────────────────
Project Total:          81 files (~13,400 LOC)
```

---

## 🎯 Key Directories Explained

### `/src/server/`
Backend API server code. Contains all Express routes, middleware, authentication, database access, and WebSocket handling.

### `/web/src/`
React frontend application. Contains all pages, components, hooks, API client, and state management.

### `/migrations/`
Database schema and migration files. Currently contains the complete PostgreSQL schema with tables, views, functions, and triggers.

### `/docs/`
Extended documentation for architecture, extending the system, and development guides.

### `/examples/`
Example agent implementations showcasing different output types and features.

### `/templates/`
Code templates used by the agent creation system for generating TypeScript and Python code.

### `/data/`
Runtime data including session logs, patterns, and metrics from the memory system.

### `/dist/`
Compiled JavaScript output from TypeScript. Generated during build process.

---

## 🚀 Quick Navigation

### Want to understand...

**Authentication?**
→ `/src/server/auth/` (backend)
→ `/web/src/api/auth.ts` (frontend)
→ `/web/src/hooks/useAuth.ts` (usage)

**Agent Creation?**
→ `/src/server/routes/agents.ts` (API)
→ `/web/src/pages/CreateAgentPage.tsx` (UI)
→ `/web/src/hooks/useSessions.ts` (logic)

**Real-time Updates?**
→ `/src/server/websocket.ts` (server)
→ `/web/src/hooks/useWebSocket.ts` (client)

**Database?**
→ `/migrations/001_initial_schema.sql` (schema)
→ `/src/server/storage/` (access layer)

**API Keys?**
→ `/src/server/security/encryption.ts` (encryption)
→ `/src/server/routes/api-keys.ts` (API)
→ `/web/src/pages/SettingsPage.tsx` (UI)

**Downloads?**
→ `/src/server/storage/s3-store.ts` (S3)
→ `/src/server/routes/downloads.ts` (API)
→ `/web/src/api/downloads.ts` (client)

---

## 🔍 Find Specific Features

| Feature | Backend File | Frontend File |
|---------|--------------|---------------|
| SSO Login | `/src/server/auth/oauth.ts` | `/web/src/pages/LoginPage.tsx` |
| JWT Tokens | `/src/server/auth/jwt.ts` | `/web/src/api/client.ts` |
| Rate Limiting | `/src/server/middleware/rate-limit.ts` | N/A |
| Logging | `/src/server/monitoring/logger.ts` | Browser console |
| Metrics | `/src/server/monitoring/metrics.ts` | React Query Devtools |
| Session List | `/src/server/routes/sessions.ts` | `/web/src/pages/DashboardPage.tsx` |
| Progress | `/src/server/websocket.ts` | `/web/src/pages/SessionDetailPage.tsx` |
| User Profile | `/src/server/routes/auth.ts` | `/web/src/pages/SettingsPage.tsx` |
| Error Handling | `/src/server/middleware/error-handler.ts` | `/web/src/components/ErrorBoundary.tsx` |
| API Client | N/A | `/web/src/api/client.ts` |

---

## 📦 Build Artifacts

### Backend Build
```
dist/
└── server/
    ├── storage/
    ├── auth/
    ├── security/
    ├── monitoring/
    ├── middleware/
    ├── routes/
    ├── index.js
    └── websocket.js
```

### Frontend Build
```
web/dist/
├── assets/
│   ├── index-[hash].js      # Main bundle
│   ├── vendor-[hash].js     # React vendor chunk
│   ├── query-[hash].js      # React Query chunk
│   └── ui-[hash].js         # UI vendor chunk
├── index.html
└── vite.svg
```

---

## 🌳 Git Structure

```
.git/
├── branches/
├── hooks/
├── objects/
└── refs/

.gitignore covers:
├── node_modules/
├── dist/
├── build/
├── .env
├── logs/*.log
└── generated/
```

---

## 📚 Documentation Map

### Setup & Getting Started
1. `README.md` - Start here
2. `web/SETUP.md` - Frontend setup
3. `BACKEND_COMPLETE.md` - Backend setup

### Development
4. `web/QUICK_REFERENCE.md` - Quick commands
5. `INTEGRATION_GUIDE.md` - Integration details
6. `PROJECT_STRUCTURE.md` - This file

### Reference
7. `web/FRONTEND_COMPLETE.md` - Frontend details
8. `WEB_APP_SUMMARY.md` - Frontend summary
9. `FULL_STACK_COMPLETE.md` - Complete overview

---

## 🎯 Entry Points

### Development
- Backend: `npm run start:server` → `/src/server/index.ts`
- Frontend: `cd web && npm run dev` → `/web/src/main.tsx`

### Production
- Backend: `node dist/server/index.js`
- Frontend: Serve `/web/dist/` via Nginx/CDN

### Testing
- API: `curl http://localhost:3000/health`
- Web: `open http://localhost:5173`

---

**Project Structure Documentation**
_Last Updated: 2026-02-06_
_Total Files: 81_
_Total Lines: ~13,400_
