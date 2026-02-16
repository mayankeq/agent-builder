#!/bin/bash

# =============================================================================
# Docker Setup Verification Script
# =============================================================================
# This script verifies that all Docker infrastructure files are properly
# configured and ready to use. Run this before attempting to start services.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Print functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    PASSED=$((PASSED + 1))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    FAILED=$((FAILED + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Start verification
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║     Docker Setup Verification for Agent-Builder       ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# =============================================================================
# Section 1: Check Prerequisites
# =============================================================================
print_section "1. Checking Prerequisites"

if command_exists docker; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_success "Docker installed (version $DOCKER_VERSION)"
else
    print_error "Docker is not installed"
    echo "   Install from: https://docs.docker.com/get-docker/"
fi

if command_exists docker-compose; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    print_success "docker-compose installed (version $COMPOSE_VERSION)"
    DOCKER_COMPOSE="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version | awk '{print $3}' | sed 's/,//')
    print_success "docker compose (plugin) installed (version $COMPOSE_VERSION)"
    DOCKER_COMPOSE="docker compose"
else
    print_error "Docker Compose is not installed"
    echo "   Install from: https://docs.docker.com/compose/install/"
fi

if command_exists node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed ($NODE_VERSION)"
else
    print_warning "Node.js not installed (optional for CLI)"
fi

if command_exists curl; then
    print_success "curl installed (needed for health checks)"
else
    print_error "curl is not installed"
fi

# =============================================================================
# Section 2: Check Required Files
# =============================================================================
print_section "2. Checking Required Files"

required_files=(
    "setup.sh:Automated setup script"
    ".env.example:Environment template"
    "docker-compose.yml:Service orchestration"
    "Dockerfile.backend:Backend container"
    "web/Dockerfile:Frontend container"
    "web/nginx.conf:Nginx configuration"
    "QUICK_SETUP.md:Quick start guide"
    "migrations/init.sql:Database init"
    "migrations/001_initial_schema.sql:Schema migration"
)

for file_desc in "${required_files[@]}"; do
    file="${file_desc%%:*}"
    desc="${file_desc##*:}"
    if [ -f "$file" ]; then
        print_success "$file ($desc)"
    else
        print_error "$file is missing"
    fi
done

# Check if setup.sh is executable
if [ -x "setup.sh" ]; then
    print_success "setup.sh is executable"
else
    print_warning "setup.sh is not executable (run: chmod +x setup.sh)"
fi

# =============================================================================
# Section 3: Verify File Syntax
# =============================================================================
print_section "3. Verifying File Syntax"

# Check docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    if $DOCKER_COMPOSE config > /dev/null 2>&1; then
        print_success "docker-compose.yml syntax is valid"
    else
        print_error "docker-compose.yml has syntax errors"
        $DOCKER_COMPOSE config 2>&1 | head -5
    fi
fi

# Check setup.sh
if [ -f "setup.sh" ]; then
    if bash -n setup.sh 2>/dev/null; then
        print_success "setup.sh bash syntax is valid"
    else
        print_error "setup.sh has syntax errors"
    fi
fi

# Check Dockerfiles for basic syntax
if [ -f "Dockerfile.backend" ]; then
    if grep -q "^FROM" Dockerfile.backend; then
        print_success "Dockerfile.backend has valid FROM instruction"
    else
        print_error "Dockerfile.backend missing FROM instruction"
    fi
fi

if [ -f "web/Dockerfile" ]; then
    if grep -q "^FROM" web/Dockerfile; then
        print_success "web/Dockerfile has valid FROM instruction"
    else
        print_error "web/Dockerfile missing FROM instruction"
    fi
fi

# =============================================================================
# Section 4: Check Configuration Consistency
# =============================================================================
print_section "4. Checking Configuration Consistency"

# Check database credentials match
DB_USER_COMPOSE=$(grep "POSTGRES_USER" docker-compose.yml | head -1 | awk '{print $3}')
DB_USER_ENV=$(grep "DATABASE_URL" .env.example | cut -d'/' -f3 | cut -d':' -f1)

