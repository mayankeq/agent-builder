# Docker Quick Reference Card

## One-Command Setup

```bash
./setup.sh
```

That's it! Everything will be running in ~3 minutes.

## Access Your Application

| Service | URL |
|---------|-----|
| Web App | http://localhost:5173 |
| API | http://localhost:3000 |
| Health | http://localhost:3000/health |

## Common Commands

### Starting & Stopping

```bash
# Start everything
docker-compose up -d

# Stop everything (keeps data)
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Restart a service
docker-compose restart backend
docker-compose restart frontend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Checking Status

```bash
# List all services
docker-compose ps

# Check if healthy
docker-compose ps | grep healthy
```

### Rebuilding

```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Database

```bash
# Connect to database
docker-compose exec postgres psql -U agent_user -d agent_builder

# List tables
docker-compose exec postgres psql -U agent_user -d agent_builder -c "\dt"

# Run migrations manually
docker-compose exec backend node scripts/migrate.js up

# Backup database
docker-compose exec postgres pg_dump -U agent_user agent_builder > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U agent_user -d agent_builder
```

### Redis

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check keys
docker-compose exec redis redis-cli KEYS '*'

# Flush all data
docker-compose exec redis redis-cli FLUSHALL
```

### Debugging

```bash
# Enter backend container
docker-compose exec backend sh

# Enter frontend container
docker-compose exec frontend sh

# View backend files
docker-compose exec backend ls -la /app

# Check backend environment
docker-compose exec backend env | grep -E "DATABASE|API_KEY"
```

### Development

```bash
# Edit backend code - hot reload automatic
vim src/server/index.ts

# Edit frontend code - hot reload automatic
vim web/src/App.tsx

# Install new backend dependency
docker-compose exec backend npm install <package>
docker-compose restart backend

# Install new frontend dependency
docker-compose exec frontend npm install <package>
docker-compose restart frontend
```

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove all containers and volumes
docker-compose down -v

# Remove all Docker images
docker-compose down --rmi all

# Remove unused Docker resources
docker system prune -a
```

## Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3000  # or :5173, :5432, :6379

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Service Won't Start

```bash
# Check logs
docker-compose logs <service>

# Restart service
docker-compose restart <service>

# Rebuild service
docker-compose up -d --build <service>

# Nuclear option (fresh start)
docker-compose down -v
./setup.sh
```

### Database Connection Errors

```bash
# Check postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Wait for postgres to be ready
docker-compose exec postgres pg_isready -U agent_user
```

### Hot Reload Not Working

```bash
# Restart the service
docker-compose restart backend  # or frontend

# Check volume mounts
docker-compose exec backend ls -la /app/src
docker-compose exec frontend ls -la /app/src

# Full restart
docker-compose down
docker-compose up -d
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up everything
docker system prune -a --volumes

# Remove old images
docker image prune -a

# Remove old volumes
docker volume prune
```

## Verification Script

Before running setup, verify everything is ready:

```bash
./verify-docker-setup.sh
```

This checks:
- Docker is installed and running
- All required files exist
- Syntax is valid
- Ports are available
- Configuration is consistent

## Environment Variables

Edit `.env` file to configure:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional
OPENAI_API_KEY=sk-...
LOG_LEVEL=debug
NODE_ENV=development
```

After editing, restart services:

```bash
docker-compose restart backend
```

## Production Build

```bash
# Build production images
docker build -f Dockerfile.backend --target production -t agent-builder-backend:prod .
docker build -f web/Dockerfile --target production -t agent-builder-frontend:prod ./web

# Run production locally
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

```bash
# Watch resource usage
docker stats

# Watch logs in real-time
docker-compose logs -f --tail=100

# Check health status
curl http://localhost:3000/health
curl http://localhost:5173
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'
alias dcrestart='docker-compose restart'
alias dcrebuild='docker-compose up -d --build'
```

Then use:

```bash
dcup          # Start all services
dclogs        # View all logs
dcps          # List services
dcrestart backend  # Restart backend
```

## File Locations

```
docker-compose.yml          # Service orchestration
Dockerfile.backend          # Backend container
web/Dockerfile             # Frontend container
.env                       # Your configuration (created by setup.sh)
.env.example               # Configuration template
verify-docker-setup.sh     # Pre-flight checks
setup.sh                   # One-command setup
```

## Documentation

- **This file** - Quick reference
- **DOCKER_SETUP_COMPLETE.md** - Comprehensive guide
- **DOCKER_INFRASTRUCTURE_SUMMARY.md** - Overview
- **QUICK_SETUP.md** - Getting started

## Support

Need help?
1. Check logs: `docker-compose logs -f`
2. Run verification: `./verify-docker-setup.sh`
3. Read docs: `DOCKER_SETUP_COMPLETE.md`
4. Clean slate: `docker-compose down -v && ./setup.sh`

---

**Keep this file handy for daily development!**
