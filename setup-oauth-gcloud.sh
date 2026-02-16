#!/bin/bash

set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
ACCOUNT=$(gcloud config get-value account 2>/dev/null)

echo ""
echo "🔐 Automated Google OAuth Setup"
echo "================================"
echo ""
echo "Project: $PROJECT_ID"
echo "Account: $ACCOUNT"
echo ""

# Check if APIs are enabled
echo "📋 Step 1: Enabling required APIs..."
echo "───────────────────────────────────────"

# Enable OAuth Consent API
gcloud services enable iap.googleapis.com --project=$PROJECT_ID 2>/dev/null && echo "✅ IAP API enabled" || echo "⚠️  IAP API already enabled"

echo ""
echo "⚠️  OAuth Client Creation Limitation"
echo "─────────────────────────────────────"
echo ""
echo "Unfortunately, gcloud CLI doesn't support creating OAuth client IDs directly."
echo "Google requires this to be done through the Cloud Console web UI for security."
echo ""
echo "I'll open the correct page with pre-filled project context..."
echo ""

# Construct the URL with project context
OAUTH_URL="https://console.cloud.google.com/apis/credentials/oauthclient?project=${PROJECT_ID}"

echo "Opening: $OAUTH_URL"
echo ""

sleep 2
open "$OAUTH_URL" 2>/dev/null || xdg-open "$OAUTH_URL" 2>/dev/null || echo "Please open: $OAUTH_URL"

echo ""
echo "📋 In the browser, follow these steps:"
echo "─────────────────────────────────────"
echo ""
echo "1. If prompted 'Configure Consent Screen':"
echo "   → Click 'Configure Consent Screen'"
echo "   → User Type: Internal"
echo "   → App name: Synthient"
echo "   → User support email: $ACCOUNT"
echo "   → Developer contact: $ACCOUNT"
echo "   → Click 'Save and Continue' (3 times through all steps)"
echo "   → Click 'Back to Dashboard'"
echo "   → Click 'Credentials' in left menu"
echo "   → Click 'Create Credentials' → 'OAuth client ID'"
echo ""
echo "2. Create OAuth Client ID:"
echo "   → Application type: Web application"
echo "   → Name: Synthient OAuth Client"
echo "   → Authorized JavaScript origins:"
echo "     • Add URI: http://localhost:3000"
echo "   → Authorized redirect URIs:"
echo "     • Add URI: http://localhost:3000/api/auth/google/callback"
echo "   → Click 'CREATE'"
echo ""
echo "3. Copy credentials:"
echo "   → Copy the 'Client ID'"
echo "   → Copy the 'Client Secret'"
echo ""

echo "Press Enter when you have the credentials ready..."
read

echo ""
echo "📝 Enter your OAuth credentials:"
echo "────────────────────────────────"
echo ""
read -p "Client ID: " CLIENT_ID
read -p "Client Secret: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo ""
    echo "❌ Error: Both Client ID and Secret are required"
    exit 1
fi

echo ""
echo "✅ Credentials received!"
echo ""
echo "📝 Updating .env file..."

# Backup existing .env
cp .env .env.backup.$(date +%s)

# Update .env file
sed -i.tmp "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=${CLIENT_ID}|g" .env
sed -i.tmp "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}|g" .env
rm .env.tmp 2>/dev/null || true

echo "✅ .env file updated!"
echo ""
echo "🔄 Restarting OAuth server..."

# Kill existing server
pkill -f oauth-server.js 2>/dev/null || true
sleep 2

# Start new server
node oauth-server.js > /tmp/oauth-server.log 2>&1 &
SERVER_PID=$!

sleep 3

# Check if server started
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ OAuth server restarted (PID: $SERVER_PID)"
else
    echo "❌ Server failed to start. Check logs:"
    echo "   tail -f /tmp/oauth-server.log"
    exit 1
fi

echo ""
echo "🧪 Testing OAuth configuration..."
sleep 2

HEALTH=$(curl -s http://localhost:3000/health)
echo "Health check: $HEALTH"

echo ""
echo "════════════════════════════════════════"
echo ""
echo "✅ OAuth Setup Complete!"
echo ""
echo "🎯 Next step:"
echo "   Open http://localhost:3001"
echo "   Click 'Continue with Google'"
echo "   Sign in with: $ACCOUNT"
echo ""
echo "Your .env backup: .env.backup.*"
echo ""

