# System Architecture

## Overview

Agent-Builder is a dual-distribution platform operating as both a CLI tool and a full-stack web application. The system creates LLM-based agents through a sophisticated five-phase workflow, leveraging Claude's extended thinking capabilities and shared learning patterns.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[CLI Tool<br/>Node.js + TypeScript]
        WEB[Web Application<br/>React 18 + Vite]
    end

    subgraph "API Layer"
        ALB[Application Load Balancer<br/>AWS ALB]
        API[API Server<br/>Express.js + TypeScript]
        WS[WebSocket Server<br/>ws library]
    end

    subgraph "Business Logic"
        WF[Workflow Coordinator<br/>5-Phase Pipeline]
        AGENTS[Agent System<br/>6 Specialized Agents]
        LLM[LLM Factory<br/>Multi-Provider Support]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>AWS RDS)]
        S3[S3 Buckets<br/>Artifact Storage]
        CACHE[Redis<br/>ElastiCache]
    end

    subgraph "External Services"
        CLAUDE[Claude API<br/>Extended Thinking]
        OPENAI[OpenAI API]
        GEMINI[Google Gemini]
        OAUTH[OAuth Providers<br/>Google/Azure/Okta]
    end

    CLI --> API
    WEB --> ALB
    ALB --> API
    WEB --> WS

    API --> WF
    WF --> AGENTS
    AGENTS --> LLM

    LLM --> CLAUDE
    LLM --> OPENAI
    LLM --> GEMINI

    API --> PG
    API --> S3
    API --> CACHE
    API --> OAUTH

    WS --> PG

    style CLI fill:#e1f5ff
    style WEB fill:#e1f5ff
    style API fill:#fff4e1
    style WF fill:#f0e1ff
    style PG fill:#e1ffe1
    style S3 fill:#e1ffe1
```

## Component Architecture

### Frontend Architecture (Web Application)

```mermaid
graph LR
    subgraph "React Application"
        ROUTER[React Router<br/>Routing]
        PAGES[Pages Layer<br/>7 Pages]
        COMP[Components<br/>8 Reusable]
        HOOKS[Custom Hooks<br/>6 Hooks]
    end

    subgraph "State Management"
        QUERY[React Query<br/>Server State]
        ZUSTAND[Zustand<br/>UI State]
        LOCAL[LocalStorage<br/>Persistence]
    end

    subgraph "API Communication"
        CLIENT[Axios Client<br/>HTTP]
        WSLIB[WebSocket<br/>Real-time]
    end

    ROUTER --> PAGES
    PAGES --> COMP
    PAGES --> HOOKS

    HOOKS --> QUERY
    HOOKS --> ZUSTAND
    HOOKS --> LOCAL

    HOOKS --> CLIENT
    HOOKS --> WSLIB

    CLIENT --> API[Backend API]
    WSLIB --> WS[WebSocket Server]

    style ROUTER fill:#e1f5ff
    style QUERY fill:#fff4e1
    style CLIENT fill:#f0e1ff
