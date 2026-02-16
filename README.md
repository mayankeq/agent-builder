# 🤖 Synthient - AI Agent Builder

**Build production-ready LLM agents with domain-restricted OAuth authentication.**

Synthient is a comprehensive web application for creating AI agents using Claude's extended thinking capabilities. Perfect for organizations that want to enable internal teams to build agents while maintaining security through domain-restricted authentication.

---

## ✨ Features

### 🔐 Security First
- **Google OAuth 2.0** integration
- **Domain-restricted access** - Only allow specific company domains
- **Workspace-only validation** - Block personal Gmail accounts
- **JWT authentication** with 24-hour expiration
- **Protected API routes**

### 🎨 Modern Web Interface
- Beautiful React UI with Tailwind CSS
- Real-time agent creation progress
- Dashboard with agent management
- Responsive design

### 🤖 Agent Creation
- **Input**: Natural language description
- **Output**: MCP server, CLI tool, library, or skill
- **Languages**: TypeScript or Python
- **Extended Thinking**: Claude's advanced reasoning
- **Progress Tracking**: Real-time status updates
- **Ultra-Concise Skills**: Skills limited to 200 tokens max for clarity
- **Knowledge Base**: Separate knowledge-base.md for deep domain expertise
- **Pattern Learning**: 🆕 Learn from existing agents to match your team's style and structure

---

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd agent-builder
npm install
cd frontend && npm install && cd ..

# 2. Build CLI
npm run build

# 3. Configure environment (see DEPLOYMENT_GUIDE.md)
cp .env.example .env
# Edit .env with your credentials

# 4. Start all services
./start-all.sh

# 5. Open browser
open http://localhost:3001
```

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete setup instructions
- **[OAuth Setup](OAUTH_SETUP.md)** - Google OAuth configuration
- **[OAuth Flow](OAUTH_FLOW.md)** - How authentication works
- **[Quick Reference](QUICK_REFERENCE.md)** - Command cheat sheet
- **[Existing Agents Guide](docs/existing-agents-guide.md)** - 🆕 Learn from your existing agents

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   User's Browser                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ http://localhost:3001
                     ↓
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Port 3001)                 │
│  • Login page with Google OAuth                        │
│  • Dashboard with agent management                     │
│  • Real-time progress tracking                         │
│  • Protected routes                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ API calls with JWT
                     ↓
┌─────────────────────────────────────────────────────────┐
│           OAuth Backend (Port 3000)                     │
│  • Google OAuth 2.0 (Passport.js)                      │
│  • Domain validation                                   │
│  • Workspace account checking                          │
│  • JWT token generation                                │
│  • Agent creation API                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Spawns process
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Agent Builder CLI                          │
│  • Extended thinking with Claude                       │
│  • Ultra-concise skill generation (200 token max)      │
│  • Knowledge base separation                           │
│  • Pattern learning from existing agents               │
│  • Multi-format output                                 │
│  • Self-improvement                                    │
└─────────────────────────────────────────────────────────┘
```

### Output Structure (v2.0)

```
📁 Generated Agent Output/
├── 📄 skill-1.md              # Ultra-concise (< 200 tokens)
│   ├── ## Trigger            # When to activate
│   ├── ## Steps              # What to do
│   ├── ## Example            # Usage demo
│   └── > See: [KB](...)      # Reference to knowledge base
│
├── 📄 skill-2.md              # Ultra-concise (< 200 tokens)
├── 📄 skill-N.md              # Ultra-concise (< 200 tokens)
│
├── 📚 knowledge-base.md       # Deep domain expertise
│   ├── ## Domain Expertise   # Industry knowledge
│   ├── ## Integration Points # API details, systems
│   ├── ## Best Practices     # Proven approaches
│   ├── ## Anti-Patterns      # What to avoid
│   └── ## Contextual Intel   # Adapt to audience/urgency
│
└── 📄 agents.md               # System overview
```

---

## 🔐 Security Features

### Domain Restrictions
Only specific company domains are allowed. Configure in `config/auth-domains.yaml`:

```yaml
allowed_domains:
  - trilogy.com
  - devfactory.com
  - aurea.com
  - vrya.com
```

### Workspace-Only Accounts
Personal Gmail accounts (@gmail.com) are automatically blocked. Only Google Workspace accounts from your company domains can access.

### JWT Authentication
- Secure token-based authentication
- 24-hour token expiration
- Stateless, scalable design

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Passport.js (Google OAuth)
- JWT for authentication
- Agent Builder CLI

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- React Router

**Agent Builder:**
- TypeScript CLI
- Anthropic Claude API
- Extended thinking capabilities
- Template-based code generation
- Ultra-concise skill generation (200 token max)
- Knowledge base separation architecture
- Pattern learning from existing agents

