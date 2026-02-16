# 🤖 Synthient

## AI Agent Builder with Domain-Restricted Google OAuth

**Build production-ready LLM agents through a beautiful web interface. Secure, domain-restricted, internal deployment ready.**

---

## 🌟 What is Synthient?

Synthient is a comprehensive platform for creating LLM-based agents with:
- ✅ **Web-based UI** - No CLI needed, beautiful React interface
- ✅ **Google OAuth** - Secure authentication with domain restrictions
- ✅ **Internal-Only** - Deploy for your company domains only
- ✅ **Extended Thinking** - Claude's advanced reasoning capabilities
- ✅ **Multi-Format Output** - Skills, MCP servers, CLIs, or libraries
- ✅ **Real-Time Progress** - Watch your agent being built live

Perfect for companies that want to enable internal teams to build AI agents without compromising security.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
git clone https://github.com/YOUR_USERNAME/agent-builder.git
cd agent-builder
npm install
cd frontend && npm install && cd ..
```

### 2. Configure Google OAuth

**Get OAuth credentials:**

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
4. Copy Client ID and Secret

**Update `.env`:**

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

For detailed instructions, see [OAUTH_SETUP.md](OAUTH_SETUP.md)

### 3. Start Synthient

```bash
./start-all.sh
```

This starts:
- OAuth backend (port 3000)
- React frontend (port 3001)

### 4. Open and Login

Open http://localhost:3001 and sign in with your Google Workspace account!

---

## 🔐 Security Features

### Domain Restrictions

Only specific company domains are allowed. Edit `config/auth-domains.yaml`:

```yaml
allowed_domains:
  - trilogy.com
  - devfactory.com
  - aurea.com
  - vrya.com
```

### Workspace-Only Accounts

Personal Gmail accounts (@gmail.com) are **blocked**.
Only Google Workspace accounts from your company domains can access Synthient.

### JWT Authentication

- Secure token-based authentication
- 24-hour token expiration
- Stateless, scalable design

### Email Verification

Only verified Google accounts are accepted.

---

## 📁 Project Structure

```
synthient/
├── oauth-server.js              # OAuth backend (Express + Passport)
├── .env                         # OAuth credentials (keep secret!)
├── config/
│   └── auth-domains.yaml        # Allowed domains configuration
├── website/
│   └── index.html               # Marketing website
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx        # OAuth login page
│   │   │   ├── Dashboard.tsx    # Main dashboard
│   │   │   ├── AgentCreator.tsx # Agent creation form
│   │   │   └── AgentList.tsx    # List of user's agents
│   │   └── api/
│   │       └── client.ts        # API client with auth
│   └── package.json
├── src/                         # Core agent builder (TypeScript CLI)
│   ├── claude/
│   ├── agents/
│   ├── orchestration/
│   └── templates/
└── docs/
    ├── OAUTH_SETUP.md           # OAuth setup guide
    ├── OAUTH_FLOW.md            # How OAuth works
    ├── DEPLOYMENT.md            # Production deployment
    └── SETUP_COMPLETE.md        # Setup checklist
```

---

## 🎯 Features

### 🔐 Secure Authentication
- Google OAuth 2.0 integration
- Domain-restricted access
- Workspace-only validation
- JWT token authentication

### 🎨 Beautiful UI
- Modern React interface
- Real-time agent creation
- Progress tracking
- Agent management dashboard

### 🤖 Agent Creation
- **Input:** Natural language description
- **Output:** MCP server, CLI tool, library, or skill
- **Languages:** TypeScript or Python
- **Extended Thinking:** Claude's advanced reasoning

### 📊 Management
- View all your agents
- Track build progress
- Download completed agents
- Monitor build status

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [OAUTH_SETUP.md](OAUTH_SETUP.md) | Step-by-step OAuth configuration |
| [OAUTH_FLOW.md](OAUTH_FLOW.md) | How OAuth authentication works |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |
| [SETUP_COMPLETE.md](SETUP_COMPLETE.md) | Setup checklist and status |

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Passport.js (Google OAuth 2.0)
- JWT for authentication
- CORS for frontend integration

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- React Router (navigation)

**Agent Builder:**
- TypeScript CLI
- Anthropic Claude API
- Extended thinking capabilities
- Template-based code generation

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
# Google OAuth (required)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=yyy
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Security (auto-generated)
SESSION_SECRET=<random-64-byte-hex>
JWT_SECRET=<random-64-byte-hex>

# Application
PORT=3000
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001
NODE_ENV=development
```

