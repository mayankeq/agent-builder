# Performance Guide

Optimization strategies, benchmarks, and scaling recommendations for Agent-Builder.

## Table of Contents
- [Overview](#overview)
- [Performance Benchmarks](#performance-benchmarks)
- [Token Usage Analysis](#token-usage-analysis)
- [Optimization Strategies](#optimization-strategies)
- [Caching Recommendations](#caching-recommendations)
- [Scaling Considerations](#scaling-considerations)
- [Monitoring and Profiling](#monitoring-and-profiling)

---

## Overview

Agent-Builder's performance depends on several factors:
- **Claude API response time** (largest contributor)
- **Extended thinking budget** (quality vs speed trade-off)
- **Parallel execution** (implementation phase)
- **Database query efficiency**
- **Network latency** (S3 uploads, WebSocket updates)

**Key Performance Metric**: Total agent creation time (20-35 minutes typical)

---

## Performance Benchmarks

### Phase-by-Phase Timing

| Phase | Duration (Typical) | Duration (Range) | % of Total |
|-------|-------------------|------------------|------------|
| Clarification | 3 min | 2-5 min | 10-15% |
| Design (Extended Thinking) | 8 min | 5-10 min | 25-35% |
| Implementation (Parallel) | 12 min | 10-15 min | 40-50% |
| Packaging | 3 min | 2-5 min | 10-15% |
| Learning | 1 min | 30s-2 min | 2-5% |
| **Total** | **27 min** | **20-35 min** | **100%** |

### API Response Times

Measured under normal load (p95 percentiles):

| Endpoint | Cold Start | Warm | Target |
|----------|-----------|------|--------|
| GET /api/sessions | 180ms | 45ms | <500ms |
| POST /api/agents/create | 250ms | 120ms | <500ms |
| GET /api/auth/me | 90ms | 30ms | <200ms |
| GET /api/downloads/:id/artifacts | 2.5s | 1.8s | <5s |
| WebSocket latency | N/A | 50ms | <100ms |

### Database Query Performance

| Query Type | Avg Duration | P95 | P99 |
|-----------|--------------|-----|-----|
| User lookup by ID | 8ms | 15ms | 25ms |
| Session list (20 items) | 12ms | 20ms | 35ms |
| Session details with audit | 18ms | 30ms | 50ms |
| API key decryption | 5ms | 10ms | 18ms |
| Audit log insert | 6ms | 12ms | 20ms |

### Token Usage by Phase

| Phase | Average Tokens | Range | Cost (Sonnet 4.5) |
|-------|----------------|-------|-------------------|
| Clarification (2 rounds) | 4,500 | 3K-6K | $0.04-$0.05 |
| Design (10K thinking) | 15,200 | 12K-18K | $0.12-$0.15 |
| Implementation (code) | 8,500 | 6K-12K | $0.06-$0.10 |
| Implementation (tests) | 6,200 | 4K-8K | $0.04-$0.07 |
| Implementation (docs) | 3,800 | 2K-5K | $0.02-$0.04 |
| Packaging | 2,100 | 1K-3K | $0.01-$0.02 |
| **Total** | **40,300** | **28K-52K** | **$0.29-$0.43** |

**Note**: Costs based on Claude Sonnet 4.5 pricing ($3/MTok input, $15/MTok output). Users provide their own API keys.

---

## Token Usage Analysis

### Extended Thinking Impact

Extended thinking significantly improves design quality but increases both time and tokens:

| Thinking Budget | Design Quality | Duration | Token Usage | When to Use |
|----------------|----------------|----------|-------------|-------------|
| 0 (disabled) | 6/10 | 2-3 min | 5K tokens | Simple agents, quick prototypes |
| 2,000 tokens | 7/10 | 4-5 min | 8K tokens | Standard agents |
| 5,000 tokens | 8/10 | 6-8 min | 12K tokens | Complex logic |
| 10,000 tokens | 9/10 | 8-10 min | 18K tokens | Production agents (default) |

**Recommendation**: Use 10K thinking budget for production, disable for experimentation.

### Token Distribution

```
Total Tokens (40,300 avg):
├─ Design Phase (38%): 15,200 tokens
│  ├─ Extended Thinking: 9,800 tokens
│  └─ Architecture Output: 5,400 tokens
│
├─ Implementation Phase (46%): 18,500 tokens
│  ├─ Code Generation: 8,500 tokens
│  ├─ Test Generation: 6,200 tokens
│  └─ Documentation: 3,800 tokens
│
├─ Clarification Phase (11%): 4,500 tokens
├─ Packaging Phase (5%): 2,100 tokens
└─ Learning Phase (0%): 0 tokens (no API calls)
```

### Cost Optimization Strategies

1. **Reduce Clarification Rounds**
   - Pre-answer common questions in description
   - Use example templates as starting point
   - **Savings**: 1,500-2,000 tokens per round skipped

2. **Adjust Thinking Budget**
   - Use 5K for simple agents instead of 10K
   - **Savings**: 5,000 tokens (12% total)

3. **Skip Optional Documentation**
   - Generate only essential docs
   - **Savings**: 2,000-3,000 tokens

4. **Use Haiku for Non-Critical Phases**
   - Switch to Haiku for packaging phase
   - **Savings**: 70% cost reduction for that phase

5. **Batch Multiple Agents**
   - Reuse clarification for similar agents
   - **Savings**: ~10% through pattern reuse

---

## Optimization Strategies

### 1. Parallel Execution

Implementation phase runs 3 agents in parallel:

**Sequential (without parallelization)**:
```
Code (8 min) -> Tests (6 min) -> Docs (4 min) = 18 min
```

**Parallel (current implementation)**:
```
Code (8 min) }
Tests (6 min) } = 8 min (limited by longest)
Docs (4 min)  }
```

**Time Saved**: 10 minutes (36% faster)

**Configuration**:
```typescript
// src/orchestration/workflow-coordinator.ts
const parallelBatch = new ParallelBatch(3); // max 3 concurrent

await parallelBatch.executeAll([
  () => implementationAgent.execute(context),
  () => testingAgent.execute(context),
  () => documentationAgent.execute(context),
]);
```

### 2. Database Connection Pooling

**Current Configuration**:
```typescript
const pool = new Pool({
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,  // Close idle after 30s
  connectionTimeoutMillis: 2000, // Fail fast
});
```

**Tuning Recommendations**:
- Development: `max: 10`
- Production (single instance): `max: 20`
- Production (3 instances): `max: 10` per instance

**Impact**: Prevents connection exhaustion under load.

### 3. WebSocket Connection Management

**Current Strategy**:
- Heartbeat every 30 seconds
- Automatically close dead connections
- Group connections by session ID

**Optimization**:
```javascript
// Reduce heartbeat interval for low-latency needs
const HEARTBEAT_INTERVAL = 15000; // 15 seconds instead of 30

// Adjust based on expected connection lifetime
```

**Trade-off**: More frequent heartbeats increase network overhead but detect failures faster.

### 4. S3 Upload Optimization

**Multipart Upload for Large Files**:
```typescript
// Automatically used for files > 5MB
import { Upload } from '@aws-sdk/lib-storage';

const upload = new Upload({
  client: s3Client,
  params: {
    Bucket: bucket,
    Key: key,
    Body: stream,
  },
  queueSize: 4,        // Parallel parts
  partSize: 5 * 1024 * 1024, // 5MB parts
});

await upload.done();
```

**Impact**: 3-4x faster uploads for large artifacts (>20MB).

### 5. Compression

**Artifact Compression**:
```typescript
// Use archiver with compression level 6 (balance)
const archive = archiver('zip', {
  zlib: { level: 6 } // 0=no compression, 9=max compression
});
```

**Compression Levels**:
- Level 0: No compression, fastest (not recommended)
- Level 6: Balanced (default, recommended)
- Level 9: Maximum compression, slowest

**Typical Compression Ratios**:
- Source code: 70-80% reduction
- Node modules: 60-70% reduction
- Overall artifact: 65-75% reduction

---

## Caching Recommendations

### Current State

Agent-Builder does not implement application-level caching yet. All data is fetched from database on each request.

### Recommended Caching Strategy

#### 1. Redis for Session Data

**What to Cache**:
- Active sessions (status, progress, phase)
- User session (JWT validation)
- API key validation status

**Implementation**:
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  keyPrefix: 'agent-builder:',
});

// Cache session for 5 minutes
async function getSession(sessionId: string) {
  const cached = await redis.get(`session:${sessionId}`);
  if (cached) return JSON.parse(cached);

  const session = await db.getSession(sessionId);
  await redis.setex(`session:${sessionId}`, 300, JSON.stringify(session));
  return session;
}
```

**Expected Impact**:
- Session list endpoint: 80% faster (from 12ms to 2ms)
- Session details: 75% faster (from 18ms to 4ms)
- Reduced database load: 60-70%

#### 2. CloudFront CDN for Artifacts

**Configuration**:
```yaml
Distribution:
  Origins:
    - DomainName: agent-builder-artifacts.s3.amazonaws.com
      Id: S3-artifacts
  DefaultCacheBehavior:
    TargetOriginId: S3-artifacts
    ViewerProtocolPolicy: redirect-to-https
    MinTTL: 86400           # 1 day
    MaxTTL: 31536000        # 1 year
    DefaultTTL: 86400
    Compress: true
```

**Expected Impact**:
- Artifact download: 5-10x faster (edge caching)
- S3 costs: Reduced by 50-80%
- Global latency: <100ms from any region

#### 3. API Response Caching

**Candidates** (GET endpoints only):
- `/api/auth/providers` (static, cache 1 hour)
- `/api/agents/examples` (static, cache 1 hour)
- `/api/sessions/stats` (cache 5 minutes)
- `/api/downloads/:id/metadata` (cache 1 minute)

**Implementation** (using middleware):
```typescript
import mcache from 'memory-cache';

const cache = (duration: number) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl;
    const cached = mcache.get(key);

    if (cached) {
      res.send(cached);
      return;
    }

    res.sendResponse = res.send;
    res.send = (body) => {
      mcache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};

// Usage
app.get('/api/auth/providers', cache(3600), providersHandler);
```

**Expected Impact**:
- Reduced redundant computations
- Lower database load
- Faster response times for repeated queries

---

## Scaling Considerations

### Vertical Scaling (Single Instance)

**Current Limits** (on single t3.large EC2):
- Concurrent users: 50-100
- Active sessions: 20-30
- WebSocket connections: 1,000-2,000
- Database connections: 20 (pool limit)

**Bottlenecks**:
1. CPU: Claude API requests are I/O-bound, minimal CPU usage
2. Memory: ~2GB for Node.js process + connections
3. Network: S3 uploads during peak completions

**Upgrade Path**:
- t3.large → t3.xlarge (2x capacity)
- Add Redis for caching
- Increase database connection pool to 40

### Horizontal Scaling (Multiple Instances)

**Architecture**:
```
            ALB (Application Load Balancer)
                        |
        +---------------+---------------+
        |               |               |
    Instance 1      Instance 2      Instance 3
        |               |               |
        +---------------+---------------+
                        |
                    PostgreSQL
                    (with Read Replicas)
```

**Challenges**:
1. **WebSocket Sticky Sessions**
   - Solution: ALB with session affinity
   - Alternative: Redis pub/sub for cross-instance messaging

2. **Database Connection Pool**
   - Solution: Reduce pool per instance (e.g., 10 each for 3 instances)

3. **Shared State**
   - Solution: Redis for session cache
   - Alternative: Database for source of truth

**Configuration**:
```yaml
# ALB Target Group
TargetGroup:
  Protocol: HTTP
  Port: 3000
  HealthCheck:
    Path: /health
    Interval: 30
    Timeout: 5
    HealthyThreshold: 2
  Stickiness:
    Enabled: true
    Type: lb_cookie
    Duration: 86400  # 1 day for WebSocket
```

### Database Scaling

**Read Replicas**:
```typescript
// Master for writes
const masterPool = new Pool({
  host: process.env.DB_WRITE_HOST,
  max: 10,
});

// Replica for reads
const replicaPool = new Pool({
  host: process.env.DB_READ_HOST,
  max: 20,
});

// Route queries
async function query(sql: string, params: any[], write = false) {
  const pool = write ? masterPool : replicaPool;
  return pool.query(sql, params);
}
```

**When to Add Replicas**:
- Read/write ratio > 80/20
- Database CPU > 60% consistently
- Query latency > 50ms p95

**Expected Impact**:
- 2-3x read capacity
- Reduced master load
- Better performance under heavy read load

### Auto-Scaling Rules

**Target Tracking**:
```yaml
AutoScalingPolicy:
  TargetValue: 70  # Target CPU utilization
  ScaleInCooldown: 300   # 5 minutes
  ScaleOutCooldown: 60   # 1 minute

  Metrics:
    - CPUUtilization > 70% for 2 minutes → Scale out
    - CPUUtilization < 30% for 10 minutes → Scale in
    - ActiveConnections > 80% capacity → Scale out
```

---

## Monitoring and Profiling

### Key Metrics to Track

#### Application Metrics (Prometheus)

1. **HTTP Requests**
   ```
   http_request_duration_seconds{method, route, status}
   http_requests_total{method, route, status}
   ```

2. **Agent Creation**
   ```
   agent_creations_total{output_type, language, status}
   agent_creation_duration_seconds{phase}
   agent_creations_active
   ```

3. **WebSocket**
   ```
   websocket_connections_active
   websocket_messages_total{type}
   websocket_connection_duration_seconds
   ```

4. **Database**
   ```
   db_query_duration_seconds{operation}
   db_connections_active
   db_connections_idle
   db_errors_total
   ```

5. **Claude API**
   ```
   claude_api_requests_total{phase, model}
   claude_api_duration_seconds{phase}
   claude_api_tokens_used{type}  # input/output
   ```

#### System Metrics

- CPU utilization
- Memory usage and GC pauses
- Network I/O
- Disk I/O (for logs)

### Prometheus Query Examples

**Average agent creation duration by phase**:
```promql
rate(agent_creation_duration_seconds_sum[5m])
/ rate(agent_creation_duration_seconds_count[5m])
```

**95th percentile API response time**:
```promql
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[5m])
)
```

**Active WebSocket connections**:
```promql
websocket_connections_active
```

**Token usage rate (tokens per minute)**:
```promql
rate(claude_api_tokens_used_total[1m])
```

### Alerting Rules

```yaml
groups:
  - name: agent-builder
    rules:
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
        for: 5m
        annotations:
          summary: "High API latency detected"

      - alert: AgentCreationFailureRate
        expr: rate(agent_creations_total{status="failed"}[5m]) > 0.1
        for: 10m
        annotations:
          summary: "High agent creation failure rate"

      - alert: DatabaseConnectionPoolExhausted
        expr: db_connections_active / db_connections_max > 0.9
        for: 2m
        annotations:
          summary: "Database connection pool nearly exhausted"

      - alert: HighClaudeAPITokenUsage
        expr: rate(claude_api_tokens_used_total[1h]) > 100000
        for: 5m
        annotations:
          summary: "Unusually high Claude API token usage"
```

### Performance Profiling Tools

1. **Node.js Built-in Profiler**
   ```bash
   node --inspect dist/server/index.js
   # Open chrome://inspect in Chrome
   ```

2. **Clinic.js**
   ```bash
   npm install -g clinic
   clinic doctor -- node dist/server/index.js
   clinic flame -- node dist/server/index.js
   ```

3. **Artillery for Load Testing**
   ```bash
   npm install -g artillery

   # Create load-test.yml
   artillery run load-test.yml
   ```

4. **PostgreSQL Query Analysis**
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_min_duration_statement = 100;

   -- View slow queries
   SELECT * FROM pg_stat_statements
   ORDER BY total_exec_time DESC
   LIMIT 10;
   ```

### Logging Best Practices

**Structured Logging** (Winston):
```typescript
logger.info('Agent creation started', {
  sessionId,
  userId,
  outputType,
  language,
  timestamp: new Date().toISOString(),
});
```

**Log Levels**:
- **ERROR**: Failures requiring immediate attention
- **WARN**: Degraded performance, retries
- **INFO**: Important business events (session created, completed)
- **DEBUG**: Detailed diagnostic information

**What to Log**:
- All API requests with duration
- Authentication events
- Agent creation lifecycle events
- Errors with full stack traces
- Slow operations (>1s)

**What NOT to Log**:
- API keys (even encrypted)
- JWT tokens
- User passwords
- PII without anonymization

---

## Performance Optimization Checklist

### Development
- [ ] Use Haiku model for testing instead of Sonnet
- [ ] Disable extended thinking for rapid iteration
- [ ] Skip optional documentation generation
- [ ] Use local PostgreSQL instance
- [ ] Disable rate limiting

### Staging
- [ ] Enable extended thinking with 5K budget
- [ ] Test with production-like data volume
- [ ] Enable all rate limits
- [ ] Monitor memory usage under load
- [ ] Profile slow endpoints

### Production
- [ ] Extended thinking at 10K budget
- [ ] Database connection pool optimized
- [ ] Enable all caching (Redis)
- [ ] CloudFront CDN for artifacts
- [ ] Read replicas for database
- [ ] Auto-scaling configured
- [ ] Comprehensive monitoring and alerts
- [ ] Regular performance testing

---

## Estimated Costs (AWS)

### Monthly Cost Breakdown (100 users, 1,000 agents/month)

| Service | Configuration | Cost |
|---------|--------------|------|
| ECS Fargate | 3x 1vCPU, 2GB RAM | $100 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | $120 |
| S3 Storage | 500GB artifacts | $12 |
| S3 Data Transfer | 2TB egress | $180 |
| ALB | Load balancer + data | $25 |
| CloudWatch | Logs + metrics | $30 |
| Route 53 | Hosted zone + queries | $5 |
| **Total Infrastructure** | | **$472/month** |
| Claude API | 40M tokens @ $0.35/agent | **$350/month** |
| **Grand Total** | | **$822/month** |

**Cost per Agent**: $0.82 (including infrastructure + API)

**Optimization Opportunities**:
- Use Reserved Instances: Save 30-40% on RDS
- S3 Intelligent Tiering: Save 20-30% on storage
- CloudFront: Reduce data transfer costs by 50%
- Spot Instances for workers: Save 70% on compute

---

For more details, see:
- [Architecture Guide](./ARCHITECTURE_ENHANCED.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Monitoring Guide](./MONITORING.md)
