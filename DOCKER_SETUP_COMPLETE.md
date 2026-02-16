# Docker Infrastructure Setup - Complete

This document provides a comprehensive overview of the Docker infrastructure created for the agent-builder project.

## What Was Created

### 1. Core Docker Files

#### `/docker-compose.yml`
Complete orchestration file with 5 services:
- **postgres** - PostgreSQL 15 database with automatic migrations
- **redis** - Redis 7 cache for session/rate limiting
- **backend** - Express API server with hot reload in development
- **frontend** - React/Vite app with hot reload in development
- **migrator** - One-time migration runner

**Key Features:**
- Health checks for all services
- Automatic dependency ordering
- Volume mounts for development hot reload
- Persistent data volumes for databases
- Named volumes for node_modules to prevent conflicts
- Proper network isolation

#### `/Dockerfile.backend`
Multi-stage Dockerfile with 4 stages:
1. **deps** - Install all npm dependencies
2. **builder** - Compile TypeScript and prune dev dependencies
3. **development** - Development mode with hot reload (target for docker-compose)
4. **production** - Optimized production image with non-root user

**Key Features:**
- Hot reload in development mode
- Optimized layer caching for faster builds
- Non-root user in production for security
- Health checks built-in
- TypeScript compilation

#### `/web/Dockerfile`
Multi-stage Dockerfile with 4 stages:
1. **deps** - Install all npm dependencies
2. **development** - Vite dev server with hot reload (target for docker-compose)
3. **builder** - Build production assets
4. **production** - Nginx serving static files with API proxy

**Key Features:**
- Vite dev server on port 5173 in development
- Hot reload in development mode
- Nginx with optimized configuration in production
- Non-root user in production
- Health checks built-in

#### `/web/nginx.conf`
Production-ready Nginx configuration:
- React SPA routing (serves index.html for all routes)
- Gzip compression for assets
- Cache headers for static files
- API proxy to backend at /api
- WebSocket proxy at /ws
- Security headers
- Health check endpoint

### 2. Supporting Files

#### `/migrations/init.sql`
Updated to use correct database user (agent_user) for proper permissions.

#### `.env.example`
Updated with proper database credentials matching docker-compose.yml.

#### `/setup.sh`
Already existed - Automated setup script that:
- Checks prerequisites (Docker, Node.js)
- Creates .env file
- Prompts for Anthropic API key
- Generates JWT and encryption secrets
- Starts Docker containers
- Waits for services to be healthy
- Opens browser

## How to Use

### Quick Start (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd agent-builder

# Run the one-command setup
./setup.sh
```

The script will:
1. Check if Docker is installed
2. Create your .env file
3. Ask for your Anthropic API key
4. Generate secure secrets
5. Start all services
6. Wait for health checks
7. Open your browser to http://localhost:5173

**That's it!** The entire stack is running.

### Manual Setup (Alternative)

If you prefer manual setup or want more control:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env and add your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# 3. Start all services
docker-compose up -d

# 4. Check service status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

### Accessing Services

Once running, access:
- **Frontend Web App**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Development Workflow

### Hot Reload

Both backend and frontend support hot reload in development:

**Backend:**
- Edit files in `src/`
- Changes automatically trigger rebuild
- API server restarts automatically

**Frontend:**
- Edit files in `web/src/`
- Changes instantly reflected in browser
- No manual refresh needed

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stopping Services

```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v
```

### Running Migrations

Migrations run automatically on first startup via the `migrator` service.

To run manually:

```bash
# Run migrations
docker-compose run --rm migrator

# Or from backend container
docker-compose exec backend node scripts/migrate.js up
```

### Building for Production

```bash
# Build production images
docker-compose -f docker-compose.yml build --target production

