# Agent-Builder Documentation

Welcome to the Agent-Builder comprehensive documentation. This guide will help you get started with building LLM-based agents through our platform.

## Overview

Agent-Builder is a dual-distribution platform that creates intelligent agents through a sophisticated five-phase workflow:

1. **Clarification** - Gathers detailed requirements
2. **Design** - Architects the agent using Claude's extended thinking
3. **Implementation** - Generates code, tests, and documentation in parallel
4. **Packaging** - Creates distributable artifacts
5. **Learning** - Captures patterns for continuous improvement

## Choose Your Path

### 🌐 Web Application Users
Perfect for users who prefer a browser-based interface with real-time progress tracking, team collaboration, and cloud storage.

**Start here:**
- [Quick Start Guide](./getting-started/quick-start.md)
- [Web App User Guide](./user-guide/web-app/README.md)
- [Creating Your First Agent](./getting-started/first-agent.md)

### 💻 CLI Users
Ideal for developers who prefer command-line tools, CI/CD integration, and local development workflows.

**Start here:**
- [CLI Installation](./user-guide/cli/installation.md)
- [CLI User Guide](./user-guide/cli/README.md)
- [CLI Commands Reference](./user-guide/cli/commands.md)

### 🔧 API Developers
For developers integrating Agent-Builder into their applications or building custom tools.

**Start here:**
- [API Overview](./api/README.md)
- [API Usage Guide](./api/API_USAGE_GUIDE.md)
- [OpenAPI Specification](./api/openapi.yaml)
- [Code Examples](./api/code-examples/)

### 🏗️ System Administrators
For teams deploying and managing Agent-Builder infrastructure.

**Start here:**
- [Deployment Guide](./admin-guide/deployment.md)
- [Configuration Reference](./admin-guide/configuration.md)
- [Monitoring & Alerts](./admin-guide/monitoring.md)

### 👨‍💻 Contributors
For developers extending or contributing to Agent-Builder.