### Domain Configuration

Edit `config/auth-domains.yaml`:

```yaml
allowed_domains:
  - your-company.com
  - subsidiary.com
```

Restart OAuth server after changes:

```bash
pkill -f oauth-server.js
node oauth-server.js
```

---

## 🚢 Deployment

### Development

```bash
./start-all.sh
```

### Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Google OAuth production setup
- Nginx configuration
- PM2 process management
- SSL/HTTPS setup
- Health checks and monitoring

---

## 📊 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate OAuth flow |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user (protected) |
| POST | `/api/auth/logout` | Logout user (protected) |
| GET | `/api/auth/config` | Get auth configuration |

### Agents (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/create` | Create new agent |
| GET | `/api/agents` | List user's agents |
| GET | `/api/agents/:id` | Get agent details |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

## 🧪 Testing

### Check Setup Status

```bash
./check-setup.sh
```

Shows:
- ✅ OAuth server status
- ✅ Frontend status
- ⚠️ OAuth credentials status
- ✅ Domain configuration
- ✅ File integrity

### Test OAuth Flow

1. Start services: `./start-all.sh`
2. Open: http://localhost:3001
3. Click "Continue with Google"
4. Sign in with workspace account (@your-company.com)
5. Should redirect to dashboard

### Test Domain Restrictions

Try with:
- ✅ Allowed domain: user@trilogy.com → **Success**
- ❌ Personal Gmail: user@gmail.com → **Blocked**
- ❌ Other domain: user@other.com → **Blocked**

---

## 🐛 Troubleshooting

### "Redirect URI mismatch"

**Solution:** Check Google Cloud Console redirect URI matches `.env`:
```
http://localhost:3000/api/auth/google/callback
```

### "Domain not authorized"

**Solution:** Add domain to `config/auth-domains.yaml` and restart server

### "Only Google Workspace accounts allowed"

**Solution:** Use company email, not personal Gmail (@gmail.com)

### Server not responding

**Check logs:**
```bash
tail -f /tmp/oauth-server.log
tail -f /tmp/frontend.log
```

**Check processes:**
```bash
ps aux | grep -E "(oauth-server|vite)"
```

**Restart services:**
```bash
./start-all.sh
```

---

## 📈 Roadmap

### Phase 1: Core (✅ Complete)
- [x] Google OAuth integration
- [x] Domain restrictions
- [x] React frontend
- [x] Agent creation UI
- [x] Protected routes
- [x] JWT authentication

### Phase 2: Enhancement (🔄 In Progress)
- [ ] Connect UI to agent builder CLI
- [ ] Real-time agent build streaming
- [ ] Agent download functionality
- [ ] Database integration (PostgreSQL)
- [ ] Agent history and versioning

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
- [ ] Cloud deployment templates (AWS, GCP, Azure)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of conduct
- Development setup
- Pull request process
- Coding standards

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

- **Documentation:** See [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/agent-builder/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/agent-builder/discussions)

---

## 🎉 Quick Commands Reference

```bash
# Setup OAuth credentials
cat OAUTH_SETUP.md

# Start all services
./start-all.sh

# Check setup status
./check-setup.sh

# View logs
tail -f /tmp/oauth-server.log /tmp/frontend.log

# Stop all services
pkill -f oauth-server.js && pkill -f vite

# Restart OAuth server only
pkill -f oauth-server.js && node oauth-server.js &

# Restart frontend only
cd frontend && pkill -f vite && npm run dev &
```

---

<div align="center">

**Built with ❤️ for secure, internal AI agent creation**

[⭐ Star on GitHub](https://github.com/YOUR_USERNAME/agent-builder) • [🐛 Report Bug](https://github.com/YOUR_USERNAME/agent-builder/issues) • [💡 Request Feature](https://github.com/YOUR_USERNAME/agent-builder/issues)

</div>
