# Quick Setup - One Command Installation

Get Agent-Builder running locally in **under 5 minutes** with a single command!

## Prerequisites

Only two things needed:
1. **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
2. **Anthropic API Key** (free) - [Get one here](https://console.anthropic.com)

That's it! No PostgreSQL, no Redis, no complex setup.

## One-Command Setup

```bash
git clone https://github.com/YOUR_USERNAME/agent-builder.git
cd agent-builder
./setup.sh
```

The setup script will:
1. ✅ Check for Docker
2. ✅ Create configuration files
3. ✅ Prompt for your API key
4. ✅ Start PostgreSQL + Redis (in Docker)
5. ✅ Run database migrations automatically
6. ✅ Start backend API
7. ✅ Start frontend web app
8. ✅ Open your browser

**Total time: ~3 minutes** ⏱️

## What You Get

After `./setup.sh` completes:

- 🌐 **Web Application**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:3000
- 🗄️ **PostgreSQL**: localhost:5432
- 📦 **Redis**: localhost:6379

All running in Docker containers!

## Usage

### Web Application

1. Open http://localhost:5173
2. Click "Login" (no OAuth needed in development)
3. Enter your API key once
4. Start creating agents!

### CLI Tool

```bash
# Create an agent
npm run cli -- create "A web scraper for product prices"

# Interactive mode
npm run cli -- create

# List your sessions
npm run cli -- list
```

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Restart services
docker-compose restart

# Stop and remove all data
docker-compose down -v
```

## Manual Setup (Alternative)

If you prefer manual setup or don't have Docker:

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql-15
sudo systemctl start postgresql

# Create database
createdb agent_builder
```

### 2. Install Redis (Optional)

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

### 3. Install Dependencies

```bash
npm install
cd web && npm install && cd ..
```

### 4. Setup Environment

```bash
cp .env.example .env
# Edit .env and add your API key
```

### 5. Run Migrations

```bash
psql agent_builder < migrations/001_initial_schema.sql
psql agent_builder < migrations/002_shared_learning.sql
psql agent_builder < migrations/003_multi_llm_support.sql
```

### 6. Start Services

```bash
# Terminal 1: Backend
npm run start:server

# Terminal 2: Frontend
cd web && npm run dev
```

## Troubleshooting

### "Docker is not running"

Start Docker Desktop, then run `./setup.sh` again.

### "Port 5432 already in use"

You have PostgreSQL running locally. Either:
- Stop local PostgreSQL: `brew services stop postgresql` (macOS)
- Change port in docker-compose.yml: `5432:5432` → `5433:5432`

### "Backend failed to start"

Check logs:
```bash
docker-compose logs backend
```

Common issues:
- Missing API key in .env
- Database not ready (wait 30s and try again)

### "npm command not found"

Install Node.js: https://nodejs.org/

The web app will still work without Node.js (Docker only), but CLI won't.

## Next Steps

- 📖 Read the [Full Documentation](docs/)
- 🎓 Follow the [Tutorial](docs/tutorial.md)
- 🔐 Setup [OAuth](docs/OAUTH_USER_FLOW.md) for production
- 💡 See [Examples](examples/)

## Support

- 🐛 [Report Issues](https://github.com/YOUR_USERNAME/agent-builder/issues)
- 💬 [Ask Questions](https://github.com/YOUR_USERNAME/agent-builder/discussions)
- 📖 [Read Docs](docs/)

---

**Ready in 3 minutes. No complex setup. Just works.** ✨
