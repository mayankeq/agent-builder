#!/bin/bash

# Check Synthient setup status

echo ""
echo "🔍 Synthient Setup Status Check"
echo "================================"
echo ""

# Check OAuth server
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ OAuth server: Running (port 3000)"
    curl -s http://localhost:3000/health | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"   Status: {data['status']}, OAuth: {data['oauth']}\")"
else
    echo "❌ OAuth server: Not running"
    echo "   Start with: node oauth-server.js"
fi

echo ""

# Check frontend
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend: Running (port 3001)"
else
    echo "❌ Frontend: Not running"
    echo "   Start with: cd frontend && npm run dev"
fi

echo ""

# Check OAuth credentials
if grep -q "your-client-id.apps.googleusercontent.com" .env 2>/dev/null; then
    echo "⚠️  OAuth credentials: Not configured"
    echo "   ℹ️  Using placeholder values"
    echo "   📋 Follow OAUTH_SETUP.md to get credentials"
else
    echo "✅ OAuth credentials: Configured"
    CLIENT_ID=$(grep GOOGLE_CLIENT_ID .env | cut -d'=' -f2 | head -c 50)
    echo "   Client ID: ${CLIENT_ID}..."
fi

echo ""

# Check allowed domains
if [ -f "config/auth-domains.yaml" ]; then
    echo "✅ Domain configuration: Found"
    echo "   Allowed domains:"
    grep "  - " config/auth-domains.yaml | sed 's/^/   /'
else
    echo "❌ Domain configuration: Missing"
    echo "   Expected: config/auth-domains.yaml"
fi

echo ""

# Check files
echo "📁 Key files:"
FILES=(
    "oauth-server.js:OAuth backend"
    ".env:Environment config"
    "frontend/src/components/Login.tsx:Login component"
    "frontend/src/components/AuthCallback.tsx:OAuth callback"
    "config/auth-domains.yaml:Domain config"
    "OAUTH_SETUP.md:Setup guide"
)

for file_desc in "${FILES[@]}"; do
    IFS=: read -r file desc <<< "$file_desc"
    if [ -f "$file" ]; then
        echo "   ✅ $desc"
    else
        echo "   ❌ $desc (missing: $file)"
    fi
done

echo ""

# Check package dependencies
if [ -d "node_modules" ]; then
    echo "✅ Dependencies: Installed (root)"
else
    echo "❌ Dependencies: Not installed"
    echo "   Run: npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo "✅ Dependencies: Installed (frontend)"
else
    echo "❌ Dependencies: Not installed"
    echo "   Run: cd frontend && npm install"
fi

echo ""
echo "================================"
echo ""

# Overall status
if grep -q "your-client-id.apps.googleusercontent.com" .env 2>/dev/null; then
    echo "📋 Next step: Configure OAuth credentials"
    echo "   1. Open: https://console.cloud.google.com/apis/credentials"
    echo "   2. Follow: OAUTH_SETUP.md"
    echo "   3. Update: .env file"
    echo "   4. Run: ./start-all.sh"
else
    if curl -s http://localhost:3000/health > /dev/null 2>&1 && curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ All systems operational!"
        echo "   App: http://localhost:3001"
        echo "   Backend: http://localhost:3000"
    else
        echo "⚠️  Services not running"
        echo "   Run: ./start-all.sh"
    fi
fi

echo ""