**Start here:**
- [Developer Setup](./developer-guide/setup.md)
- [Architecture Overview](./architecture/SYSTEM_ARCHITECTURE.md)
- [Extending Guide](./developer-guide/extending.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## Documentation Structure

### 📚 Getting Started
- [Installation](./getting-started/installation.md)
- [Quick Start](./getting-started/quick-start.md)
- [Your First Agent](./getting-started/first-agent.md)

### 👤 User Guides
- **Web Application**
  - [Authentication](./user-guide/web-app/authentication.md)
  - [Creating Agents](./user-guide/web-app/creating-agents.md)
  - [Managing API Keys](./user-guide/web-app/managing-api-keys.md)
  - [Downloading Artifacts](./user-guide/web-app/downloading-artifacts.md)
  - [Shared Learning](./user-guide/web-app/shared-learning.md)

- **CLI Tool**
  - [Installation](./user-guide/cli/installation.md)
  - [Configuration](./user-guide/cli/configuration.md)
  - [Commands](./user-guide/cli/commands.md)
  - [Advanced Usage](./user-guide/cli/advanced.md)

### 🔌 API Reference
- [API Overview](./api/README.md)
- [OpenAPI Specification](./api/openapi.yaml)
- [API Usage Guide](./api/API_USAGE_GUIDE.md)
- [Authentication](./api/endpoints/authentication.md)
- **Endpoints**
  - [Agents](./api/endpoints/agents.md)
  - [Sessions](./api/endpoints/sessions.md)
  - [API Keys](./api/endpoints/api-keys.md)
  - [Downloads](./api/endpoints/downloads.md)
- **Code Examples**
  - [Python SDK](./api/code-examples/python.md)
  - [JavaScript/TypeScript](./api/code-examples/javascript.md)
  - [cURL](./api/code-examples/curl.md)

### 🏗️ Architecture
- [System Architecture](./architecture/SYSTEM_ARCHITECTURE.md)
- [Component Overview](./architecture/components.md)
- [Database Schema](./architecture/database-schema.md)
- [Data Flow](./architecture/data-flow.md)
- [Deployment Architecture](./architecture/deployment.md)

### 👨‍💻 Developer Guide
- [Development Setup](./developer-guide/setup.md)
- [Project Structure](./developer-guide/architecture.md)
- [Extending Agent-Builder](./developer-guide/extending.md)
- [Testing Guide](./developer-guide/testing.md)
- [Contributing](./developer-guide/contributing.md)

### 🔧 Administrator Guide
- [Deployment](./admin-guide/deployment.md)
- [Configuration](./admin-guide/configuration.md)
- [Monitoring](./admin-guide/monitoring.md)
- [Backup & Recovery](./admin-guide/backup-recovery.md)
- [Scaling](./admin-guide/scaling.md)
- [Security Best Practices](./admin-guide/security.md)

### 📖 Reference
- [Configuration Options](./reference/configuration.md)
- [Environment Variables](./reference/environment-variables.md)
- [Error Codes](./reference/error-codes.md)
- [Changelog](../CHANGELOG.md)

## Key Features

### Multi-LLM Support
- **Claude** (Primary) - Extended thinking for deep architectural analysis
- **OpenAI GPT-4** - Alternative provider
- **Google Gemini** - Additional option

### Multiple Output Formats
- **MCP Servers** - Model Context Protocol servers
- **CLI Tools** - Standalone command-line applications
- **Skills** - Claude Code skill integration
- **Libraries** - NPM or pip packages

### Multi-Language Support
- **TypeScript** - Full type safety and tooling
- **Python** - Extensive ecosystem and simplicity

### Security Features
- **SSO Authentication** - Google, Azure AD, Okta
- **Encrypted API Keys** - AES-256-GCM encryption at rest
- **JWT Tokens** - Secure session management
- **Rate Limiting** - Protection against abuse
- **Audit Logging** - Complete activity tracking

### Cloud Infrastructure
- **AWS ECS Fargate** - Serverless container deployment
- **PostgreSQL RDS** - Managed relational database
- **S3 Storage** - Artifact storage with lifecycle policies
- **CloudFront CDN** - Fast global content delivery
- **ElastiCache Redis** - High-performance caching

## Quick Links

### Common Tasks
- [Create an Agent](./user-guide/web-app/creating-agents.md)
- [Download Artifacts](./user-guide/web-app/downloading-artifacts.md)
- [Manage API Keys](./user-guide/web-app/managing-api-keys.md)
- [Monitor Progress](./user-guide/web-app/monitoring-progress.md)
- [Troubleshoot Issues](./reference/troubleshooting.md)

### API Operations
- [Authentication Flow](./api/endpoints/authentication.md)
- [Create Agent via API](./api/endpoints/agents.md#create-agent)
- [List Sessions](./api/endpoints/sessions.md#list-sessions)
- [Download via Presigned URL](./api/endpoints/downloads.md#presigned-url)

### Deployment
- [AWS Deployment](./admin-guide/deployment.md#aws)
- [Docker Deployment](./admin-guide/deployment.md#docker)
- [Environment Variables](./reference/environment-variables.md)
- [Terraform Modules](./admin-guide/deployment.md#terraform)

## Support & Community

### Getting Help
- **Documentation**: You're reading it!
- **GitHub Issues**: [Report bugs or request features](https://github.com/agent-builder/agent-builder/issues)
- **Discussions**: [Community forum](https://github.com/agent-builder/agent-builder/discussions)
- **Email**: support@agent-builder.com

### Contributing
We welcome contributions! See:
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Development Setup](./developer-guide/setup.md)

### Staying Updated
- **Changelog**: [Latest changes](../CHANGELOG.md)
- **Releases**: [GitHub Releases](https://github.com/agent-builder/agent-builder/releases)
- **Blog**: [Technical blog posts](https://blog.agent-builder.com)

## Platform Comparison

### Web Application vs CLI

| Feature | Web App | CLI |
|---------|---------|-----|
| **Interface** | Browser-based GUI | Command-line |
| **Authentication** | OAuth SSO | API key only |
| **Storage** | Cloud (S3) | Local filesystem |
| **Monitoring** | Real-time WebSocket | Polling |
| **Collaboration** | Multi-user | Single user |
| **Deployment** | Managed hosting | Self-hosted |
| **Best For** | Teams, non-technical users | Developers, automation |

Both interfaces share the same underlying engine and produce identical results.

## Pricing & Plans

### Free Tier (BYOK - Bring Your Own Key)
- ✅ Unlimited agent creation
- ✅ All output formats
- ✅ Cloud storage (7-day retention)
- ✅ Community support
- 💰 **Cost**: Only pay for LLM API usage (~$0.50-2.00 per agent)

### Enterprise Plan
- ✅ Everything in Free tier
- ✅ Extended storage (90 days)
- ✅ Priority support
- ✅ Custom LLM providers
- ✅ On-premise deployment
- ✅ SLA guarantees
- 💰 **Cost**: Contact sales

## System Requirements

### Web Application
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: Enabled
- **WebSocket**: Supported

### CLI Tool
- **Node.js**: 18.0.0 or higher
- **Memory**: 512MB minimum, 2GB recommended
- **Disk**: 1GB free space
- **Network**: Internet access for API calls

### Self-Hosted Deployment
- **CPU**: 2 vCPUs minimum, 4 recommended
- **Memory**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum, 100GB recommended
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+ (optional but recommended)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐          ┌──────────────┐                │
│  │ Web Browser  │          │  CLI Tool    │                │
│  │ React + WS   │          │  Node.js     │                │
│  └──────────────┘          └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ Express.js API + WebSocket Server            │          │
│  │ Authentication │ Rate Limiting │ Validation  │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Workflow   │  │   Agent    │  │    LLM     │           │
│  │Coordinator │→ │  System    │→ │  Factory   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │      S3      │  │    Redis     │     │
│  │    RDS       │  │   Artifacts  │  │    Cache     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Performance Benchmarks

### Agent Creation Time
- **Clarification**: 2-5 minutes (2-3 rounds)
- **Design**: 5-10 minutes (extended thinking)
- **Implementation**: 10-15 minutes (parallel)
- **Packaging**: 2-5 minutes
- **Total**: 20-35 minutes average

### Token Usage
- **Average per agent**: 35-50K tokens
- **Estimated cost**: $0.50-2.00 per agent (Claude Sonnet)

### System Performance
- **API Response**: < 100ms median
- **Database Queries**: < 50ms
- **WebSocket Latency**: < 50ms
- **File Upload**: ~2s for 10MB
- **Concurrent Users**: 1000+ supported

## Frequently Asked Questions

### General
**Q: Do I need to pay for Agent-Builder?**
A: No! Agent-Builder is free. You only pay for LLM API usage (Anthropic, OpenAI, etc.).

**Q: Can I use my own LLM API key?**
A: Yes, that's the BYOK (Bring Your Own Key) model.

**Q: What happens to my data?**
A: Session data stored for 7 days in S3, then deleted. See [Privacy Policy](./reference/privacy.md).

### Technical
**Q: Can I self-host Agent-Builder?**
A: Yes! See [Deployment Guide](./admin-guide/deployment.md).

**Q: What LLMs are supported?**
A: Claude (primary), OpenAI GPT-4, Google Gemini.

**Q: Can I extend Agent-Builder?**
A: Absolutely! See [Extending Guide](./developer-guide/extending.md).

### Support
**Q: How do I report bugs?**
A: [Open a GitHub issue](https://github.com/agent-builder/agent-builder/issues).

**Q: Is there commercial support?**
A: Yes, contact sales@agent-builder.com for Enterprise plans.

## Next Steps

Based on your role, here's where to go next:

### New Users
1. [Install](./getting-started/installation.md) the platform
2. [Create your first agent](./getting-started/first-agent.md)
3. [Explore examples](./user-guide/examples.md)

### Developers
1. [Review the architecture](./architecture/SYSTEM_ARCHITECTURE.md)
2. [Set up development environment](./developer-guide/setup.md)
3. [Read the API docs](./api/API_USAGE_GUIDE.md)

### Administrators
1. [Plan your deployment](./admin-guide/deployment.md)
2. [Configure infrastructure](./admin-guide/configuration.md)
3. [Set up monitoring](./admin-guide/monitoring.md)

---

**Last Updated**: February 9, 2026
**Version**: 1.0.0
**License**: MIT