```

### Backend Architecture

```mermaid
graph TB
    subgraph "Entry Point"
        EXPRESS[Express Server<br/>Port 3000]
        HELMET[Helmet<br/>Security Headers]
        CORS[CORS<br/>Cross-Origin]
    end

    subgraph "Middleware Layer"
        AUTH[Auth Middleware<br/>JWT Verification]
        RATE[Rate Limiter<br/>Token Bucket]
        LOG[Request Logger<br/>Winston]
        ERROR[Error Handler<br/>Global]
    end

    subgraph "Route Layer"
        AUTH_R[/auth Routes]
        AGENTS_R[/agents Routes]
        SESS_R[/sessions Routes]
        KEYS_R[/api-keys Routes]
        DOWN_R[/downloads Routes]
    end

    subgraph "Service Layer"
        SESSION_SVC[Session Store]
        USER_SVC[User Store]
        LEARN_SVC[Learning Store]
        S3_SVC[S3 Store]
        ENCRYPT[Encryption Service]
    end

    subgraph "Core Engine"
        WF_COORD[Workflow Coordinator]
        AGENT_FACT[Agent Factory]
        PERF_OPT[Performance Optimizer]
        MEM_MGR[Memory Manager]
    end

    EXPRESS --> HELMET
    EXPRESS --> CORS
    EXPRESS --> AUTH
    EXPRESS --> RATE
    EXPRESS --> LOG

    AUTH --> AUTH_R
    AUTH --> AGENTS_R
    AUTH --> SESS_R
    AUTH --> KEYS_R
    AUTH --> DOWN_R

    AGENTS_R --> SESSION_SVC
    AGENTS_R --> WF_COORD
    SESS_R --> SESSION_SVC
    KEYS_R --> ENCRYPT
    DOWN_R --> S3_SVC

    WF_COORD --> AGENT_FACT
    WF_COORD --> PERF_OPT
    WF_COORD --> MEM_MGR

    SESSION_SVC --> PG[(PostgreSQL)]
    S3_SVC --> S3[(S3)]

    EXPRESS --> ERROR

    style EXPRESS fill:#e1f5ff
    style WF_COORD fill:#f0e1ff
    style PG fill:#e1ffe1
```

## Data Architecture

### Database Schema (PostgreSQL)

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
        varchar token_hash
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

### Storage Architecture

```mermaid
graph TB
    subgraph "S3 Bucket Structure"
        BUCKET[agent-builder-artifacts]

        subgraph "Session Artifacts"
            SESS1[session-{uuid}/]
            CODE1[├─ src/]
            TESTS1[├─ tests/]
            DOCS1[├─ docs/]
            PKG1[└─ package.json]
        end

        subgraph "Lifecycle Policy"
            RULE1[Standard: 0-7 days]
            RULE2[Glacier: After 7 days]
            RULE3[Delete: After 90 days]
        end

        BUCKET --> SESS1
        SESS1 --> CODE1
        SESS1 --> TESTS1
        SESS1 --> DOCS1
        SESS1 --> PKG1

        BUCKET -.lifecycle.-> RULE1
        RULE1 --> RULE2
        RULE2 --> RULE3
    end

    subgraph "Access Patterns"
        UPLOAD[Upload:<br/>Direct from API]
        DOWNLOAD[Download:<br/>Presigned URLs]
        EXPIRE[Expiration:<br/>7-day retention]
    end

    API[API Server] --> UPLOAD
    UPLOAD --> BUCKET
    CLIENT[Web Client] --> DOWNLOAD
    DOWNLOAD --> BUCKET
    BUCKET --> EXPIRE

    style BUCKET fill:#e1ffe1
    style API fill:#fff4e1
