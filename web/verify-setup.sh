#!/bin/bash

# Agent Builder Web - Setup Verification Script
# This script checks if all required files are present and dependencies are installed

echo "🔍 Agent Builder Web - Setup Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to check file existence
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        ((FAILED++))
    fi
}

# Function to check directory existence
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        ((FAILED++))
    fi
}

echo "📋 Checking Configuration Files..."
check_file "package.json"
check_file "vite.config.ts"
check_file "tsconfig.json"
check_file "tsconfig.node.json"
check_file "tailwind.config.js"
check_file "postcss.config.js"
check_file ".eslintrc.cjs"
check_file ".gitignore"
check_file "index.html"
echo ""

echo "📚 Checking Documentation..."
check_file "README.md"
check_file "SETUP.md"
check_file "QUICK_REFERENCE.md"
check_file "FRONTEND_COMPLETE.md"
echo ""

echo "📁 Checking Directory Structure..."
check_dir "src"
check_dir "src/api"
check_dir "src/components"
check_dir "src/hooks"
check_dir "src/pages"
check_dir "src/store"
check_dir "src/types"
check_dir "src/utils"
echo ""

echo "🔧 Checking Core Application Files..."
check_file "src/main.tsx"
check_file "src/App.tsx"
check_file "src/index.css"
echo ""

echo "🌐 Checking API Layer..."
check_file "src/api/client.ts"
check_file "src/api/auth.ts"
check_file "src/api/sessions.ts"
check_file "src/api/apiKeys.ts"
check_file "src/api/downloads.ts"
check_file "src/api/examples.ts"
check_file "src/api/index.ts"
echo ""

echo "🎨 Checking Components..."
check_file "src/components/ErrorBoundary.tsx"
check_file "src/components/Loading.tsx"
check_file "src/components/StatusBadge.tsx"
check_file "src/components/ProgressBar.tsx"
check_file "src/components/Modal.tsx"
check_file "src/components/CodePreview.tsx"
check_file "src/components/WelcomeTutorial.tsx"
check_file "src/components/index.ts"
echo ""

echo "🪝 Checking Custom Hooks..."
check_file "src/hooks/useAuth.ts"
check_file "src/hooks/useSessions.ts"
check_file "src/hooks/useWebSocket.ts"
check_file "src/hooks/useApiKeys.ts"
check_file "src/hooks/useExamples.ts"
check_file "src/hooks/index.ts"
echo ""

echo "📄 Checking Pages..."
check_file "src/pages/LoginPage.tsx"
check_file "src/pages/OAuthCallbackPage.tsx"
check_file "src/pages/DashboardPage.tsx"
check_file "src/pages/CreateAgentPage.tsx"
check_file "src/pages/SessionDetailPage.tsx"
check_file "src/pages/SettingsPage.tsx"
check_file "src/pages/index.ts"
echo ""

echo "🔧 Checking Utilities..."
check_file "src/utils/format.ts"
check_file "src/utils/cn.ts"
check_file "src/utils/constants.ts"
check_file "src/utils/index.ts"
echo ""

echo "📦 Checking State Management..."
check_file "src/store/uiStore.ts"
echo ""

echo "📝 Checking Types..."
check_file "src/types/index.ts"
echo ""

echo "=========================================="
echo -e "Results: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All files are present!${NC}"
    echo ""

    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} node_modules/ (dependencies installed)"
    else
        echo -e "${YELLOW}⚠${NC} node_modules/ (not found)"
        echo ""
        echo "Run: npm install"
    fi

    echo ""
    echo "🚀 Ready to start development!"
    echo ""
    echo "Commands:"
    echo "  npm install        # Install dependencies (if needed)"
    echo "  npm run dev        # Start development server"
    echo "  npm run build      # Build for production"
    echo "  npm run type-check # Check TypeScript types"
    echo ""
else
    echo -e "${RED}❌ Some files are missing!${NC}"
    echo ""
    echo "Please ensure all files are created correctly."
    exit 1
fi