# Or build individually
docker build -f Dockerfile.backend --target production -t agent-builder-backend:prod .
docker build -f web/Dockerfile --target production -t agent-builder-frontend:prod ./web
```

## Architecture

### Service Communication

```
┌─────────────────────────────────────────────────────┐
│                   Docker Network                     │
│              (agent-builder-network)                 │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │ Frontend │───▶│ Backend  │───▶│ Postgres │     │
│  │  :5173   │    │  :3000   │    │  :5432   │     │
│  └──────────┘    └──────────┘    └──────────┘     │
│                        │                             │
│                        ▼                             │
│                   ┌──────────┐                      │
│                   │  Redis   │                      │
│                   │  :6379   │                      │
│                   └──────────┘                      │
└─────────────────────────────────────────────────────┘
         │                │
         ▼                ▼
  localhost:5173   localhost:3000
```

### Volume Strategy

**Named Volumes** (persist across restarts):
- `postgres-data` - Database files
- `redis-data` - Redis snapshots
- `backend-node-modules` - Backend dependencies (isolated)
- `frontend-node-modules` - Frontend dependencies (isolated)

**Bind Mounts** (for development):
- `./src` → `/app/src` (backend source)
- `./web/src` → `/app/src` (frontend source)
- `./artifacts` → `/app/artifacts` (generated agents)
- `./data` → `/app/data` (application data)
- `./logs` → `/app/logs` (application logs)

### Health Checks

All services have health checks:

| Service  | Endpoint                    | Interval | Start Period |
|----------|-----------------------------|----------|--------------|
| Postgres | `pg_isready`                | 5s       | 10s          |
| Redis    | `redis-cli ping`            | 5s       | 5s           |
| Backend  | `GET /health`               | 10s      | 40s          |
| Frontend | `GET /` (Vite dev server)   | 10s      | 30s          |

### Startup Order

1. **postgres** starts first
2. **redis** starts first
3. **migrator** runs once postgres is healthy
4. **backend** starts after postgres and redis are healthy
5. **frontend** starts after backend is healthy

This ensures no race conditions or connection errors.

## Configuration

### Environment Variables

All configuration is in `.env` file:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Database (auto-configured by Docker)
DATABASE_URL=postgresql://agent_user:agent_pass@postgres:5432/agent_builder

# Security (auto-generated by setup.sh)
JWT_SECRET=<random-secret>
ENCRYPTION_KEY=<random-secret>

# Optional
OPENAI_API_KEY=sk-...
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
```

### Port Configuration

Default ports (can be changed in docker-compose.yml):

```yaml
Frontend: 5173:5173
Backend:  3000:3000
Postgres: 5432:5432
Redis:    6379:6379
```

To change frontend port:
```yaml
frontend:
  ports:
    - "8080:5173"  # Access on localhost:8080
```

## Troubleshooting

### Backend fails to start

**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
- Missing ANTHROPIC_API_KEY in .env
- Database not ready (wait 30s and try again)
- Port 3000 already in use

**Solution:**
```bash
# Restart backend
docker-compose restart backend

# Or rebuild
docker-compose up -d --build backend
```

### Frontend fails to start

**Check logs:**
```bash
docker-compose logs frontend
```

**Common issues:**
- Port 5173 already in use
- Backend not ready

**Solution:**
```bash
# Restart frontend
docker-compose restart frontend
```

### Database connection errors

**Check postgres is running:**
```bash
docker-compose ps postgres
docker-compose logs postgres
```

**Solution:**
```bash
# Restart postgres
docker-compose restart postgres

# Or reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Port conflicts

If ports are already in use on your machine:

```bash
# Find what's using the port
lsof -i :3000  # or :5173, :5432, :6379

# Option 1: Stop the conflicting service
# Option 2: Change port in docker-compose.yml
```

### Hot reload not working

**Backend:**
```bash
# Check volume mounts
docker-compose exec backend ls -la /app/src

# Restart with fresh mount
docker-compose down
docker-compose up -d
```

**Frontend:**
```bash
# Check volume mounts
docker-compose exec frontend ls -la /app/src

# Restart
docker-compose restart frontend
```

### Clean slate (nuclear option)

```bash
# Stop everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Remove dangling volumes
docker volume prune