```

## Deployment Architecture (AWS)

```mermaid
graph TB
    subgraph "Internet"
        USER[Users]
        GITHUB[GitHub Actions<br/>CI/CD]
    end

    subgraph "AWS Cloud - VPC"
        subgraph "Public Subnets"
            ALB[Application Load Balancer<br/>HTTPS:443]
            NAT[NAT Gateway]
        end

        subgraph "Private Subnets - AZ1"
            ECS1[ECS Fargate<br/>Backend API]
            ECS2[ECS Fargate<br/>Frontend]
        end

        subgraph "Private Subnets - AZ2"
            ECS3[ECS Fargate<br/>Backend API]
            ECS4[ECS Fargate<br/>Frontend]
        end

        subgraph "Data Layer"
            RDS[(RDS PostgreSQL<br/>Multi-AZ)]
            REDIS[(ElastiCache Redis)]
        end

        subgraph "Storage"
            S3[(S3 Buckets)]
            ECR[ECR<br/>Docker Images]
        end

        subgraph "Monitoring"
            CW[CloudWatch<br/>Logs & Metrics]
            XRAY[X-Ray<br/>Tracing]
        end

        subgraph "Security"
            SECRETS[Secrets Manager]
            KMS[KMS<br/>Encryption Keys]
            WAF[WAF<br/>Web Firewall]
        end
    end

    USER --> ALB
    GITHUB --> ECR

    ALB --> ECS1
    ALB --> ECS2
    ALB --> ECS3
    ALB --> ECS4

    WAF --> ALB

    ECS1 --> RDS
    ECS3 --> RDS
    ECS1 --> REDIS
    ECS3 --> REDIS
    ECS1 --> S3
    ECS3 --> S3

    ECS1 --> SECRETS
    ECS3 --> SECRETS

    ECS1 --> NAT
    ECS3 --> NAT
    NAT --> CLAUDE[Claude API]

    ECS1 --> CW
    ECS2 --> CW
    ECS3 --> CW
    ECS4 --> CW

    S3 -.encrypted.-> KMS

    style ALB fill:#ff9999
    style ECS1 fill:#99ccff
    style ECS3 fill:#99ccff
    style RDS fill:#99ff99
    style S3 fill:#99ff99
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Web App
    participant API
    participant OAuth as OAuth Provider
    participant DB as PostgreSQL

    User->>Web: Click "Login with Google"
    Web->>API: GET /api/auth/google
    API->>OAuth: Redirect to OAuth consent
    OAuth->>User: Show consent screen
    User->>OAuth: Approve
    OAuth->>API: Redirect with code
    API->>OAuth: Exchange code for profile
    OAuth-->>API: User profile

    API->>DB: Find or create user
    DB-->>API: User record

    API->>API: Generate JWT token
    API->>DB: Store session

    API-->>Web: Return token + user
    Web->>Web: Store token in localStorage

    Note over Web,API: Subsequent requests include token

    User->>Web: Navigate to dashboard
    Web->>API: GET /api/sessions<br/>Authorization: Bearer {token}
    API->>API: Verify JWT
    API->>DB: Fetch sessions
    DB-->>API: Session list
    API-->>Web: Sessions data
```

## Agent Creation Workflow

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant API
    participant WS as WebSocket
    participant WF as Workflow Coordinator
    participant Claude as Claude API
    participant S3

    User->>Web: Submit agent request
    Web->>API: POST /api/agents/create

    API->>API: Validate API key
    API->>DB: Create session record
    DB-->>API: Session ID

    API-->>Web: 202 Accepted {sessionId}
    Web->>WS: Connect & subscribe(sessionId)

    par Background Workflow
        API->>WF: Start workflow

        Note over WF,Claude: Phase 1: Clarification
        WF->>Claude: Generate questions
        Claude-->>WF: Questions
        WF->>WS: Progress update (10%)
        WS-->>Web: Update UI

        Note over WF,Claude: Phase 2: Design (Extended Thinking)
        WF->>Claude: Design with thinking
        Claude-->>WF: Architecture + thinking trace
        WF->>WS: Progress update (30%)
        WS-->>Web: Update UI

        Note over WF,Claude: Phase 3: Implementation (Parallel)
        par Code Generation
            WF->>Claude: Generate code
            Claude-->>WF: Source code
        and Test Generation
            WF->>Claude: Generate tests
            Claude-->>WF: Test files
        and Doc Generation
            WF->>Claude: Generate docs
            Claude-->>WF: Documentation
        end
        WF->>WS: Progress update (70%)
        WS-->>Web: Update UI

        Note over WF: Phase 4: Packaging
        WF->>WF: Package artifacts
        WF->>WS: Progress update (90%)
        WS-->>Web: Update UI

        WF->>S3: Upload artifacts
        S3-->>WF: S3 key

        WF->>DB: Update session (completed)
        WF->>WS: Progress update (100%)
        WS-->>Web: Update UI
    end

    User->>Web: Click download
    Web->>API: GET /api/downloads/{id}/artifacts
    API->>S3: Fetch ZIP
    S3-->>API: File stream
    API-->>Web: ZIP file
```

