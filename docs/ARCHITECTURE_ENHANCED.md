# Agent-Builder Architecture (Enhanced)

Comprehensive technical architecture with sequence diagrams and component interactions.

## Table of Contents
- [System Overview](#system-overview)
- [Architecture Layers](#architecture-layers)
- [Component Diagrams](#component-diagrams)
- [Sequence Diagrams](#sequence-diagrams)
- [Database Schema](#database-schema)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)

---

## System Overview

Agent-Builder is a full-stack application for creating LLM-based agents through a five-phase workflow leveraging Claude's extended thinking capabilities.

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[CLI Interface<br/>yargs + inquirer]
        WebApp[Web Application<br/>React + Vite]
    end

    subgraph "API Layer"
        Express[Express REST API<br/>24 Endpoints]
        WS[WebSocket Server<br/>Real-time Updates]
    end

    subgraph "Business Logic"
        WC[Workflow Coordinator<br/>5-Phase Pipeline]
        AF[Agent Factory<br/>Creates Agents]
        Agents[Specialized Agents<br/>Clarification, Design, etc.]
    end

    subgraph "External Services"
        Claude[Claude API<br/>Extended Thinking]
        S3[AWS S3<br/>Artifact Storage]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Users, Sessions, Keys)]
        Memory[Memory System<br/>Pattern Recognition]
    end

    CLI --> WC
    WebApp --> Express
    WebApp --> WS
    Express --> WC
    WC --> AF
    AF --> Agents
    Agents --> Claude
    WC --> S3
    Express --> PG
    WC --> Memory
    WS --> PG
```

---

## Architecture Layers

### 1. Presentation Layer

**CLI Interface** (`src/cli/`):
- Command-line interface using yargs
- Interactive mode with inquirer
- Configuration management
- Output formatting with chalk

**Web Application** (planned - `web/`):
- React with TypeScript
- Tailwind CSS for styling
- React Query for API state management
- WebSocket client for real-time updates

### 2. API Layer

**REST API** (`src/server/`):
- Express.js with TypeScript
- 24 REST endpoints across 5 route groups
- JWT-based authentication
- Rate limiting and security middleware
- Prometheus metrics endpoint

**WebSocket Server** (`src/server/websocket.ts`):
- Real-time session progress updates
- JWT authentication via query params
- Heartbeat for connection health
- Session-based connection management

### 3. Business Logic Layer

**Workflow Coordinator** (`src/orchestration/`):
- Orchestrates 5-phase agent creation pipeline
- Manages context and state transitions
- Coordinates parallel agent execution
- Integrates with memory system

**Agent System** (`src/agents/`):
- BaseAgent abstract class with lifecycle management
- Specialized agents for each phase
- Retry logic and timeout handling
- Claude API integration

**Template System** (`src/templates/`):
- Handlebars-based code generation
- Multi-format support (Skills, MCP, CLI, Library)
- Multi-language support (TypeScript, Python)
- Inline fallback templates

### 4. Integration Layer

**Claude Integration** (`src/claude/`):
- Anthropic SDK wrapper
- Extended thinking support (up to 10K tokens)
- Retry logic with exponential backoff
- Response parsing with Zod validation

**AWS S3 Integration** (`src/server/storage/s3-store.ts`):
- Artifact upload/download
- Presigned URL generation
- Metadata management
- Multipart upload for large files

### 5. Data Layer

**PostgreSQL Database** (`src/server/storage/`):
- User management and SSO authentication
- Session tracking with progress
- Encrypted API key storage (AES-256-GCM)
- Audit logging
- Connection pooling (max 20 connections)

**Memory System** (`src/memory/`):
- JSONL-based session storage
- Pattern matching with cosine similarity
- Metrics tracking and aggregation
- Learning from successful sessions

---

## Component Diagrams

### High-Level Component Interaction

```mermaid
graph LR
    subgraph "Client"
        User[User]
    end

    subgraph "Backend"
        API[REST API]
        WS[WebSocket]
        Auth[Auth System]
        Workflow[Workflow<br/>Coordinator]
        DB[(Database)]
        S3[(S3)]
    end

    subgraph "External"
        Claude[Claude API]
    end

    User -->|HTTP Requests| API
    User -->|WebSocket| WS
    API --> Auth
    Auth --> DB
    API --> Workflow
    Workflow --> Claude
    Workflow --> S3
    Workflow --> DB
    WS --> DB
    WS -->|Progress Updates| User
```

### Workflow Coordinator Internal Structure

```mermaid
graph TB
    WC[Workflow Coordinator]
    AF[Agent Factory]

    WC --> Phase1[Phase 1:<br/>Clarification Agent]
    WC --> Phase2[Phase 2:<br/>Design Agent<br/>Extended Thinking]
    WC --> Phase3A[Phase 3a:<br/>Implementation Agent]
    WC --> Phase3B[Phase 3b:<br/>Testing Agent]
    WC --> Phase3C[Phase 3c:<br/>Documentation Agent]
    WC --> Phase4[Phase 4:<br/>Packaging Agent]
    WC --> Phase5[Phase 5:<br/>Memory System]

    AF -.creates.-> Phase1
    AF -.creates.-> Phase2
    AF -.creates.-> Phase3A
    AF -.creates.-> Phase3B
    AF -.creates.-> Phase3C
    AF -.creates.-> Phase4

    Phase3A -.parallel.-> Phase3B
    Phase3B -.parallel.-> Phase3C

    Phase1 --> Context[Context Object]
    Phase2 --> Context
    Phase3A --> Context
    Phase3B --> Context
    Phase3C --> Context
    Phase4 --> Context
    Phase5 --> Context
```

### Authentication Flow Components

```mermaid
graph TB
    Client[Client/Browser]
    API[Express API]
    OAuth[OAuth Provider<br/>Google/Azure/Okta]
    JWT[JWT Manager]
    DB[(Database)]
    Encrypt[Encryption<br/>Module]

    Client -->|1. Initiate Login| API
    API -->|2. Redirect| OAuth
    OAuth -->|3. User Authenticates| OAuth
    OAuth -->|4. Callback with Code| API
    API -->|5. Verify with Provider| OAuth
    API -->|6. Create/Update User| DB
    API -->|7. Generate JWT| JWT
    JWT -->|8. Hash Token| Encrypt
    API -->|9. Store Session| DB
    API -->|10. Return Token| Client
```

---

## Sequence Diagrams

### Complete Agent Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as REST API
    participant Auth as Auth System
    participant DB as Database
    participant WS as WebSocket
    participant WC as Workflow Coordinator
    participant Claude as Claude API
    participant S3 as AWS S3

    U->>API: POST /api/agents/create
    API->>Auth: Verify JWT
    Auth->>DB: Check user session
    DB-->>Auth: Session valid
    Auth-->>API: User authenticated

    API->>DB: Check API key exists
    DB-->>API: Encrypted key data
    API->>API: Decrypt API key

    API->>DB: Create session record
    DB-->>API: Session ID
    API-->>U: 202 Accepted<br/>{sessionId}

    par Async Workflow Execution
        API->>WC: Start workflow(sessionId)

        WC->>DB: Update status=in_progress
        WC->>WS: Broadcast(session_update)
        WS-->>U: Progress: Starting

        Note over WC,Claude: Phase 1: Clarification
        WC->>Claude: Generate questions
        Claude-->>WC: Questions
        WC->>WS: Broadcast(phase_change)
        WS-->>U: Phase: Clarification

        Note over WC,Claude: Phase 2: Design (Extended Thinking)
        WC->>Claude: Design with 10K thinking
        Claude-->>WC: Architecture + Thinking Trace
        WC->>WS: Broadcast(progress: 0.4)
        WS-->>U: Progress: 40%

        Note over WC,Claude: Phase 3: Implementation (Parallel)
        par Parallel Execution
            WC->>Claude: Generate code
            WC->>Claude: Generate tests
            WC->>Claude: Generate docs
        end
        Claude-->>WC: Code + Tests + Docs
        WC->>WS: Broadcast(progress: 0.8)
        WS-->>U: Progress: 80%

        Note over WC,S3: Phase 4: Packaging
        WC->>WC: Package artifacts
        WC->>S3: Upload artifacts.zip
        S3-->>WC: S3 key

        Note over WC,DB: Phase 5: Learning
        WC->>DB: Store patterns
        WC->>DB: Update session(completed)
        WC->>WS: Broadcast(completed)
        WS-->>U: Completed!
    end

    U->>API: GET /api/downloads/:sessionId/artifacts
    API->>S3: Fetch artifacts
    S3-->>API: ZIP file
    API-->>U: artifacts.zip
```

### Authentication Flow (SSO)

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as Express API
    participant OAuth as OAuth Provider
    participant DB as Database
    participant Encrypt as Encryption

    B->>API: GET /api/auth/google
    API->>OAuth: Redirect to consent
    OAuth-->>B: Show consent screen

    B->>OAuth: User approves
    OAuth->>API: GET /callback?code=xyz
    API->>OAuth: Exchange code for tokens
    OAuth-->>API: Access token + Profile

    API->>DB: SELECT user by email
    alt User exists
        DB-->>API: User record
        API->>DB: UPDATE last_login
    else User doesn't exist
        API->>DB: INSERT new user
        DB-->>API: User ID
    end

    API->>API: Generate JWT
    API->>Encrypt: Hash token (SHA-256)
    Encrypt-->>API: Token hash

    API->>DB: INSERT user_session
    DB-->>API: Session ID

    API-->>B: Redirect to frontend<br/>?token=jwt_token
    B->>B: Store token in memory/storage
    B->>API: GET /api/auth/me<br/>Authorization: Bearer jwt_token
    API->>Encrypt: Verify JWT signature
    Encrypt-->>API: Token valid
    API->>DB: SELECT user by ID
    DB-->>API: User data
    API-->>B: User profile + session info
```

### WebSocket Connection and Updates

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket Server
    participant JWT as JWT Verifier
    participant DB as Database
    participant WC as Workflow

    C->>WS: Connect ws://...?token=xxx&sessionId=yyy
    WS->>JWT: Verify token
    JWT->>DB: Check session validity
    DB-->>JWT: Valid
    JWT-->>WS: User ID

    WS->>WS: Add to session connections
    WS-->>C: {type: "connected"}

    loop Every 30 seconds
        WS->>C: ping
        C->>WS: pong
    end

    Note over WC: Agent creation in progress

    WC->>DB: Update session progress
    WC->>WS: broadcastSessionUpdate({...})
    WS->>WS: Get connections for session
    WS-->>C: {type: "progress", data: {...}}

    WC->>DB: Update phase
    WC->>WS: broadcastSessionUpdate({...})
    WS-->>C: {type: "phase_change", data: {...}}

    WC->>DB: Mark completed
    WC->>WS: broadcastSessionUpdate({...})
    WS-->>C: {type: "completed", data: {...}}

    C->>WS: Close connection
    WS->>WS: Remove from connections
```

### API Key Storage and Encryption

```mermaid
sequenceDiagram
    participant U as User
    participant API as API Endpoint
    participant Auth as Auth Middleware
    participant Encrypt as Encryption Module
    participant DB as Database
    participant Audit as Audit Logger

    U->>API: POST /api/api-keys<br/>{apiKey: "sk-ant-..."}
    API->>Auth: Verify JWT
    Auth-->>API: User ID

    API->>API: Validate format<br/>(starts with sk-ant-)

    API->>Encrypt: encrypt(apiKey)
    Encrypt->>Encrypt: Generate random IV (16 bytes)
    Encrypt->>Encrypt: AES-256-GCM encrypt
    Encrypt->>Encrypt: Extract auth tag
    Encrypt-->>API: {encrypted, iv, authTag}

    API->>DB: Check existing key
    alt Has existing key
        API->>DB: UPDATE user_api_keys<br/>SET encrypted_key, iv, auth_tag
    else No existing key
        API->>DB: INSERT INTO user_api_keys
    end
    DB-->>API: Success

    API->>Audit: Log(api_key_added, userID)
    Audit->>DB: INSERT INTO audit_log
    API-->>U: {success: true}

    Note over U: Later: Agent creation

    U->>API: POST /api/agents/create
    API->>DB: SELECT encrypted_key, iv, auth_tag
    DB-->>API: Encrypted data
    API->>Encrypt: decrypt({encrypted, iv, authTag})
    Encrypt->>Encrypt: AES-256-GCM decrypt
    Encrypt->>Encrypt: Verify auth tag
    Encrypt-->>API: Plain API key
    API->>API: Use key for Claude API
```

### Five-Phase Workflow Execution

```mermaid
sequenceDiagram
    participant WC as Workflow Coordinator
    participant AF as Agent Factory
    participant CA as Clarification Agent
    participant DA as Design Agent
    participant IA as Implementation Agent
    participant PA as Packaging Agent
    participant MS as Memory System
    participant Claude as Claude API
    participant DB as Database

    WC->>WC: Initialize context
    WC->>DB: Create session record

    Note over WC,Claude: PHASE 1: Clarification (2-3 rounds)
    WC->>AF: Create ClarificationAgent
    AF-->>WC: Agent instance
    WC->>CA: execute(context)
    loop 2-3 rounds
        CA->>Claude: Generate questions
        Claude-->>CA: Questions
        CA->>CA: Get user answers
        CA->>Claude: Refine requirements
    end
    Claude-->>CA: Final requirements
    CA-->>WC: Requirements object
    WC->>WC: context.withRequirements(req)

    Note over WC,Claude: PHASE 2: Design (Extended Thinking)
    WC->>MS: findSimilarPatterns(requirements)
    MS-->>WC: Similar patterns
    WC->>AF: Create DesignAgent
    WC->>DA: execute(context)
    DA->>Claude: Design request<br/>thinking_budget: 10000
    Note over Claude: Extended thinking:<br/>Analyze architectures,<br/>evaluate trade-offs
    Claude-->>DA: Design + Thinking trace
    DA-->>WC: Design object
    WC->>WC: context.withDesign(design)

    Note over WC,Claude: PHASE 3: Implementation (Parallel)
    par Implementation Agent
        WC->>AF: Create ImplementationAgent
        WC->>IA: execute(context)
        IA->>Claude: Generate code
        Claude-->>IA: Source code
    and Testing Agent
        WC->>AF: Create TestingAgent
        WC->>IA: execute(context)
        IA->>Claude: Generate tests
        Claude-->>IA: Test files
    and Documentation Agent
        WC->>AF: Create DocumentationAgent
        WC->>IA: execute(context)
        IA->>Claude: Generate docs
        Claude-->>IA: README, API docs
    end
    IA-->>WC: Implementation object
    WC->>WC: context.withImplementation(impl)

    Note over WC,PA: PHASE 4: Packaging
    WC->>AF: Create PackagingAgent
    WC->>PA: execute(context)
    PA->>PA: Select template<br/>(MCP/Skill/CLI/Library)
    PA->>PA: Render templates
    PA->>PA: Create package structure
    PA-->>WC: Artifacts + file paths

    Note over WC,MS: PHASE 5: Learning
    WC->>MS: captureSession(context)
    MS->>MS: Extract patterns
    MS->>MS: Update metrics
    MS->>DB: Store learnings
    MS-->>WC: Learning complete

    WC->>DB: Update session(completed)
    WC-->>API: Build result
```

---

## Database Schema

### Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_SESSIONS : has
    USERS ||--o{ USER_API_KEYS : has
    USERS ||--o{ SESSIONS : creates
    USERS ||--o{ AUDIT_LOG : generates
    SESSIONS ||--o{ AUDIT_LOG : tracks

    USERS {
        uuid id PK
        varchar email UK
        varchar name
        varchar sso_provider
        varchar sso_id
        timestamp created_at
        timestamp last_login
    }

    USER_SESSIONS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        timestamp expires_at
        timestamp created_at
    }

    USER_API_KEYS {
        uuid id PK
        uuid user_id FK
        text encrypted_key
        varchar iv
        varchar auth_tag
        boolean is_valid
        timestamp last_validated
        timestamp created_at
        timestamp updated_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        text user_request
        varchar status
        varchar current_phase
        float progress
        varchar output_type
        varchar language
        varchar artifacts_s3_key
        text error
        jsonb metadata
        timestamp created_at
        timestamp updated_at
        timestamp completed_at
    }

    AUDIT_LOG {
        bigserial id PK
        uuid user_id FK
        uuid session_id FK
        varchar event_type
        inet ip_address
        text user_agent
        jsonb details
        timestamp created_at
    }
```

### Key Database Features

**Indexes**:
- B-tree indexes on all foreign keys
- Composite index on `(user_id, status)` for session queries
- Partial index on `expires_at` for active sessions only

**Triggers**:
- Auto-update `updated_at` timestamp on row modification
- Cleanup expired sessions (can be called via cron)

**Views**:
- `active_sessions_view`: Join sessions with user info
- `user_session_stats`: Aggregate statistics per user

**Functions**:
- `cleanup_expired_sessions()`: Remove expired JWT sessions
- `cleanup_old_sessions()`: Remove sessions older than 7 days
- `update_updated_at_column()`: Trigger function for timestamps

---

## Security Architecture

### Multi-Layer Security Model

```mermaid
graph TB
    subgraph "Request Flow"
        Client[Client Request]
        Helmet[Helmet.js<br/>Security Headers]
        CORS[CORS<br/>Origin Check]
        RateLimit[Rate Limiting]
        Auth[JWT Auth]
        Handler[Route Handler]
        Response[Response]
    end

    Client --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> Auth
    Auth --> Handler
    Handler --> Response

    subgraph "Data Security"
        APIKey[API Keys]
        Encrypt[AES-256-GCM]
        DB[(Encrypted Storage)]

        APIKey --> Encrypt
        Encrypt --> DB
    end

    subgraph "Authentication"
        OAuth[OAuth Provider]
        JWT[JWT Token]
        Session[Session Store]

        OAuth --> JWT
        JWT --> Session
    end
```

### Encryption Details

**API Key Encryption** (AES-256-GCM):
```
Key: 32 bytes (from ENCRYPTION_KEY env var)
IV: 16 bytes random per encryption
Algorithm: AES-256-GCM
Auth Tag: 16 bytes for integrity verification

Storage Format:
{
  encrypted: base64(ciphertext),
  iv: hex(initialization_vector),
  authTag: hex(authentication_tag)
}
```

**JWT Token Format**:
```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "userId": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1707217200,
  "exp": 1707822000,
  "iss": "agent-builder"
}

Signature: HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

**Token Storage**:
- Token never stored in plain text
- SHA-256 hash stored in database
- Constant-time comparison for lookup

### Rate Limiting Strategy

```mermaid
graph LR
    Request[Incoming Request]
    RL[Rate Limiter]
    Store[(Redis/Memory)]

    Request --> RL
    RL --> Store
    Store -.count.-> RL

    RL -->|Within Limit| Allow[Allow Request]
    RL -->|Exceeded| Block[429 Response]
```

**Configuration**:
- Standard endpoints: 100 req/15min per IP
- Auth endpoints: 10 req/15min per IP
- Agent creation: 10 req/hour per user
- Downloads: 50 req/15min per user

---

## Performance Considerations

### Caching Strategy

```mermaid
graph TB
    Client[Client]
    CDN[CDN<br/>Static Assets]
    API[API Server]
    Cache[(Redis Cache<br/>Future)]
    DB[(PostgreSQL)]
    S3[(S3)]

    Client -->|Static| CDN
    Client -->|API| API
    API -->|Check| Cache
    Cache -.miss.-> DB
    DB -.populate.-> Cache
    Cache -.hit.-> API
    API --> S3
```

**Current**:
- Database connection pooling (20 connections)
- No application-level caching yet

**Future Enhancements**:
- Redis for session data
- CloudFront CDN for S3 artifacts
- API response caching for read-heavy endpoints

### Scaling Considerations

**Horizontal Scaling**:
```
                    Load Balancer
                         |
        +----------------+----------------+
        |                |                |
    Server 1         Server 2         Server 3
        |                |                |
        +----------------+----------------+
                         |
                  PostgreSQL
                  (Read Replicas)
```

**Bottlenecks**:
1. Claude API rate limits (mitigated by user-provided keys)
2. Database connections (pool of 20, can increase)
3. S3 upload bandwidth (use multipart for large files)
4. WebSocket connections (use sticky sessions with load balancer)

### Performance Metrics

| Operation | Target | Current |
|-----------|--------|---------|
| API Response (p95) | <500ms | ~200ms |
| WebSocket Latency | <100ms | ~50ms |
| DB Query (p95) | <50ms | ~20ms |
| Agent Creation | 20-35min | 25min avg |
| Artifact Upload | <30s | ~15s |

---

## Deployment Architecture

### AWS Deployment

```mermaid
graph TB
    subgraph "Internet"
        Users[Users]
    end

    subgraph "AWS Cloud"
        subgraph "VPC"
            ALB[Application<br/>Load Balancer]

            subgraph "Public Subnet"
                NAT[NAT Gateway]
            end

            subgraph "Private Subnet"
                API1[API Server 1<br/>ECS Task]
                API2[API Server 2<br/>ECS Task]
            end

            subgraph "Private Subnet"
                RDS[(RDS PostgreSQL<br/>Multi-AZ)]
            end
        end

        S3[(S3 Bucket<br/>Artifacts)]
        CloudWatch[CloudWatch<br/>Logs & Metrics]
    end

    Users --> ALB
    ALB --> API1
    ALB --> API2
    API1 --> RDS
    API2 --> RDS
    API1 --> S3
    API2 --> S3
    API1 --> NAT
    API2 --> NAT
    NAT --> Claude[Claude API]
    API1 --> CloudWatch
    API2 --> CloudWatch
```

**Key Components**:
- **ECS Fargate**: Serverless containers for API
- **RDS Multi-AZ**: High availability database
- **S3**: Artifact storage with versioning
- **ALB**: SSL termination, WebSocket support
- **CloudWatch**: Centralized logging and monitoring
- **Secrets Manager**: Store JWT_SECRET, ENCRYPTION_KEY

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.8
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 15+
- **ORM**: Raw SQL with pg driver
- **WebSocket**: ws library 8.16
- **Authentication**: Passport.js with OAuth2 strategies

### Security
- **Encryption**: Node crypto (AES-256-GCM)
- **JWT**: jsonwebtoken library
- **Security Headers**: Helmet.js
- **Rate Limiting**: express-rate-limit

### Monitoring
- **Logging**: Winston 3.11
- **Metrics**: Prometheus (prom-client)
- **Audit**: Custom PostgreSQL-based audit log

### Storage
- **S3 SDK**: @aws-sdk/client-s3
- **Presigned URLs**: @aws-sdk/s3-request-presigner
- **Multipart Upload**: @aws-sdk/lib-storage

### AI Integration
- **Claude SDK**: @anthropic-ai/sdk 0.30
- **Extended Thinking**: Custom parameter injection
- **Validation**: Zod 3.23

---

## Design Patterns Used

1. **Factory Pattern**: AgentFactory creates specialized agents
2. **Strategy Pattern**: PerformanceOptimizer applies different strategies
3. **Observer Pattern**: WebSocket broadcasts to subscribers
4. **Template Method**: BaseAgent defines lifecycle, subclasses implement
5. **Singleton**: Database connection pool
6. **Dependency Injection**: Constructor injection for testability
7. **Repository Pattern**: SessionStore, UserStore abstract database access

---

## Future Enhancements

1. **Caching Layer**: Redis for session data and API responses
2. **Queue System**: Bull/BullMQ for background job processing
3. **Multi-Region**: Deploy to multiple AWS regions
4. **CDN**: CloudFront for artifact downloads
5. **GraphQL API**: Alternative to REST for complex queries
6. **Real-time Collaboration**: Multiple users on same session
7. **Plugin System**: User-defined agent types and templates
8. **A/B Testing**: Experiment with different prompts and strategies

---

For more details, see:
- [API Documentation](./API.md)
- [Quick Start Guide](./QUICK_START.md)
- [Performance Guide](./PERFORMANCE.md)
- [Security Guide](./SECURITY.md)
