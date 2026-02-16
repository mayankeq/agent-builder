# Agent-Builder Documentation

Comprehensive technical documentation for the Agent-Builder system.

## Overview

Agent-Builder is a production-ready CLI tool and web application for creating LLM-based agents through a sophisticated five-phase workflow that leverages Claude's extended thinking capabilities.

### Key Features
- Five-phase agent creation workflow (Clarification → Design → Implementation → Packaging → Learning)
- Extended thinking integration (up to 10K tokens) for architectural design
- Multi-format output (Claude Code Skills, MCP Servers, CLIs, Libraries)
- Multi-language support (TypeScript, Python)
- Web-based interface with real-time progress updates
- Secure SSO authentication (Google, Azure AD, Okta)
- Encrypted API key storage (AES-256-GCM)
- AWS S3 artifact storage with presigned URLs
- Pattern recognition and self-improvement through memory system

---

## Documentation Structure

### Getting Started
| Document | Description | Audience |
|----------|-------------|----------|
| [Quick Start Guide](./QUICK_START.md) | 10-minute setup and first agent creation | All users |
| [API Documentation](./API.md) | Complete REST API and WebSocket reference | Developers |

### Architecture and Design
| Document | Description | Audience |
|----------|-------------|----------|
| [Architecture Guide (Enhanced)](./ARCHITECTURE_ENHANCED.md) | System architecture with sequence diagrams | Architects, developers |
| [Original Architecture](./architecture.md) | Core system overview | All technical users |
| [Performance Guide](./PERFORMANCE.md) | Benchmarks, optimization, scaling | DevOps, architects |

### Operations
| Document | Description | Audience |
|----------|-------------|----------|
| [Deployment Guide](./DEPLOYMENT.md) | AWS deployment and infrastructure setup | DevOps engineers |
| [Security Guide](./SECURITY.md) | Security best practices and compliance | Security engineers |
| [Troubleshooting Guide](./TROUBLESHOOTING.md) | Common issues and solutions | Support, developers |

### Extension
| Document | Description | Audience |
|----------|-------------|----------|
| [Extending Guide](./extending.md) | Custom agents, templates, languages | Developers |

---

## Quick Navigation

### I want to...

**Get started quickly**
- → [Quick Start Guide](./QUICK_START.md)

**Understand the system architecture**
- → [Architecture Guide (Enhanced)](./ARCHITECTURE_ENHANCED.md)
- Includes: Sequence diagrams, component interactions, database schema

**Use the API**
- → [API Documentation](./API.md)
- Includes: 24 REST endpoints, WebSocket protocol, authentication flow

**Deploy to production**
- → [Deployment Guide](./DEPLOYMENT.md)
- Includes: AWS setup, environment variables, CI/CD pipeline

**Improve performance**
- → [Performance Guide](./PERFORMANCE.md)
- Includes: Benchmarks, token usage analysis, caching strategies

**Secure my installation**
- → [Security Guide](./SECURITY.md)
- Includes: Authentication, encryption, OWASP Top 10 compliance