## Real-Time Communication

```mermaid
graph TB
    subgraph "WebSocket Architecture"
        WEB1[Web Client 1]
        WEB2[Web Client 2]
        WEB3[Web Client 3]

        WSS[WebSocket Server<br/>ws library]

        subgraph "Connection Manager"
            CONN[Connection Pool]
            SUB[Subscription Manager]
            HEART[Heartbeat Monitor]
        end

        subgraph "Message Routing"
            ROUTER[Message Router]
            FILTER[Session Filter]
            BROADCAST[Broadcaster]
        end

        WF[Workflow Coordinator]
    end

    WEB1 <--> WSS
    WEB2 <--> WSS
    WEB3 <--> WSS

    WSS --> CONN
    CONN --> SUB
    CONN --> HEART

    WF --> ROUTER
    ROUTER --> FILTER
    FILTER --> BROADCAST

    BROADCAST --> WEB1
    BROADCAST --> WEB2
    BROADCAST --> WEB3

    style WSS fill:#e1f5ff
    style ROUTER fill:#fff4e1
    style WF fill:#f0e1ff
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            WAF[AWS WAF<br/>OWASP Rules]
            SG[Security Groups<br/>Port Restrictions]
            NACL[Network ACLs]
        end

        subgraph "Application Security"
            HELMET[Helmet.js<br/>Security Headers]
            CORS_M[CORS<br/>Origin Control]
            RATE_L[Rate Limiting<br/>Token Bucket]
            INPUT[Input Validation<br/>Zod Schemas]
        end

        subgraph "Authentication & Authorization"
            OAUTH_S[OAuth 2.0<br/>SSO Providers]
            JWT_V[JWT Verification<br/>RS256]
            SESSION[Session Management<br/>Database]
        end

        subgraph "Data Security"
            ENC_REST[Encryption at Rest<br/>AES-256-GCM]
            ENC_TRANS[Encryption in Transit<br/>TLS 1.3]
            KMS_E[KMS Encryption<br/>S3 + RDS]
        end

        subgraph "Secrets Management"
            SECRETS_M[AWS Secrets Manager]
            ENV[Environment Variables]
            ROTATION[Auto Rotation]
        end

        subgraph "Audit & Compliance"
            AUDIT_L[Audit Logging]
            MONITOR[CloudWatch Monitoring]
            ALERTS[Security Alerts]
        end
    end

    REQUEST[Incoming Request] --> WAF
    WAF --> SG
    SG --> HELMET
    HELMET --> CORS_M
    CORS_M --> RATE_L
    RATE_L --> JWT_V
    JWT_V --> INPUT

    INPUT --> APP[Application Logic]

    APP --> ENC_REST
    APP --> AUDIT_L

    SECRETS_M --> ENV
    ENV --> APP

    AUDIT_L --> MONITOR
    MONITOR --> ALERTS

    style WAF fill:#ff9999
    style JWT_V fill:#ffcc99
    style ENC_REST fill:#99ff99
    style AUDIT_L fill:#99ccff
```

## Scalability Patterns

### Horizontal Scaling

```mermaid
graph LR
    subgraph "Auto Scaling"
        ALB[Load Balancer]

        subgraph "ECS Service"
            TASK1[Task 1<br/>2 vCPU, 4GB]
            TASK2[Task 2<br/>2 vCPU, 4GB]
            TASK3[Task 3<br/>2 vCPU, 4GB]
            TASKN[Task N<br/>2 vCPU, 4GB]
        end

        ASG[Auto Scaling Policy<br/>Target CPU: 70%]
    end

    ALB --> TASK1
    ALB --> TASK2
    ALB --> TASK3
    ALB --> TASKN

    ASG -.monitors.-> TASK1
    ASG -.scales.-> ECS

    style ALB fill:#ff9999
    style ASG fill:#ffcc99
```

### Caching Strategy

