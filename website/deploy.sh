#!/bin/bash

# Synthient Website Deployment Script
# Run this to deploy to Vercel

set -e

echo "🚀 Deploying Synthient to Vercel..."
echo ""

cd "$(dirname "$0")"

# Deploy to production
echo "📤 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next step: Add your custom domain getsynthient.com"
echo "Run: vercel domains add getsynthient.com"
echo ""
