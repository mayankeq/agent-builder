#!/bin/bash

# Quick domain availability checker
# Checks if domains are registered

echo "🔍 Checking Domain Availability..."
echo "=================================="
echo ""

domains=(
    "synthient.ai"
    "synthient.io"
    "getsynthient.dev"
    "getsynthient.com"
    "usesynthient.com"
    "synthient.app"
    "build-synthient.com"
    "agent-builder.dev"
    "agent-builder.ai"
    "buildagents.dev"
    "buildagents.ai"
)

for domain in "${domains[@]}"; do
    echo -n "Checking $domain ... "

    # Use whois to check availability
    if whois "$domain" 2>/dev/null | grep -qi "No match\|NOT FOUND\|No Data Found\|not found"; then
        echo "✅ AVAILABLE"
    else
        echo "❌ Taken"
    fi

    sleep 1  # Be nice to whois servers
done

echo ""
echo "=================================="
echo "💡 Recommendations:"
echo ""
echo "Best options:"
echo "  • .ai domains - Perfect for AI products ($60-100/year)"
echo "  • .dev domains - Developer-focused ($10-15/year)"
echo "  • .io domains - Tech startups ($30-40/year)"
echo "  • .com domains - Traditional, trusted ($12-15/year)"
echo ""
echo "Cost comparison:"
echo "  Cheapest: .dev ($10/year)"
echo "  Best for AI: .ai ($60-100/year)"
echo "  Best overall: .com ($12/year)"
