#!/bin/bash

# Agent-Builder One-Command Setup Script
# This script sets up the entire project with a single command

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
cat << "BANNER"
    ___                    __     ____        _ __    __
   /   | ____ ____  ____  / /_   / __ )__  __(_) /___/ /__  _____
  / /| |/ __ \/ _ \/ __ \/ __/  / __  / / / / / / __  / _ \/ ___/
 / ___ / /_/ /  __/ / / / /_   / /_/ / /_/ / / / /_/ /  __/ /
/_/  |_\__, /\___/_/ /_/\__/  /_____/\__,_/_/_/\__,_/\___/_/
      /____/

One-Command Setup Script
BANNER
echo -e "${NC}"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check prerequisites
echo ""
print_info "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed!"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker is installed"

if ! command_exists docker-compose; then
    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed!"
        echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi
print_success "Docker Compose is available"

if ! command_exists node; then
    print_warning "Node.js is not installed (optional for CLI usage)"
    echo "You can still use the web interface, but CLI won't work without Node.js"
    INSTALL_CLI=false
else
    NODE_VERSION=$(node -v)
    print_success "Node.js is installed ($NODE_VERSION)"
    INSTALL_CLI=true
fi

# Step 2: Setup environment file
echo ""
print_info "Setting up environment configuration..."

if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file from template"

    # Prompt for Anthropic API key
    echo ""
    print_info "You need an Anthropic API key to use Agent-Builder"
    echo "Get one free at: https://console.anthropic.com"
    echo ""
    read -p "Enter your Anthropic API key (or press Enter to skip): " api_key

    if [ -n "$api_key" ]; then
        # Update .env file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
        else
            # Linux
            sed -i "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
        fi
        print_success "API key configured"
    else
        print_warning "API key not configured. You'll need to add it to .env later"
    fi

    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i '' "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
    else
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
    fi
    print_success "Generated secure JWT and encryption keys"
else
    print_success ".env file already exists"
fi

# Step 3: Create artifacts directory
echo ""
print_info "Creating local storage directories..."
mkdir -p artifacts
print_success "Artifacts directory created"

# Step 4: Install Node.js dependencies (if Node.js is available)
if [ "$INSTALL_CLI" = true ]; then
    echo ""
    print_info "Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed"

    echo ""
    print_info "Building TypeScript code..."
    npm run build
    print_success "Build complete"
fi

# Step 5: Start Docker containers
echo ""
print_info "Starting Docker containers..."
echo "This will:"
echo "  - Start PostgreSQL database"
echo "  - Start Redis cache"
echo "  - Run database migrations"
echo "  - Start backend API server"
echo "  - Start frontend web application"
echo ""

$DOCKER_COMPOSE up -d

# Wait for services to be healthy
echo ""
print_info "Waiting for services to be healthy..."
sleep 10

# Check if backend is healthy
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo ""
    print_error "Backend failed to start. Check logs with: $DOCKER_COMPOSE logs backend"
    exit 1
fi

echo ""
print_success "All services are healthy!"

# Step 6: Display success message and next steps
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  🎉 Setup Complete! Agent-Builder is ready to use! 🎉    ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📱 Access the application:${NC}"
echo ""
echo -e "  🌐 Web Application:  ${GREEN}http://localhost:5173${NC}"
echo -e "  🔌 Backend API:      ${GREEN}http://localhost:3000${NC}"
echo -e "  🗄️  PostgreSQL:       ${GREEN}localhost:5432${NC}"
echo -e "  📦 Redis:            ${GREEN}localhost:6379${NC}"
echo ""

if [ "$INSTALL_CLI" = true ]; then
    echo -e "${BLUE}💻 CLI Usage:${NC}"
    echo ""
    echo -e "  Create an agent:     ${GREEN}npm run cli -- create \"Your agent description\"${NC}"
    echo -e "  Interactive mode:    ${GREEN}npm run cli -- create${NC}"
    echo -e "  List sessions:       ${GREEN}npm run cli -- list${NC}"
    echo ""
fi

echo -e "${BLUE}📚 Useful commands:${NC}"
echo ""
echo -e "  View logs:           ${GREEN}$DOCKER_COMPOSE logs -f${NC}"
echo -e "  Stop services:       ${GREEN}$DOCKER_COMPOSE down${NC}"
echo -e "  Restart services:    ${GREEN}$DOCKER_COMPOSE restart${NC}"
echo -e "  Stop & remove data:  ${GREEN}$DOCKER_COMPOSE down -v${NC}"
echo ""

echo -e "${BLUE}📖 Documentation:${NC}"
echo ""
echo -e "  Quick Start:         ${GREEN}docs/QUICK_START.md${NC}"
echo -e "  Full Documentation:  ${GREEN}docs/${NC}"
echo -e "  OAuth Setup:         ${GREEN}docs/OAUTH_USER_FLOW.md${NC}"
echo ""

if [ -z "$api_key" ]; then
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo ""
    echo "  You didn't configure an API key. To use Agent-Builder:"
    echo ""
    echo "  1. Get an API key from https://console.anthropic.com"
    echo "  2. Add it to .env file: ANTHROPIC_API_KEY=your-key-here"
    echo "  3. Restart backend: $DOCKER_COMPOSE restart backend"
    echo ""
fi

# Open browser (optional)
read -p "Open web browser now? (y/N): " open_browser
if [ "$open_browser" = "y" ] || [ "$open_browser" = "Y" ]; then
    print_info "Opening browser..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:5173
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:5173 2>/dev/null || print_info "Please open http://localhost:5173 in your browser"
    else
        print_info "Please open http://localhost:5173 in your browser"
    fi
fi

echo ""
print_success "Happy agent building! 🚀"
echo ""