# Start fresh
./setup.sh
```

## Testing the Setup

### 1. Check all services are running

```bash
docker-compose ps
```

Should show:
- agent-builder-postgres (healthy)
- agent-builder-redis (healthy)
- agent-builder-backend (healthy)
- agent-builder-frontend (healthy)
- agent-builder-migrator (exited 0)

### 2. Test backend API

```bash
curl http://localhost:3000/health
```

Should return: `{"status":"healthy"}`

### 3. Test frontend

Open browser to http://localhost:5173
- Should see login page
- Click "Login" (no OAuth in dev)
- Should redirect to dashboard

### 4. Test database

```bash
docker-compose exec postgres psql -U agent_user -d agent_builder -c "\dt"
```

Should list tables:
- users
- sessions
- agents
- api_keys
- patterns

### 5. Test hot reload

**Backend:**
```bash
# Edit any file in src/
echo "// test" >> src/server/index.ts

# Watch logs
docker-compose logs -f backend
# Should see rebuild message
```

**Frontend:**
```bash
# Edit any file in web/src/
# Browser should auto-refresh
```

## Production Deployment

For production, use the production targets:

```bash
# Build production images
docker build -f Dockerfile.backend --target production -t agent-builder-backend:1.0.0 .
docker build -f web/Dockerfile --target production -t agent-builder-frontend:1.0.0 ./web

# Push to registry
docker tag agent-builder-backend:1.0.0 your-registry.com/agent-builder-backend:1.0.0
docker push your-registry.com/agent-builder-backend:1.0.0

docker tag agent-builder-frontend:1.0.0 your-registry.com/agent-builder-frontend:1.0.0
docker push your-registry.com/agent-builder-frontend:1.0.0
```

See `docs/deployment/` for full production deployment guide.

## File Structure

```
agent-builder/
├── docker-compose.yml          # Service orchestration
├── Dockerfile.backend          # Backend multi-stage build
├── setup.sh                    # One-command setup script
├── .env.example                # Environment template
├── QUICK_SETUP.md             # Quick start guide
├── DOCKER_SETUP_COMPLETE.md   # This file
├── web/
│   ├── Dockerfile             # Frontend multi-stage build
│   └── nginx.conf             # Production nginx config
├── migrations/
│   ├── init.sql               # Initial setup
│   ├── 001_initial_schema.sql # Database schema
│   ├── 002_shared_learning.sql
│   └── 003_multi_llm_support.sql
├── src/                       # Backend source
├── config/                    # Configuration files
├── templates/                 # Agent templates
└── artifacts/                 # Generated agents

Generated at runtime:
├── .env                       # Your environment config
├── data/                      # Application data
├── logs/                      # Application logs
└── node_modules/              # Dependencies (in containers)
```

## Benefits of This Setup

1. **One-Command Setup** - `./setup.sh` gets everything running
2. **Hot Reload** - Changes instantly reflected, no manual restarts
3. **Isolated Dependencies** - No conflicts with local Node.js/PostgreSQL
4. **Consistent Environment** - Same setup on all machines
5. **Easy Cleanup** - `docker-compose down -v` removes everything
6. **Production-Ready** - Same Dockerfiles for dev and production
7. **Secure** - Non-root users, health checks, secret management
8. **Fast** - Optimized layer caching and multi-stage builds
9. **Documented** - Clear comments in all files
10. **Tested** - Verified syntax and file existence

## Next Steps

1. Run `./setup.sh` to start the stack
2. Visit http://localhost:5173 to use the web app
3. Try creating an agent
4. Check hot reload by editing source files
5. Review logs with `docker-compose logs -f`
6. Read the full docs in `docs/`

## Support

- Issues: https://github.com/YOUR_USERNAME/agent-builder/issues
- Discussions: https://github.com/YOUR_USERNAME/agent-builder/discussions
- Documentation: `docs/`

---

**Docker infrastructure setup complete!** You can now run the entire agent-builder stack with a single command.