**Fix an issue**
- → [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Includes: Common problems, error messages, debugging techniques

**Extend functionality**
- → [Extending Guide](./extending.md)
- Includes: Custom agents, new output formats, template customization

---

## Documentation by Role

### For End Users
1. Start with [Quick Start Guide](./QUICK_START.md)
2. Reference [API Documentation](./API.md) for usage
3. Check [Troubleshooting Guide](./TROUBLESHOOTING.md) for issues

### For Developers
1. Read [Architecture Guide](./ARCHITECTURE_ENHANCED.md) for system understanding
2. Follow [Quick Start Guide](./QUICK_START.md) for local setup
3. Use [Extending Guide](./extending.md) for customizations
4. Reference [API Documentation](./API.md) for integration

### For DevOps Engineers
1. Follow [Deployment Guide](./DEPLOYMENT.md) for production setup
2. Review [Security Guide](./SECURITY.md) for hardening
3. Use [Performance Guide](./PERFORMANCE.md) for optimization
4. Keep [Troubleshooting Guide](./TROUBLESHOOTING.md) handy

### For Security Engineers
1. Review [Security Guide](./SECURITY.md) thoroughly
2. Understand [Architecture Guide](./ARCHITECTURE_ENHANCED.md) for threat modeling
3. Check [API Documentation](./API.md) for authentication details
4. Follow [Deployment Guide](./DEPLOYMENT.md) for secure configuration

### For Architects
1. Study [Architecture Guide (Enhanced)](./ARCHITECTURE_ENHANCED.md)
2. Review [Performance Guide](./PERFORMANCE.md) for scaling
3. Understand [Security Guide](./SECURITY.md) for compliance
4. Check [Extending Guide](./extending.md) for customization options

---

## Key Concepts

### Five-Phase Workflow

```
1. Clarification (2-5 min)
   ↓
2. Design with Extended Thinking (5-10 min)
   ↓
3. Implementation - Parallel Execution (10-15 min)
   ├─ Code Generation
   ├─ Test Generation
   └─ Documentation Generation
   ↓
4. Packaging (2-5 min)
   ↓
5. Learning & Pattern Storage (1 min)
```

**Total Time**: 20-35 minutes per agent

### Technology Stack

**Backend**:
- Node.js 18+ with TypeScript
- Express.js (REST API)
- WebSocket (ws library)
- PostgreSQL 15+ (database)
- AWS S3 (artifact storage)

**Authentication**:
- OAuth 2.0 / OIDC (Google, Azure AD, Okta)
- JWT tokens (HS256)
- AES-256-GCM encryption for API keys

**AI Integration**:
- Anthropic Claude API
- Extended thinking support (up to 10K tokens)
- Multiple models (Sonnet, Haiku)

**Monitoring**:
- Winston (structured logging)
- Prometheus (metrics)
- CloudWatch (AWS integration)

### Performance Metrics

| Metric | Target | Typical |
|--------|--------|---------|
| API Response (p95) | <500ms | ~200ms |
| WebSocket Latency | <100ms | ~50ms |
| Database Query (p95) | <50ms | ~20ms |
| Agent Creation | 20-35 min | 27 min |
| Token Usage | 28K-52K | 40K tokens |

---

## API Endpoints Overview

### Authentication (`/api/auth`)
- SSO login (Google, Azure, Okta)
- Logout (single/all devices)
- Token refresh
- User profile

### API Keys (`/api/api-keys`)
- Add/update API key (encrypted)
- Validate API key
- Get status
- Delete key

### Agents (`/api/agents`)
- Create new agent (async)
- Get example templates

### Sessions (`/api/sessions`)
- List sessions (paginated)
- Get session details
- Cancel in-progress session
- Delete session
- Get statistics

### Downloads (`/api/downloads`)
- Download artifacts (ZIP)
- Get presigned URL
- Get metadata

### System
- Health check
- Prometheus metrics

**Total**: 24 REST endpoints + WebSocket server

---

## Database Schema

### Tables
- **users**: SSO authentication
- **user_sessions**: JWT session management
- **user_api_keys**: Encrypted Anthropic API keys
- **sessions**: Agent creation sessions with progress
- **audit_log**: Security and activity audit trail

### Views
- **active_sessions_view**: Active sessions with user info
- **user_session_stats**: Per-user statistics

### Functions
- **cleanup_expired_sessions()**: Remove expired JWT sessions
- **cleanup_old_sessions()**: Remove sessions older than 7 days

---

## Security Features

- **Multi-layer security**: Defense in depth architecture
- **SSO-only authentication**: No local passwords
- **AES-256-GCM encryption**: API keys at rest
- **TLS 1.3**: Data in transit
- **JWT tokens**: Secure session management with SHA-256 hashing
- **Rate limiting**: Multi-tier (standard, strict, agent creation)
- **Audit logging**: Comprehensive security trail
- **OWASP Top 10 compliance**: All major vulnerabilities addressed
- **Input validation**: Zod schemas for all inputs
- **SQL injection prevention**: Parameterized queries only

---

## Deployment Options

### Local Development
```bash
npm install
createdb agent_builder
psql agent_builder < migrations/001_initial_schema.sql
npm run build
npm run dev:server
```

### Production (AWS)
- **Compute**: ECS Fargate
- **Database**: RDS PostgreSQL (Multi-AZ)
- **Storage**: S3 with versioning
- **Load Balancer**: Application Load Balancer
- **DNS**: Route 53
- **SSL**: ACM certificates
- **Monitoring**: CloudWatch
- **Secrets**: Secrets Manager

---

## Cost Estimates

**Monthly (100 users, 1,000 agents)**:
- Infrastructure: $472/month
- Claude API: $350/month
- **Total**: $822/month (~$0.82 per agent)

**Optimization opportunities**:
- Reserved Instances: 30-40% savings
- S3 Intelligent Tiering: 20-30% savings
- CloudFront CDN: 50% data transfer savings

---

## Contributing

See [Extending Guide](./extending.md) for:
- Adding custom agent types
- Creating new output formats
- Supporting additional languages
- Customizing templates

---

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/YOUR_USERNAME/agent-builder/issues)
- **Documentation**: Browse guides in this directory
- **Logs**: Check `logs/server.log` for detailed diagnostics

---

## Version History

- **v0.1.0** (Current): Initial production release
  - CLI tool with 5-phase workflow
  - Web application with 24 REST endpoints
  - Extended thinking integration
  - Multi-format output (Skills, MCP, CLI, Library)
  - Multi-language support (TypeScript, Python)
  - Pattern recognition and learning

---

## License

MIT License - See [LICENSE](../LICENSE) file

---

## Acknowledgments

Built with:
- [Anthropic Claude](https://anthropic.com) - AI capabilities
- [Node.js](https://nodejs.org) - Runtime
- [PostgreSQL](https://postgresql.org) - Database
- [AWS](https://aws.amazon.com) - Infrastructure
- [TypeScript](https://typescriptlang.org) - Language
