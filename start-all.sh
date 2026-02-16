#!/bin/bash

# Start all Synthient services
# Run this after configuring OAuth credentials in .env

set -e

echo ""
echo "🚀 Starting Synthient"
echo "===================="
echo ""

# Check if credentials are configured
if grep -q "your-client-id.apps.googleusercontent.com" .env 2>/dev/null; then
    echo "⚠️  Warning: OAuth credentials not configured yet!"
    echo "   Please follow OAUTH_SETUP.md to get credentials"
    echo "   Opening Google Cloud Console..."
    open "https://console.cloud.google.com/apis/credentials" 2>/dev/null || true
    echo ""
    echo "   After getting credentials, update .env and run this script again"
    echo ""
    exit 1
fi

# Kill existing servers
echo "🧹 Cleaning up existing processes..."
pkill -f "oauth-server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Start OAuth server
echo "🔐 Starting OAuth server (port 3000)..."
node oauth-server.js > /tmp/oauth-server.log 2>&1 &
OAUTH_PID=$!
sleep 3

# Check OAuth server health
if curl -s http://localhost:3000/health > /dev/null; then
    echo "   ✅ OAuth server running (PID: $OAUTH_PID)"
else
    echo "   ❌ OAuth server failed to start"
    echo "   Check logs: tail -f /tmp/oauth-server.log"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend (port 3001)..."
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 5

# Check frontend
if curl -s http://localhost:3001 > /dev/null; then
    echo "   ✅ Frontend running (PID: $FRONTEND_PID)"
else
    echo "   ⚠️  Frontend may still be starting..."
    echo "   Check logs: tail -f /tmp/frontend.log"
fi

echo ""
echo "✅ All services started!"
echo ""
echo "📝 Services:"
echo "   • OAuth Backend: http://localhost:3000"
echo "   • Frontend App:  http://localhost:3001"
echo "   • Marketing:     website/index.html"
echo ""
echo "📊 Logs:"
echo "   • OAuth: tail -f /tmp/oauth-server.log"
echo "   • Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🎯 Next: Open http://localhost:3001 and log in!"
echo ""

# Keep script running to show logs
echo "Press Ctrl+C to stop all services"
echo ""
tail -f /tmp/oauth-server.log /tmp/frontend.log
