#!/bin/bash

# Setup Google OAuth for Synthient
# This script helps configure Google OAuth credentials

echo "🔐 Synthient Google OAuth Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Check if credentials are configured
if grep -q "your-client-id.apps.googleusercontent.com" .env 2>/dev/null; then
    echo "⚠️  Google OAuth credentials not configured yet"
    echo ""
    echo "📋 Steps to get credentials:"
    echo ""
    echo "1. Go to: https://console.cloud.google.com/apis/credentials"
    echo "2. Create project or select existing"
    echo "3. Click 'Create Credentials' → 'OAuth client ID'"
    echo "4. Application type: 'Web application'"
    echo "5. Name: 'Synthient'"
    echo "6. Authorized JavaScript origins:"
    echo "   - http://localhost:3000"
    echo "7. Authorized redirect URIs:"
    echo "   - http://localhost:3000/api/auth/google/callback"
    echo "8. Click 'Create'"
    echo "9. Copy the Client ID and Client Secret"
    echo ""
    echo "💡 Then update .env file:"
    echo "   GOOGLE_CLIENT_ID=<your-client-id>"
    echo "   GOOGLE_CLIENT_SECRET=<your-client-secret>"
    echo ""

    # Open browser to Google Console
    if command -v open &> /dev/null; then
        read -p "Open Google Cloud Console now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://console.cloud.google.com/apis/credentials"
        fi
    fi

    exit 0
fi

echo "✅ Google OAuth credentials found in .env"
echo ""

# Extract and display (masked)
CLIENT_ID=$(grep GOOGLE_CLIENT_ID .env | cut -d '=' -f2)
MASKED_ID="${CLIENT_ID:0:20}...${CLIENT_ID: -15}"
echo "Client ID: $MASKED_ID"
echo ""

echo "🚀 Starting OAuth server..."
node oauth-server.js