---

## 📋 Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Google Cloud Project**: For OAuth credentials
- **Anthropic API Key**: For agent creation

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Security
SESSION_SECRET=<random-32-byte-hex>
JWT_SECRET=<random-64-byte-hex>

# Application
PORT=3000
FRONTEND_URL=http://localhost:3001
NODE_ENV=development

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### Domain Configuration

Edit `config/auth-domains.yaml` to add your company domains.

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete configuration instructions.

---

## 🧪 Testing

```bash
# Check setup status
./check-setup.sh

# Test OAuth flow
open http://localhost:3001

# Test with allowed domain
# Login with: user@trilogy.com → ✅ Success

# Test with personal Gmail
# Login with: user@gmail.com → ❌ Blocked

# Test agent creation
# 1. Log in to dashboard
# 2. Fill in description: "A simple calculator"
# 3. Select format: Skill (ultra-concise, 200 token max)
# 4. Select language: TypeScript (or Python)
# 5. Click "Create Agent"
# 6. Monitor progress
# 7. Generated output includes:
#    - Multiple ultra-concise skill files (.md)
#    - knowledge-base.md with deep domain expertise
#    - agents.md index file

# Test learning from existing agents
# 1. Create a directory with sample agents
mkdir -p test-agents
# 2. Add your existing agent .md files
# 3. Run CLI with --existing-agents-dir option
node dist/index.js create "Your new agent" \
  --existing-agents-dir ./test-agents \
  --output skill
# 4. New agent will match the style of your examples!
```

---

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/config` | Get auth config |

### Agents (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/create` | Create agent |
| GET | `/api/agents` | List user's agents |
| GET | `/api/agents/:id` | Get agent details |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health |

---

## 🐛 Troubleshooting

### OAuth Issues

**Problem**: "redirect_uri_mismatch"
- **Solution**: Verify redirect URI in Google Cloud Console exactly matches GOOGLE_CALLBACK_URL

**Problem**: "org_internal" error
- **Solution**: Change OAuth consent screen to "External" or add test users

**Problem**: "Cannot GET /auth/callback"
- **Solution**: Check frontend vite.config.ts - should NOT have `/auth` proxy

### Agent Creation Issues

**Problem**: Agent creation fails
- **Solution**: Verify ANTHROPIC_API_KEY is set in .env

**Problem**: No progress updates
- **Solution**: Check logs: `tail -f /tmp/oauth-server.log`

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive troubleshooting.

---

## 📈 Roadmap

### Phase 1: Core (✅ Complete)
- [x] Google OAuth integration
- [x] Domain restrictions
- [x] React frontend
- [x] Agent creation UI
- [x] Protected routes
- [x] JWT authentication
- [x] Real agent creation
- [x] Ultra-concise skills (200 token max)
- [x] Knowledge base separation
- [x] Pattern learning from existing agents

### Phase 2: Enhancement (🔄 In Progress)
- [ ] Real-time agent build streaming
- [ ] Agent download functionality
- [ ] Database integration (PostgreSQL)
- [ ] Agent history and versioning
- [ ] WebSocket progress updates
- [ ] Knowledge base UI editor

### Phase 3: Enterprise (📋 Planned)
- [ ] User management UI
- [ ] Domain management admin panel
- [ ] Usage analytics
- [ ] Team collaboration
- [ ] Email notifications
- [ ] Audit logging

### Phase 4: Scale (🎯 Future)
- [ ] Multi-tenant support
- [ ] Rate limiting per user
- [ ] Queue-based agent building
- [ ] Distributed processing
- [ ] Cloud deployment templates

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- **Anthropic Claude** - Extended thinking and agent generation
- **Passport.js** - OAuth authentication
- **React** - Frontend framework
- **Tailwind CSS** - Beautiful styling

---

## 📞 Support

- **Documentation**: See [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/agent-builder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/agent-builder/discussions)

---

## 🎯 Quick Commands

```bash
# Start everything
./start-all.sh

# Check status
./check-setup.sh

# View logs
tail -f /tmp/oauth-server.log /tmp/frontend.log

# Stop everything
pkill -f oauth-server.js && pkill -f vite

# Restart backend only
pkill -f oauth-server.js && node oauth-server.js &
```

---

<div align="center">

**Built with ❤️ for secure, internal AI agent creation**

[⭐ Star on GitHub](https://github.com/YOUR_USERNAME/agent-builder) • [🐛 Report Bug](https://github.com/YOUR_USERNAME/agent-builder/issues) • [💡 Request Feature](https://github.com/YOUR_USERNAME/agent-builder/issues)

</div>