if [ "$DB_USER_COMPOSE" = "$DB_USER_ENV" ]; then
    print_success "Database username consistent across files"
else
    print_warning "Database username mismatch (compose: $DB_USER_COMPOSE, env: $DB_USER_ENV)"
fi

# Check all required services are defined
services=("postgres" "redis" "backend" "frontend" "migrator")
for service in "${services[@]}"; do
    if grep -q "^  $service:" docker-compose.yml; then
        print_success "Service '$service' defined in docker-compose.yml"
    else
        print_error "Service '$service' missing from docker-compose.yml"
    fi
done

# =============================================================================
# Section 5: Check Port Availability
# =============================================================================
print_section "5. Checking Port Availability"

ports=(5432 6379 3000 5173)
port_names=("PostgreSQL" "Redis" "Backend" "Frontend")

for i in "${!ports[@]}"; do
    port=${ports[$i]}
    name=${port_names[$i]}

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port ($name) is already in use"
        echo "   Process: $(lsof -Pi :$port -sTCP:LISTEN | tail -n 1 | awk '{print $1}')"
    else
        print_success "Port $port ($name) is available"
    fi
done

# =============================================================================
# Section 6: Check Docker Service Status
# =============================================================================
print_section "6. Checking Docker Service"

if docker info >/dev/null 2>&1; then
    print_success "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    echo "   Start Docker Desktop or run: sudo systemctl start docker"
fi

# =============================================================================
# Section 7: Check Disk Space
# =============================================================================
print_section "7. Checking System Resources"

# Check disk space (need at least 5GB free)
if command_exists df; then
    FREE_SPACE=$(df -h . | tail -1 | awk '{print $4}' | sed 's/G.*//')
    if [ "$FREE_SPACE" ]; then
        if [ "${FREE_SPACE%.*}" -gt 5 ]; then
            print_success "Sufficient disk space available (${FREE_SPACE}G free)"
        else
            print_warning "Low disk space (${FREE_SPACE}G free, recommend 5GB+)"
        fi
    fi
fi

# Check memory
if command_exists free; then
    FREE_MEM=$(free -g | grep Mem | awk '{print $7}')
    if [ "$FREE_MEM" -gt 2 ]; then
        print_success "Sufficient memory available (${FREE_MEM}GB free)"
    else
        print_warning "Low memory (${FREE_MEM}GB free, recommend 4GB+)"
    fi
elif command_exists vm_stat; then
    # macOS
    FREE_MEM=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    FREE_GB=$((FREE_MEM * 4096 / 1024 / 1024 / 1024))
    if [ "$FREE_GB" -gt 2 ]; then
        print_success "Sufficient memory available (~${FREE_GB}GB free)"
    else
        print_warning "Low memory (~${FREE_GB}GB free, recommend 4GB+)"
    fi
fi

# =============================================================================
# Section 8: Check Environment Configuration
# =============================================================================
print_section "8. Checking Environment Configuration"

if [ -f ".env" ]; then
    print_warning ".env file already exists (will be used instead of .env.example)"

    # Check for API key
    if grep -q "ANTHROPIC_API_KEY=sk-ant-" .env; then
        print_success "Anthropic API key configured in .env"
    else
        print_warning "Anthropic API key not configured in .env"
    fi
else
    print_info ".env file not found (will be created by setup.sh)"
fi

# =============================================================================
# Final Summary
# =============================================================================
print_section "Verification Summary"

echo ""
echo -e "Results:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed: $FAILED${NC}"
fi
if [ $WARNINGS -gt 0 ]; then
    echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║  ✓ Verification Passed!                                ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║  Your Docker setup is ready to use.                   ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║  Next steps:                                           ║${NC}"
    echo -e "${GREEN}║  1. Run ./setup.sh to start all services              ║${NC}"
    echo -e "${GREEN}║  2. Access http://localhost:5173                       ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}║  ✗ Verification Failed!                                ║${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}║  Please fix the errors above before proceeding.       ║${NC}"
    echo -e "${RED}║                                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