```mermaid
graph TB
    APP[Application]
    REDIS[(Redis Cache)]
    PG[(PostgreSQL)]

    APP -->|1. Check cache| REDIS
    REDIS -->|2. Cache miss| APP
    APP -->|3. Query DB| PG
    PG -->|4. Return data| APP
    APP -->|5. Store in cache| REDIS

    subgraph "Cache Keys"
        USER[user:{id}]
        SESSION[session:{id}]
        STATS[stats:{userId}]
    end

    subgraph "TTL"
        TTL1[User: 1 hour]
        TTL2[Session: 5 minutes]
        TTL3[Stats: 15 minutes]
    end

    REDIS --> USER
    REDIS --> SESSION
    REDIS --> STATS

    style REDIS fill:#ffcc99
    style PG fill:#99ff99
```

## Performance Characteristics

| Component | Metric | Target | Actual |
|-----------|--------|--------|--------|
| **API Response** | Median latency | < 100ms | 45ms |
| **API Response** | P95 latency | < 500ms | 280ms |
| **Database** | Query time | < 50ms | 12ms |
| **S3 Upload** | Time (10MB) | < 5s | 2.3s |
| **WebSocket** | Message latency | < 50ms | 18ms |
| **Agent Creation** | Total time | 20-35 min | 22 min avg |
| **Concurrent Users** | Supported | 1000+ | Tested to 500 |
| **Throughput** | Requests/sec | 100 | 85 avg |

## Technology Stack Summary

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.0
- **Styling**: Tailwind CSS 3.4
- **State**: React Query + Zustand
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.21
- **Language**: TypeScript 5.8
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Storage**: AWS S3
- **WebSocket**: ws library
- **Auth**: Passport.js
- **Validation**: Zod

### Infrastructure
- **Cloud**: AWS
- **Compute**: ECS Fargate
- **Database**: RDS PostgreSQL (Multi-AZ)
- **Cache**: ElastiCache Redis
- **Storage**: S3 with lifecycle policies
- **CDN**: CloudFront
- **Load Balancer**: Application Load Balancer
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch + X-Ray
- **Secrets**: Secrets Manager

### LLM Integration
- **Primary**: Anthropic Claude (Extended Thinking)
- **Supported**: OpenAI GPT-4, Google Gemini
- **SDK**: @anthropic-ai/sdk

## Design Decisions

### 1. Why PostgreSQL over DynamoDB?
- **Relational integrity** needed for users → sessions → audit logs
- **Complex queries** for statistics and reporting
- **ACID compliance** for financial/audit data
- **Cost** more predictable for our access patterns

### 2. Why ECS Fargate over Lambda?
- **Long-running workflows** (20-35 minutes) exceed Lambda limits
- **WebSocket connections** need persistent connections
- **Predictable costs** for baseline load
- **Container flexibility** for dependencies

### 3. Why Redis for caching?
- **Session data** needs fast access
- **Rate limiting** requires atomic counters
- **TTL support** built-in
- **ElastiCache** managed service

### 4. Why S3 with lifecycle policies?
- **Cost optimization** move old artifacts to Glacier
- **Automatic cleanup** delete after 90 days
- **Scalability** unlimited storage
- **Integration** with CloudFront for downloads

### 5. Why WebSocket over Server-Sent Events?
- **Bidirectional** communication for future features
- **Broader support** in client libraries
- **Lower latency** for real-time updates
- **Connection management** more mature

## Future Architecture Enhancements

1. **Event-Driven Architecture**
   - Migrate to EventBridge for workflow coordination
   - Decouple agents into independent services
   - Enable async processing at scale

2. **Microservices Split**
   - Separate auth service
   - Dedicated workflow engine
   - Independent artifact service

3. **Global Distribution**
   - Multi-region deployment
   - Regional S3 buckets
   - Database read replicas

4. **Advanced Caching**
   - CDN for static assets
   - Query result caching
   - Redis clustering

5. **Enhanced Monitoring**
   - Distributed tracing
   - Custom metrics dashboard
   - Anomaly detection
