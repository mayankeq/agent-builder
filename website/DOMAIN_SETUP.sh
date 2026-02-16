#!/bin/bash

# Synthient.dev Domain Setup Script
# Run this after purchasing domain

set -e  # Exit on error

echo "🚀 Synthient Domain Setup"
echo "================================"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Run this from the website directory"
    echo "   cd website && ./DOMAIN_SETUP.sh"
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Deploy to Vercel
echo "📤 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployed!"
echo ""

# Prompt for domain
read -p "📝 Enter your domain (e.g., getsynthient.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain cannot be empty"
    exit 1
fi

echo ""
echo "🔗 Adding custom domain: $DOMAIN"
vercel domains add "$DOMAIN"

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure DNS in your registrar:"
echo "   Type: CNAME"
echo "   Name: @"
echo "   Value: cname.vercel-dns.com"
echo ""
echo "   Type: CNAME"
echo "   Name: www"
echo "   Value: cname.vercel-dns.com"
echo ""
echo "2. Wait 5-10 minutes for DNS propagation"
echo ""
echo "3. Visit: https://$DOMAIN"
echo ""
echo "🔒 Note: .dev requires HTTPS (automatically provided by Vercel)"
echo ""
echo "Need help? Check DOMAIN_SETUP_GUIDE.md"
echo "================================"
